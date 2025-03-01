import axios from "axios";
import { parseCookies } from "nookies";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    timeout: 15000, // Увеличиваем до 15 секунд
});

api.interceptors.request.use((config) => {
    const cookies = parseCookies();
    const token = cookies._token;
    console.log("Sending request:", config.method, config.url, "Token:", token);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("Response error:", error.message, "Status:", error.response?.status, "Data:", error.response?.data);
        return Promise.reject(error);
    }
);

export default api;