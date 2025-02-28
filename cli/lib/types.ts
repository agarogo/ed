export enum UserRole {
    ADMIN = "admin",
    MANAGER = "manager",
    USER = "user",
}

export interface User {
    id: number;
    email: string;
    full_name: string;
    phone_number: string | null;
    role: UserRole;
    is_active: boolean;
}

export interface UserUpdate {
    full_name?: string;
    phone_number?: string;
    role?: UserRole;
}
export interface News {
    id: number;
    title: string;
    content: string;
    created_by: number;
    is_active: boolean;
    created_at: string;
}
export interface NewsCreate {
    title: string;
    content: string;
}