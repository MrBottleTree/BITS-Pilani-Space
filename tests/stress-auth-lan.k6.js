import http from "k6/http";
import { check, sleep } from "k6";
import { randomString } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";


const BASE_URL = __ENV.BASE_URL || "http://192.168.31.193:3000";

const ENDPOINTS = {
  signup:  `${BASE_URL}/api/v1/auth/signup`,
  signin:  `${BASE_URL}/api/v1/auth/signin`,
  refresh: `${BASE_URL}/api/v1/auth/refresh`,
  signout: `${BASE_URL}/api/v1/auth/signout`,
  health:  `${BASE_URL}/api/v1/healthz`,
};

// Load mix (important)
const SIGNUP_RATE  = 0.10;  // expensive (argon2.hash)
const REFRESH_RATE = 0.55;  // common in real systems
const SIGNOUT_RATE = 0.10;


export const options = {
  scenarios: {
    auth_load: {
      executor: "constant-vus",
      vus: Number(__ENV.VUS || 50),
      duration: String(__ENV.DURATION || "2m"),
      gracefulStop: "10s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.02"],         // auth systems tolerate small failures
    http_req_duration: ["p(95)<3000"],      // realistic LAN + crypto cost
  },
};


function jsonHeaders() {
  return { headers: { "Content-Type": "application/json" } };
}

function newUser() {
  const u = `k6_${randomString(10)}_${__VU}_${__ITER}`;
  return {
    username: u,
    email: `${u}@example.com`,
    password: `P@ss_${u}_123`,
  };
}

function hasRefreshCookie(resp) {
  const sc = resp.headers["Set-Cookie"];
  if (!sc) return false;
  const arr = Array.isArray(sc) ? sc : [sc];
  return arr.some(c => c.startsWith("refresh_token="));
}


let state = {
  user: null,
  loggedIn: false,
};


export function setup() {
  const r = http.get(ENDPOINTS.health);
  if (r.status !== 200) {
    throw new Error("Backend not reachable");
  }
}


function signup() {
  state.user = newUser();

  const r = http.post(
    ENDPOINTS.signup,
    JSON.stringify({ ...state.user, role: "USER" }),
    jsonHeaders()
  );

  check(r, {
    "signup 201": (res) => res.status === 201,
  });

  return r.status === 201;
}

function signin() {
  if (!state.user) signup();

  const r = http.post(
    ENDPOINTS.signin,
    JSON.stringify({
      identifier: state.user.username,
      password: state.user.password,
    }),
    jsonHeaders()
  );

  const ok = check(r, {
    "signin 200": (res) => res.status === 200,
    "signin sets refresh cookie": hasRefreshCookie,
  });

  state.loggedIn = ok;
  return ok;
}

function refresh() {
  const r = http.post(ENDPOINTS.refresh, null);

  check(r, {
    "refresh 200": (res) => res.status === 200,
  });

  return r.status === 200;
}

function signout() {
  const r = http.post(ENDPOINTS.signout, null);

  check(r, {
    "signout 204": (res) => res.status === 204,
  });

  state.loggedIn = false;
  return r.status === 204;
}


export default function () {
  // Ensure session exists
  if (!state.loggedIn || Math.random() < SIGNUP_RATE) {
    signup();
    signin();
    sleep(0.05);
    return;
  }

  const p = Math.random();

  if (p < SIGNOUT_RATE) {
    signout();
  } else if (p < SIGNOUT_RATE + REFRESH_RATE) {
    refresh();
  } else {
    // light churn
    if (Math.random() < 0.2) refresh();
  }

  sleep(0.15);
}
