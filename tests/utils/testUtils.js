const axios = require("axios");

axios.defaults.validateStatus = () => true;

const API_VERSION = 'v1';

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

function makeUniqueUsername(prefix = "test") {
    const safePrefix = String(prefix).replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 8) || "test";

    const t = Date.now().toString(36); // time entropy
    const pid = process.pid.toString(36); // process entropy
    const hr = (process.hrtime.bigint() & 0xfffffn).toString(36); // extra entropy

    return `${safePrefix}_${t}_${pid}_${hr}`.slice(0, 32);
}

async function signup_user(credentials) {
    const response = await axios.post(`${BACKEND_URL}/api/${API_VERSION}/auth/signup`, credentials);
    return response;
}

async function signin_user(credentials){
    const response = await axios.post(`${BACKEND_URL}/api/${API_VERSION}/auth/signin`, credentials);
    return response;
}

async function signout_user(refresh_token){
    return await axios.post(`${BACKEND_URL}/api/${API_VERSION}/auth/signout`, {}, {
        headers: {
            Cookie: `refresh_token=${refresh_token}`
        }
    });
}

async function refresh_token(refreshToken = ""){
    return await axios.post(`${BACKEND_URL}/api/${API_VERSION}/auth/refresh`,{}, {
        headers: {
            Cookie: `refresh_token=${refreshToken}`
        }
    });
}

async function delete_user(token, credentials){
    return await axios.delete(`${BACKEND_URL}/api/${API_VERSION}/user/me`, {
        headers: {
            Authorization: 'Bearer ' + token
        },
        data: credentials
    });
}

async function batch_delete_users(token, payload) {
    return await axios.delete(`${BACKEND_URL}/api/${API_VERSION}/admin/batch`, {
        headers: {
            Authorization: 'Bearer ' + token
        },
        data: payload
    });
}

async function get_me(token) {
    return await axios.get(`${BACKEND_URL}/api/${API_VERSION}/user/me`, {
        headers: { Authorization: 'Bearer ' + token }
    });
}

async function update_user(token, payload) {
    return await axios.patch(`${BACKEND_URL}/api/${API_VERSION}/user/me`, payload, {
        headers: { Authorization: 'Bearer ' + token }
    });
}

module.exports = {
  axios,
  API_VERSION,
  BACKEND_URL,
  makeUniqueUsername,
  signup_user,
  signin_user,
  signout_user,
  refresh_token,
  delete_user,
  batch_delete_users,
  update_user,
  get_me
};