import { useState, useEffect } from "react";
import api from "../lib/api";
import { User, UserRole, UserUpdate } from "../lib/types";
import Link from "next/link";
import { parseCookies } from "nookies";

interface UserListProps {
    currentUser: User;
}

interface UserProfileData extends User {}

const UserList: React.FC<UserListProps> = ({ currentUser }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<UserProfileData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const fetchUsers = async (query: string) => {
        setLoading(true);
        setError(null);
        try {
            const token = parseCookies()._token;
            console.log("Searching users with query:", query, "Token:", token);
            const response = await api.get<User[]>(`/users/?q=${encodeURIComponent(query)}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Search results:", response.data);
            setUsers(response.data);
        } catch (err: any) {
            console.error("Failed to fetch users:", err.response?.data || err.message);
            setError(err.response?.data?.detail || "Не удалось загрузить пользователей");
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (search.trim()) {
            fetchUsers(search);
        }
    };

    const fetchUserProfile = async (userId: number) => {
        try {
            const token = parseCookies()._token;
            const response = await api.get<UserProfileData>(`/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSelectedUser(response.data);
        } catch (err: any) {
            console.error("Failed to fetch user profile:", err.response?.data || err.message);
            setError(err.response?.data?.detail || "Не удалось загрузить профиль пользователя");
            setSelectedUser(null);
        }
    };

    const handleViewProfile = (user: User) => {
        fetchUserProfile(user.id);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
        setEditMode(false);
    };

    const handleSaveChanges = async (updatedUser: UserUpdate) => {
        if (!selectedUser) return;
        try {
            const token = parseCookies()._token;
            const response = await api.put(`/users/${selectedUser.id}`, updatedUser, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSelectedUser(response.data);
            setEditMode(false);
            console.log("User profile updated successfully");
        } catch (err: any) {
            console.error("Failed to update user profile:", err.response?.data || err.message);
            setError(err.response?.data?.detail || "Не удалось обновить профиль");
        }
    };

    return (
        <div className="min-h-screen">
            <div className="mt-24 container2 mx-auto">
                <h1 className="text-4xl font-bold mb-8">Список сотрудников</h1>
                <div className="flex mt-10">
                    <div className="shadow-md p-4 sticky top-16 rounded-3xl">
                        <h2 className="text-lg font-bold mb-4">Фильтры</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Имя</label>
                                <input
                                    type="text"
                                    className="p-2 border rounded-lg w-full"
                                    placeholder="Введите имя"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Фамилия</label>
                                <input
                                    type="text"
                                    className="p-2 border rounded-lg w-full"
                                    placeholder="Введите фамилию"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Отчество</label>
                                <input
                                    type="text"
                                    className="p-2 border rounded-lg w-full"
                                    placeholder="Введите отчество"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Роль</label>
                                <select className="p-2 border rounded-lg w-full">
                                    <option>Качества-то</option>
                                    <option>Качества-то</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Доступность</label>
                                <select className="p-2 border rounded-lg w-full">
                                    <option>Доступен</option>
                                    <option>Недоступен</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <div className="container mx-auto p-4">
                            <form onSubmit={handleSearch} className="w-full max-w-md mx-auto mb-8 flex items-center">
                                <div className="relative w-full">
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Поиск..."
                                        className="p-2 border rounded-full w-full pl-10 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                            />
                                        </svg>
                                    </span>
                                </div>
                                <button
                                    type="submit"
                                    className="bg-purple-500 text-white p-2 rounded-full ml-2 hover:bg-purple-600"
                                >
                                    Поиск
                                </button>
                            </form>

                            <div className="grid grid-cols-2 gap-6">
                                {loading ? (
                                    <p className="text-center col-span-2">Загрузка...</p>
                                ) : error ? (
                                    <p className="text-red-500 text-center col-span-2">{error}</p>
                                ) : users.length === 0 ? (
                                    <p className="text-center col-span-2">Пользователи не найдены</p>
                                ) : (
                                    users.map((user) => (
                                        <div
                                            key={user.id}
                                            className="bg-white rounded-2xl shadow-md p-4 flex items-center space-x-4"
                                        >
                                            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                                                <span className="text-gray-500">Нет аватара</span>
                                            </div>
                                            <div className="flex-1">
                                                <Link
                                                    href={`/profile/${user.id}`}
                                                    className="text-purple-600 text-lg font-semibold hover:underline"
                                                >
                                                    {user.full_name}
                                                </Link>
                                                <p className="text-gray-600">{user.position_employee}</p>
                                            </div>
                                            <button
                                                onClick={() => handleViewProfile(user)}
                                                className="bg-purple-500 text-white px-4 py-2 rounded-full hover:bg-purple-600"
                                            >
                                                Подробнее
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg">
                        <h2 className="text-2xl font-bold mb-4">Профиль пользователя</h2>
                        {editMode ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Имя</label>
                                    <input
                                        type="text"
                                        value={selectedUser.full_name}
                                        onChange={(e) =>
                                            setSelectedUser({ ...selectedUser, full_name: e.target.value })
                                        }
                                        className="p-2 border rounded-lg w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email (личный)</label>
                                    <input
                                        type="email"
                                        value={selectedUser.email_user || ""}
                                        onChange={(e) =>
                                            setSelectedUser({ ...selectedUser, email_user: e.target.value || null })
                                        }
                                        className="p-2 border rounded-lg w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Телефон</label>
                                    <input
                                        type="text"
                                        value={selectedUser.phone_number || ""}
                                        onChange={(e) =>
                                            setSelectedUser({ ...selectedUser, phone_number: e.target.value || null })
                                        }
                                        className="p-2 border rounded-lg w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Роль</label>
                                    <select
                                        value={selectedUser.role}
                                        onChange={(e) =>
                                            setSelectedUser({ ...selectedUser, role: e.target.value as UserRole })
                                        }
                                        className="p-2 border rounded-lg w-full"
                                    >
                                        <option value={UserRole.ADMIN}>Admin</option>
                                        <option value={UserRole.MANAGER}>Manager</option>
                                        <option value={UserRole.USER}>User</option>
                                    </select>
                                </div>
                                <div className="flex justify-end space-x-4">
                                    <button
                                        onClick={() => handleSaveChanges(selectedUser)}
                                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                                    >
                                        Сохранить
                                    </button>
                                    <button
                                        onClick={() => setEditMode(false)}
                                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p><strong>Имя:</strong> {selectedUser.full_name}</p>
                                <p><strong>Корп. Email:</strong> {selectedUser.email_corporate}</p>
                                <p><strong>Личный Email:</strong> {selectedUser.email_user || "N/A"}</p>
                                <p><strong>Телефон:</strong> {selectedUser.phone_number || "N/A"}</p>
                                <p><strong>Telegram:</strong> {selectedUser.tg_name}</p>
                                <p><strong>Должность:</strong> {selectedUser.position_employee}</p>
                                <p><strong>Подразделение:</strong> {selectedUser.subdivision}</p>
                                <p><strong>Пол:</strong> {selectedUser.sex}</p>
                                <p><strong>Роль:</strong> {selectedUser.role}</p>
                                {currentUser.role === UserRole.ADMIN && (
                                    <button
                                        onClick={() => setEditMode(true)}
                                        className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
                                    >
                                        Редактировать
                                    </button>
                                )}
                                <button
                                    onClick={handleCloseModal}
                                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                                >
                                    Закрыть
                                </button>
                            </div>
                        )}
                        {error && <p className="text-red-500 mt-4">{error}</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserList;