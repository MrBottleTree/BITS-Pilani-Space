import http from 'k6/http';
import { check, sleep, group, fail } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// --- 1. CONFIGURATION & UTILS ---
const BASE_URL = __ENV.API_URL || 'http://192.168.31.193:3000/api/v1';

// --- 2. CUSTOM METRICS ---
// We split trends by operation to see exactly which endpoint is the bottleneck
const t_signup = new Trend('duration_signup');
const t_signin = new Trend('duration_signin');
const t_refresh = new Trend('duration_refresh');
const t_signout = new Trend('duration_signout');
const t_delete_me = new Trend('duration_delete_me'); // High Risk: Double Argon2
const t_batch_delete = new Trend('duration_batch_delete'); // High Risk: DB Locking

// Success Rates (Use these to fail the build in CI/CD)
const failureRate = new Rate('failed_requests');
const successLifecycle = new Counter('complete_user_lifecycles');

export const options = {
  // We need the body to debug errors and extract tokens
  discardResponseBodies: false,
  
  scenarios: {
    // SCENARIO A: The "Morning Rush" (Regular Users)
    // Simulates normal user traffic ramping up
    user_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },  // Warmup
        { duration: '1m',  target: 50 },  // Load
        { duration: '1m',  target: 100 }, // Stress (Argon2 saturation point)
        { duration: '30s', target: 0 },   // Cooldown
      ],
      gracefulStop: '10s',
    },

    // SCENARIO B: The "Admin Maintenance" (Background Ops)
    // Simulates admins running heavy batch jobs WHILE users are trying to login
    admin_tasks: {
      executor: 'constant-vus',
      vus: 2, // 2 dedicated admins working constantly
      duration: '3m',
    },
  },

  thresholds: {
    // Fail if more than 1% of requests fail
    'failed_requests': ['rate<0.01'], 
    
    // Refresh must be instantaneous (SHA256 optimization)
    'duration_refresh': ['p(95)<100'], 
    
    // Signin/Signup allowed to be slow (Argon2), but not BROKEN slow
    'duration_signin': ['p(95)<2000'], 
    
    // Batch delete shouldn't freeze the DB for too long
    'duration_batch_delete': ['p(95)<1000'],
  },
};

// --- HELPER: Random Sleep (Jitter) ---
// Prevents "Thundering Herd" problem where all VUs hit the server at the exact same ms
const thinkTime = () => sleep(Math.random() * 2 + 0.5); // 0.5s to 2.5s

// --- HELPER: Request Wrapper with Error Logging ---
function post(url, payload, token = null, tags = {}) {
  const params = {
    headers: { 'Content-Type': 'application/json' },
    tags: tags
  };
  if (token) params.headers['Authorization'] = `Bearer ${token}`;

  const res = http.post(url, payload, params);
  
  // If request fails (4xx/5xx), log it for debugging
  if (res.status >= 400) {
    failureRate.add(1);
    console.error(`[${tags.name}] Failed: ${res.status} - ${res.body}`);
  }
  return res;
}

// --- SCENARIO A: REGULAR USER LIFECYCLE ---
export function user_traffic() {
  const uniqueId = `${randomString(8)}_${__VU}_${__ITER}`;
  const username = `u_${uniqueId}`;
  const email = `${username}@test.com`;
  const password = 'StrongPassword123!';
  
  let userId = null;
  let accessToken = null;

  // 1. SIGNUP
  group('User Flow', () => {
    const p1 = JSON.stringify({ username, email, password, role: 'USER' });
    const r1 = post(`${BASE_URL}/auth/signup`, p1, null, { name: 'Signup' });
    
    t_signup.add(r1.timings.duration);
    if (!check(r1, { 'Signup is 201': (r) => r.status === 201 })) return; // Stop if failed
    
    userId = r1.json('id');
    thinkTime();

    // 2. SIGNIN
    const p2 = JSON.stringify({ identifier: email, password });
    const r2 = post(`${BASE_URL}/auth/signin`, p2, null, { name: 'Signin' });
    
    t_signin.add(r2.timings.duration);
    if (!check(r2, { 'Signin is 200': (r) => r.status === 200 })) return;

    accessToken = r2.json('access_token');
    thinkTime();

    // 3. REFRESH (The Optimization Check)
    // Note: K6 automatically handles the httpOnly cookie from the previous response
    const r3 = post(`${BASE_URL}/auth/refresh`, null, null, { name: 'Refresh' });
    
    t_refresh.add(r3.timings.duration);
    check(r3, { 
      'Refresh is 200': (r) => r.status === 200,
      'Got new token': (r) => r.json('access_token') !== undefined 
    });
    thinkTime();

    // 4. SIGNOUT
    const r4 = post(`${BASE_URL}/auth/signout`, null, null, { name: 'Signout' });
    t_signout.add(r4.timings.duration);
    check(r4, { 'Signout is 204': (r) => r.status === 204 });
    
    // 5. RE-SIGNIN (Required to perform Delete Me)
    // We signed out, so we must login again to get a valid token/session
    const r5 = post(`${BASE_URL}/auth/signin`, p2, null, { name: 'Re-Signin' });
    if (r5.status !== 200) return;
    accessToken = r5.json('access_token');
    thinkTime();

    // 6. DELETE SELF (The CPU Killer)
    // Strong Middleware runs verify() -> DB Fetch -> Argon2 Verify -> DB Update
    const p6 = JSON.stringify({ id: userId, password: password });
    
    // Using http.del directly as we need custom method
    const r6 = http.del(`${BASE_URL}/user/me`, p6, {
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        tags: { name: 'DeleteMe' }
    });

    t_delete_me.add(r6.timings.duration);
    
    const success = check(r6, { 
        'Delete Me is 200': (r) => r.status === 200,
        'Has deleted_at': (r) => r.json('deleted_at') !== null 
    });

    if (success) successLifecycle.add(1);
    else {
        failureRate.add(1);
        console.error(`[DeleteMe] Failed: ${r6.status} ${r6.body}`);
    }
  });
}

// --- SCENARIO B: ADMIN BATCH OPERATIONS ---
export function admin_tasks() {
  const uniqueId = `admin_${randomString(5)}_${__VU}_${__ITER}`;
  const password = 'AdminPassword123!';
  const email = `${uniqueId}@admin.com`;
  
  let adminToken = '';

  // 1. Setup Admin
  const r1 = post(`${BASE_URL}/auth/signup`, JSON.stringify({
    username: uniqueId, email: email, password, role: 'ADMIN'
  }), null, { name: 'AdminSignup' });

  // Login
  const r2 = post(`${BASE_URL}/auth/signin`, JSON.stringify({
    identifier: email, password
  }), null, { name: 'AdminSignin' });

  if (r2.status === 200) {
      adminToken = r2.json('access_token');
  } else {
      return; // Admin setup failed
  }

  // 2. Create Victims (Batch Data Generation)
  let victimIds = [];
  for(let i=0; i<5; i++) {
      const vName = `victim_${uniqueId}_${i}`;
      const res = http.post(`${BASE_URL}/auth/signup`, JSON.stringify({
          username: vName, email: `${vName}@example.com`, password: 'password', role: 'USER'
      }), { headers: { 'Content-Type': 'application/json' } });
      
      if(res.status === 201) victimIds.push(res.json('id'));
  }

  // Allow DB to settle and users to potentially "login" (simulated by wait)
  sleep(2);

  // 3. BATCH DELETE
  const payload = JSON.stringify({
      userIds: victimIds,
      password: password
  });

  const rBatch = http.del(`${BASE_URL}/admin/batch`, payload, {
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
      },
      tags: { name: 'BatchDelete' }
  });

  t_batch_delete.add(rBatch.timings.duration);
  
  check(rBatch, {
      'Batch Delete 200': (r) => r.status === 200,
      'Count Matches': (r) => r.json('deletedCount') === victimIds.length
  });
}