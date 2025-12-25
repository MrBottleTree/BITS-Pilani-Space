import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// --- CUSTOM ANALYTICS ---
// These specific metrics will show up at the end of the test
const signupDuration = new Trend('duration_signup');   // Expect ~500ms+ (Argon2 Hash)
const signinDuration = new Trend('duration_signin');   // Expect ~500ms+ (Argon2 Verify)
const refreshDuration = new Trend('duration_refresh'); // Expect < 50ms (SHA-256 - The Optimization!)
const successfulAuths = new Counter('successful_auth_flows');

export const options = {
  // We use "stages" to simulate a real traffic spike
  stages: [
    { duration: '30s', target: 20 },  // Warm up: Ramp to 20 users
    { duration: '1m',  target: 50 },  // Load: Hold at 50 users (Steady state)
    { duration: '1m',  target: 150 }, // STRESS: Spike to 150 concurrent users (CPU Pressure)
    { duration: '30s', target: 200 }, // CRUSH: Push to 200 users (Saturation point)
    { duration: '30s', target: 0 },   // Cool down
  ],
  
  // Fail the test if the server is too slow or errors out
  thresholds: {
    http_req_failed: ['rate<0.01'],    // Error rate must be under 1%
    duration_refresh: ['p(95)<100'],   // 95% of refreshes MUST be fast (<100ms)
    duration_signin: ['p(95)<2000'],   // Signin can be slower (Argon2 cost)
  },
};

const BASE_URL = 'http://192.168.31.193:3000/api/v1/auth'; // Adjust port if needed

export default function () {
  // 1. DYNAMIC DATA GENERATION
  // We create a unique user for every iteration to avoid 409 Conflicts
  const uniqueId = `${randomString(6)}_${__VU}_${__ITER}`;
  const username = `user_${uniqueId}`;
  const email = `${username}@example.com`;
  const password = 'StrongPassword123!';

  const params = { headers: { 'Content-Type': 'application/json' } };

  // --- STEP 1: SIGNUP (Heavy Write + Hash) ---
  const signupPayload = JSON.stringify({
    username: username,
    email: email,
    password: password,
    role: 'USER',
  });

  const resSignup = http.post(`${BASE_URL}/signup`, signupPayload, params);
  
  // Track custom analytics
  signupDuration.add(resSignup.timings.duration);
  
  const signupSuccess = check(resSignup, {
    'Signup is 201': (r) => r.status === 201,
  });

  if (!signupSuccess) {
    // If signup fails (e.g., DB overload), retry or skip to prevent noise
    sleep(1);
    return; 
  }

  // --- STEP 2: SIGNIN (Heavy Read + Verify) ---
  const signinPayload = JSON.stringify({
    identifier: email, 
    password: password,
  });

  const resSignin = http.post(`${BASE_URL}/signin`, signinPayload, params);
  
  signinDuration.add(resSignin.timings.duration);

  const signinSuccess = check(resSignin, {
    'Signin is 200': (r) => r.status === 200,
    'Got Access Token': (r) => r.json('access_token') !== undefined,
  });

  if (!signinSuccess) {
     return;
  }

  // --- STEP 3: REFRESH (The Optimized "SHA-256" Path) ---
  // k6 automatically manages the cookie jar. If Signin set the cookie, this request sends it.
  
  const resRefresh = http.post(`${BASE_URL}/refresh`, null, params);
  
  refreshDuration.add(resRefresh.timings.duration);

  check(resRefresh, {
    'Refresh is 200': (r) => r.status === 200,
    'Refresh is fast': (r) => r.timings.duration < 200, // Should be blazing fast
  });

  // Count successful full flows
  if (resSignup.status === 201 && resSignin.status === 200 && resRefresh.status === 200) {
      successfulAuths.add(1);
  }

  // A tiny sleep prevents "denial of service" on your local network stack
  // Lower this to 0.1 to truly crush the CPU
  sleep(1); 
}