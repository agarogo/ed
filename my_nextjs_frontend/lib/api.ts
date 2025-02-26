import axios from "axios";
import { parseCookies } from "nookies";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use(
    (config) => {
        const { _token } = parseCookies();
        if (_token) {
            config.headers.Authorization = `Bearer ${_token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;