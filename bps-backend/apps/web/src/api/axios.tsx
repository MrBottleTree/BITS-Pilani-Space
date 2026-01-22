import axios from 'axios';
import { HTTP_BACKEND_URL } from '../config';

const api = axios.create({
    baseURL: HTTP_BACKEND_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});


api.interceptors.request.use((config) => {
    const access_token = localStorage.getItem('accessToken');

    // Attach the access token to ALL the requests from client to server.
    if(access_token) config.headers['Authorization'] = `Bearer ${access_token}`;
    return config;

}, (error) => { Promise.reject(error); });

// Safety net needs to be made here

export default api;
export * from "axios";