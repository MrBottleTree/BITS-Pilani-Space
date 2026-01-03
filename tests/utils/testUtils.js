const axios = require("axios");
const NodeFormData = require("form-data"); 
const path = require("path")
const fs = require("fs")
const FormData = require('form-data');

axios.defaults.validateStatus = () => true;
const valid_password = "Password@123";
let admin_access;
const email = `${makeUniqueUsername()}@something.com`;

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

async function upload_avatar(token, image_key, name="Temp") {

    return await axios.post(`${BACKEND_URL}/api/${API_VERSION}/avatar`, {
        name, image_key
    }, {
        headers: {
            Authorization: 'Bearer ' + token,
        }
    });
}

async function get_avatar(avatar_id) {
    return await axios.get(`${BACKEND_URL}/api/${API_VERSION}/avatar/${avatar_id}`);
}

async function get_all_avatar() {
    return await axios.get(`${BACKEND_URL}/api/${API_VERSION}/avatar/`);
}

async function uploadFileFromPath(relativeFilePath, token) {
    const absolutePath = path.resolve(relativeFilePath);
    
    const form = new FormData();
    form.append('images', fs.createReadStream(absolutePath));
    form.append('name', path.basename(absolutePath));

    try {        
        return await axios.post(`${BACKEND_URL}/api/${API_VERSION}/cloud/upload`, form, {
            headers: {
                ...form.getHeaders(),
                "Authorization": `Bearer ${token}`
            }
        });
    } catch (error) {
        const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error("Network or File Error:", errorMsg);
    }
}

async function addElement(payload, access_token){
    const response = await axios.post(`${BACKEND_URL}/api/${API_VERSION}/element/`, payload, {
        headers: {
            Authorization: `Bearer ${access_token}`
        }
    });

    return response;
}

async function getElement(){
    return await axios.get(`${BACKEND_URL}/api/${API_VERSION}/element/`);
}

async function add_element_workflow(image_path){
    if(!admin_access){
        await signup_user({
            name: "Test",
            email,
            password: valid_password,
            role
        });
    }
    
    admin_access = (await signin_user({identifier: email, password: valid_password})).data.data.access_token;

    const image_key = (await uploadFileFromPath(image_path, admin_access)).data.data.key;

    const element_response = await addElement({
        name: "Test",
        image_key,
        height: 5,
        width: 5,
        static: false
    }, admin_access);

    return element_response;
}

const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
};

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
  get_me,
  upload_avatar,
  get_avatar,
  uploadFileFromPath,
  get_all_avatar,
  HTTP_STATUS,
  addElement,
  getElement
};