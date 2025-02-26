import api from "./api";
import { setCookie, destroyCookie } from "nookies";

interface LoginResponse {
    access_token: string;
    token_type: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>(
        "/token",
        new URLSearchParams({ username: email, password }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    setCookie(null, "_token", response.data.access_token, {
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });
    return response.data;
}

export function logout() {
    destroyCookie(null, "_token", { path: "/" });
}