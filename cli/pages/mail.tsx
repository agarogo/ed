import { useState } from "react";
import api from "../lib/api";
import { UserCreate, UserRole } from "../lib/types";
import { GetServerSideProps } from "next";
import { parseCookies } from "nookies";
import { isAuthenticated } from "../lib/auth";

interface CreateEmployeeProps {
    currentUser: User;
}

export default function CreateEmployee({ currentUser }: CreateEmployeeProps) {
    const [user, setUser] = useState<UserCreate>({
        full_name: "",
        birthday: new Date().toISOString().split("T")[0], // Сегодняшняя дата по умолчанию
        sex: "",
        email_user: "",
        phone_number: "",
        tg_name: "",
        position_employee: "",
        subdivision: "",
        role: UserRole.USER,
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user.full_name.trim() || !user.password.trim() || !user.position_employee.trim() || !user.subdivision.trim()) {
            setError("Заполните обязательные поля");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const token = parseCookies()._token;
            const response = await api.post("/users", user, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSuccess("Пользователь успешно создан");
            setUser({
                full_name: "",
                birthday: new Date().toISOString().split("T")[0],
                sex: "",
                email_user: "",
                phone_number: "",
                tg_name: "",
                position_employee: "",
                subdivision: "",
                role: UserRole.USER,
                password: "",
            });
        } catch (err: any) {
            console.error("Failed to create user:", err.message);
            setError(err.message || "Не удалось создать пользователя");
        } finally {
            setLoading(false);
        }
    };

    if (currentUser.role !== "admin") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-red-500">Доступ запрещён: Только администраторы могут создавать пользователей</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mt-24 container2 mx-auto">
                <h1 className="text-4xl font-bold text-center mb-8">Создание сотрудника</h1>
                <form onSubmit={loading ? undefined : handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-md">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Полное имя</label>
                        <input
                            type="text"
                            value={user.full_name}
                            onChange={(e) => setUser({ ...user, full_name: e.target.value })}
                            className="p-2 border rounded-lg w-full"
                            placeholder="Иванов Иван Иванович"
                            disabled={loading}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Дата рождения</label>
                        <input
                            type="date"
                            value={user.birthday}
                            onChange={(e) => setUser({ ...user, birthday: e.target.value })}
                            className="p-2 border rounded-lg w-full"
                            disabled={loading}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Пол</label>
                        <select
                            value={user.sex}
                            onChange={(e) => setUser({ ...user, sex: e.target.value })}
                            className="p-2 border rounded-lg w-full"
                            disabled={loading}
                        >
                            <option value="">Выберите пол</option>
                            <option value="М">Мужской</option>
                            <option value="Ж">Женский</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email (личный)</label>
                        <input
                            type="email"
                            value={user.email_user}
                            onChange={(e) => setUser({ ...user, email_user: e.target.value })}
                            className="p-2 border rounded-lg w-full"
                            placeholder="ivan@example.com"
                            disabled={loading}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Телефон</label>
                        <input
                            type="text"
                            value={user.phone_number}
                            onChange={(e) => setUser({ ...user, phone_number: e.target.value })}
                            className="p-2 border rounded-lg w-full"
                            placeholder="123-456-789"
                            disabled={loading}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Telegram</label>
                        <input
                            type="text"
                            value={user.tg_name}
                            onChange={(e) => setUser({ ...user, tg_name: e.target.value })}
                            className="p-2 border rounded-lg w-full"
                            placeholder="ivan_tg"
                            disabled={loading}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Должность</label>
                        <input
                            type="text"
                            value={user.position_employee}
                            onChange={(e) => setUser({ ...user, position_employee: e.target.value })}
                            className="p-2 border rounded-lg w-full"
                            placeholder="Разработчик"
                            disabled={loading}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Подразделение</label>
                        <input
                            type="text"
                            value={user.subdivision}
                            onChange={(e) => setUser({ ...user, subdivision: e.target.value })}
                            className="p-2 border rounded-lg w-full"
                            placeholder="IT"
                            disabled={loading}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Роль</label>
                        <select
                            value={user.role}
                            onChange={(e) => setUser({ ...user, role: e.target.value as UserRole })}
                            className="p-2 border rounded-lg w-full"
                            disabled={loading}
                        >
                            <option value={UserRole.USER}>Пользователь</option>
                            <option value={UserRole.MANAGER}>Менеджер</option>
                            <option value={UserRole.ADMIN}>Админ</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Пароль</label>
                        <input
                            type="password"
                            value={user.password}
                            onChange={(e) => setUser({ ...user, password: e.target.value })}
                            className="p-2 border rounded-lg w-full"
                            placeholder="Введите пароль"
                            disabled={loading}
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 disabled:bg-gray-400"
                        disabled={loading}
                    >
                        {loading ? "Создание..." : "Создать"}
                    </button>
                    {error && <p className="text-red-500 mt-4">{error}</p>}
                    {success && <p className="text-green-500 mt-4">{success}</p>}
                </form>
            </div>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps<CreateEmployeeProps> = async (context) => {
    if (!isAuthenticated(context)) {
        return {
            redirect: { destination: "/", permanent: false },
        };
    }

    const { _token } = parseCookies(context);
    try {
        const response = await api.get<User>("/users/me", {
            headers: { Authorization: `Bearer ${_token}` },
        });
        if (response.data.role !== "admin") {
            return {
                redirect: { destination: "/dashboard", permanent: false },
            };
        }
        return { props: { currentUser: response.data } };
    } catch (error) {
        console.error("Error fetching user for create-employee:", error);
        return {
            redirect: { destination: "/", permanent: false },
        };
    }
};