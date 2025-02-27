import axios from "axios";
import { parseCookies } from "nookies";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL, // Должно быть "http://localhost:8000"
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        console.log("Request URL:", config.url); // Отладка
        const { _token } = parseCookies();
        console.log("Token in request:", _token); // Отладка
        if (_token) {
            config.headers.Authorization = `Bearer ${_token}`;
        }
        const token = localStorage.getItem("token"); // Или где вы храните JWT
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error("Request error:", error); // Отладка
        return Promise.reject(error);
    },


);

export default api;