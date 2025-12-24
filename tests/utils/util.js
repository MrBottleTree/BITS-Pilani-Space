const axios = require("axios");

axios.defaults.validateStatus = () => true;

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

function makeUniqueUsername(prefix = "test") {
  const safePrefix =
    String(prefix).replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 8) || "test";

  const t = Date.now().toString(36);                  // time entropy
  const pid = process.pid.toString(36);               // process entropy
  const hr = (process.hrtime.bigint() & 0xfffffn).toString(36); // extra entropy

  return `${safePrefix}_${t}_${pid}_${hr}`.slice(0, 32);
}

module.exports = {
  axios,
  BACKEND_URL,
  makeUniqueUsername,
};
