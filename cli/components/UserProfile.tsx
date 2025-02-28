import { useState, useEffect } from "react";
import api from "../lib/api";
import { User, UserRole, UserUpdate } from "../lib/types";
import { useRouter } from "next/router";
import { logout } from "../lib/auth";
import { parseCookies } from "nookies";

interface UserProfileProps {
    userId: string;
    currentUser: User;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId, currentUser }) => {
    const [user, setUser] = useState<User | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState<UserUpdate>({});
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = parseCookies()._token;
                let endpoint: string;
                if (userId === "me") {
                    endpoint = "/users/me";
                } else {
                    endpoint = `/users/${userId}`;
                    // Проверяем, что текущий пользователь — админ, если просматривает профиль другого
                    if (currentUser.role !== UserRole.ADMIN) {
                        throw new Error("Access denied: Only admins can view other profiles");
                    }
                }
                console.log("Fetching user from:", endpoint);
                const response = await api.get<User>(endpoint, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log("User fetched:", response.data);
                setUser(response.data);
                setFormData({
                    full_name: response.data.full_name,
                    birthday: response.data.birthday,
                    sex: response.data.sex,
                    email_user: response.data.email_user || undefined,
                    phone_number: response.data.phone_number || undefined,
                    tg_name: response.data.tg_name,
                    position_employee: response.data.position_employee,
                    subdivision: response.data.subdivision,
                    role: response.data.role,
                });
            } catch (err: any) {
                console.error("Failed to fetch user:", err.response?.data || err.message);
                if (err.response?.status === 403 || err.response?.status === 404) {
                    router.push("/dashboard"); // Перенаправляем на дашборд при ошибке доступа
                }
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [userId, currentUser.role]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = parseCookies()._token;
            const endpoint = userId === "me" ? "/users/me" : `/users/${userId}`;
            const response = await api.put<User>(endpoint, formData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUser(response.data);
            setEditMode(false);
        } catch (err: any) {
            console.error("Update failed:", err.response?.data || err.message);
            setError(err.response?.data?.detail || "Не удалось обновить профиль");
        }
    };

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    if (loading) return <p>Loading...</p>;
    if (!user) return <p>User not found</p>;

    return (
        <div className="container2 mx-auto mt-24">
            <h1 className="text-2xl font-bold mb-4">{user.full_name}'s Profile</h1>
            {editMode ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Full Name</label>
                        <input
                            type="text"
                            value={formData.full_name || ""}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="p-2 border rounded w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Date of Birth</label>
                        <input
                            type="date"
                            value={formData.birthday || ""}
                            onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                            className="p-2 border rounded w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Gender</label>
                        <select
                            value={formData.sex || ""}
                            onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                            className="p-2 border rounded w-full"
                        >
                            <option value="">Select Gender</option>
                            <option value="М">Мужской</option>
                            <option value="Ж">Женский</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Personal Email</label>
                        <input
                            type="email"
                            value={formData.email_user || ""}
                            onChange={(e) => setFormData({ ...formData, email_user: e.target.value || null })}
                            className="p-2 border rounded w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Phone Number</label>
                        <input
                            type="text"
                            value={formData.phone_number || ""}
                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value || null })}
                            className="p-2 border rounded w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Telegram</label>
                        <input
                            type="text"
                            value={formData.tg_name || ""}
                            onChange={(e) => setFormData({ ...formData, tg_name: e.target.value })}
                            className="p-2 border rounded w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Position</label>
                        <input
                            type="text"
                            value={formData.position_employee || ""}
                            onChange={(e) => setFormData({ ...formData, position_employee: e.target.value })}
                            className="p-2 border rounded w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Subdivision</label>
                        <input
                            type="text"
                            value={formData.subdivision || ""}
                            onChange={(e) => setFormData({ ...formData, subdivision: e.target.value })}
                            className="p-2 border rounded w-full"
                        />
                    </div>
                    {currentUser.role === UserRole.ADMIN && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Role</label>
                            <select
                                value={formData.role || ""}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                className="p-2 border rounded w-full"
                            >
                                <option value={UserRole.ADMIN}>Admin</option>
                                <option value={UserRole.MANAGER}>Manager</option>
                                <option value={UserRole.USER}>User</option>
                            </select>
                        </div>
                    )}
                    <div className="space-x-2">
                        <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                            Save
                        </button>
                        <button
                            type="button"
                            onClick={() => setEditMode(false)}
                            className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (







                <div className="h-[55%] w-full border-2 border-black rounded-[20] p-16 flex">
                    {currentUser.role === UserRole.ADMIN && (
                            <button
                                onClick={() => setEditMode(true)}
                                className="bg-blue-500 text-white p-2 w-20 rounded-xl hover:bg-blue-600"
                            >
                                Редактировать
                            </button>
                        )}
                        {userId === "me" && currentUser.id === user.id && (
                            <button
                                onClick={handleLogout}
                                className="bg-red-600 hover:bg-red-700 p-2 rounded-xl"
                            >
                                Выйти
                            </button>
                        )}
                    <p className="text-3xl font-bold absolute mt-[-50px]">Персональная информация</p>
                    <div className="h-full w-1/3">
                        <p className="text-gray-400 text-xl">Имя:</p>
                        <p className="text-xl">{currentUser.full_name}</p>

                        <p className="text-gray-400 text-xl mt-5">Номер телефона:</p>
                        <p className="text-xl">{currentUser.phone_number || "N/A"}</p>

                        <p className="text-gray-400 text-xl mt-10">Телеграм:</p>
                        <p className="text-xl">{currentUser.tg_name || "N/A"}</p>
                    </div>
                    <div className="h-full w-1/3">
                        <p className="text-gray-400 text-xl">Email (личный):</p>
                        <p className="text-xl">{currentUser.email_user || "N/A"}</p>

                        <p className="text-gray-400 text-xl mt-5">Подразделение:</p>
                        <p className="text-xl">{currentUser.subdivision || "N/A"}</p>

                        <p className="text-gray-400 text-xl mt-10">Пол:</p>
                        <p className="text-xl">{currentUser.sex || "N/A"}</p>
                    </div>
                    <div className="h-full w-1/3">
                        <p className="text-gray-400 text-xl">Корп. Email:</p>
                        <p className="text-xl">{currentUser.email_corporate || "N/A"}</p>

                        <p className="text-gray-400 text-xl mt-5">Должность:</p>
                        <p className="text-xl">{currentUser.position_employee || "N/A"}</p>

                        <p className="text-gray-400 text-xl mt-10">Роль:</p>
                        <p className="text-xl">{currentUser.role}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;