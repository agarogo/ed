import axios from "axios";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000", // Укажите правильный URL бэкенда
});

// Интерцептор для добавления токена в заголовки
api.interceptors.request.use((config) => {
    // На сервере токен берется из куки, на клиенте — тоже (если нужно)
    if (typeof window === "undefined") {
        // На сервере ничего не делаем, токен добавляется в getServerSideProps
    } else {
        // На клиенте можно использовать localStorage, если вы его используете
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export default api; 