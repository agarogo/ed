export enum UserRole {
    ADMIN = "admin",
    MANAGER = "manager",
    USER = "user",
}

export interface User {
    id: number;
    full_name: string;
    birthday: string;
    sex: string;
    email_user: string | null;
    email_corporate: string;
    phone_number: string | null;
    tg_name: string;
    position_employee: string;
    subdivision: string;
    role: UserRole;
    is_active: boolean;
    login_attempts: number;
    created_at: string;
}

export interface UserUpdate {
    full_name?: string;
    birthday?: string;
    sex?: string;
    email_user?: string | null;
    phone_number?: string | null;
    tg_name?: string;
    position_employee?: string;
    subdivision?: string;
    role?: UserRole;
}

export interface UserCreate {
    full_name: string;
    birthday: string;
    sex: string;
    email_user?: string | null;
    phone_number?: string | null;
    tg_name: string;
    position_employee: string;
    subdivision: string;
    role: UserRole;
    password: string;
    email_corporate?: string | null;
}

export interface News {
    id: number;
    title: string;
    content: string;
    newsc: string | null;  // Добавлено поле newsc
    created_by: number;
    is_active: boolean;
    created_at: string;
}

export interface NewsCreate {
    title: string;
    content: string;
    newsc?: string;  // Добавлено поле newsc, опциональное
}

export interface NewsUpdate {
    title?: string;
    content?: string;
    newsc?: string;  // Добавлено поле newsc для обновления
}