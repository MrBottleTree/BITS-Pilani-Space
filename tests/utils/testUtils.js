const axios = require("axios");
const path = require("path")
const fs = require("fs")
const FormData = require('form-data');
const image_path = "./utils/image.png";

axios.defaults.validateStatus = () => true;
const valid_password = "Password@123";

const API_VERSION = 'v1';

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
const WEBSOCKET_URL = process.env.WEBSOCKET_URL || "http://localhost:3001"

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

async function addMap(payload, access_token){
    return await axios.post(`${BACKEND_URL}/api/${API_VERSION}/map`, payload, {
        headers:{
            Authorization: `Bearer ${access_token}`
        }
    });
};

async function add_map_workflow(image_path, access_token){
    const elements = []
    for(let x = 0; x<4; x++){
        const image_key = (await uploadFileFromPath(image_path, access_token)).data.data.key;
        elements.push((await addElement({
                name: "something",
                image_key,
                height: 1,
                width: 1,
                static: false
        }, access_token)).data.data.element.id);
    }
    const thumbnail_key = (await uploadFileFromPath(image_path, access_token)).data.data.key;

    const default_elements = [];

    for(let x = 0; x<2; x++){
        default_elements.push({
            element_id: elements.at(Math.floor(Math.random()* 3)),
            x: Math.floor(Math.random()* 99),
            y: Math.floor(Math.random() * 199),
            scale: 1,
            rotation: 0
        });
    }


    const map_response = await axios.post(`${BACKEND_URL}/api/${API_VERSION}/map/`, {
        name: "Default map",
        height: 100,
        width: 200,
        thumbnail_key,
        default_elements
    }, {
        headers: {
            Authorization: `Bearer ${access_token}`
        }
    });


    return map_response;
}

async function addSpace(payload, token){
    const response = await axios.post(`${BACKEND_URL}/api/${API_VERSION}/space/`, payload, {
        headers:{
            Authorization: `Bearer ${token}`
        }
    });


    return response
}

let userID;
let adminID;
let user_token;
let admin_token;

async function setupHTTP(){
    const admin_email = makeUniqueUsername() + '@gmail.com';
    await signup_user({
        email: admin_email,
        password: valid_password,
        name: "Test user role",
        role: "USER"
    });

    const user_email = makeUniqueUsername() + '@gmail.com';
    await signup_user({
        email: user_email,
        password: valid_password,
        name: "Test admin role",
        role: "ADMIN"
    });

    const admin_signin = await signin_user({
        identifier: admin_email,
        password: valid_password
    });

    const user_signin = await signin_user({
        identifier: user_email,
        password: valid_password
    })

    userID = user_signin.data.data.user.id;
    adminID = admin_signin.data.data.user.id;
    user_token = user_signin.data.data.access_token;
    admin_token = admin_signin.data.data.access_token;
    admin_access = admin_token;

    add_map_workflow(image_path, admin_email);
};

async function setupWS(){
    const ws1 = new WebSocket(WEBSOCKET_URL);
    const ws2 = new WebSocket(WEBSOCKET_URL);

    let ws1_awaited_connection, ws2_awaited_connection;

    const ws1_connection_promise = new Promise((resolve, reject) => {
        ws1.onopen = resolve("connected");
        ws1.onerror = reject("error");
    });

    const ws2_connection_promise = new Promise((resolve, reject) => {
        ws2.onopen = resolve("connected");
        ws2.onerror = reject("error");
    });

    try{
        ws1_awaited_connection = await ws1_connection_promise;
        ws2_awaited_connection = await ws2_connection_promise;
    }
    catch{
        console.error("JACK ERROR");
    }
};

function wait_and_pop(message_list = []){
    return new Promise((resolve, reject) => {
        let interval = setInterval(() => {
            if(message_list.length > 1){
                resolve(message_list.shift());
                clearInterval(interval);
            }
        }, 100)
    });
};

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
    WEBSOCKET_URL,
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
    getElement,
    addMap,
    add_map_workflow,
    addSpace,
    wait_and_pop,
    setupHTTP,
    setupWS,
};