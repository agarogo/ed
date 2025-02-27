import { useState, useEffect } from "react";
import { GetServerSideProps } from "next";
import { parseCookies } from "nookies";
import api from "../lib/api";
import { User, UserRole } from "../lib/types";
import { isAuthenticated } from "../lib/auth";

interface MailProps {
    currentUser: User;
}

interface NewUserForm {
    New: {
        password: string;
        fullName: string;
        phoneNumber: string | null;
        role: UserRole;
    };
}

export default function Mail({ currentUser }: MailProps) {
    const [newUser, setNewUser] = useState<NewUserForm>({
        New: {
            password: "",
            fullName: "",
            phoneNumber: "",
            role: UserRole.USER, // Default value
        },
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [avatar, setAvatar] = useState<File | null>(null); // State for avatar file
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null); // State for avatar preview URL

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewUser((prev) => ({
            New: {
                ...prev.New,
                [name]: value,
            },
        }));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                setError("Размер файла не должен превышать 2MB");
                return;
            }
            setAvatar(file);
            const previewURL = URL.createObjectURL(file);
            setAvatarPreview(previewURL);
        }
    };

    const createNewUser = async () => {
        if (currentUser.role !== "admin") {
            setError("Только администраторы могут создавать новых пользователей");
            return;
        }

        if (!newUser.New.password.trim()) {
            setError("Пароль обязателен и не может быть пустым");
            return;
        }

        setError(null);
        setSuccess(null);

        try {
            const formData = new FormData();
            formData.append("password", newUser.New.password);
            formData.append("full_name", newUser.New.fullName);
            if (newUser.New.phoneNumber) formData.append("phone_number", newUser.New.phoneNumber);
            formData.append("role", newUser.New.role);
            if (avatar) formData.append("avatar", avatar);

            const response = await api.post("/users/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setSuccess(`Пользователь создан с email: ${response.data.email}`);
            setNewUser({
                New: {
                    password: "",
                    fullName: "",
                    phoneNumber: "",
                    role: UserRole.USER,
                },
            });
            setAvatar(null);
            setAvatarPreview(null);
        } catch (err: any) {
            let errorMessage = "Не удалось создать пользователя";
            if (err.response?.data) {
                errorMessage = typeof err.response.data === "string"
                    ? err.response.data
                    : JSON.stringify(err.response.data);
            }
            setError(errorMessage);
        }
    };

    // Функция для отображения аватара, если он уже сохранён в базе данных
    const fetchAvatar = async (userId: number) => {
        try {
            const response = await api.get(`/users/${userId}/avatar`, {
                responseType: 'arraybuffer', // Для получения бинарных данных
            });
            const blob = new Blob([response.data], { type: 'image/jpeg' }); // Предполагаем, что аватар — изображение
            const previewURL = URL.createObjectURL(blob);
            setAvatarPreview(previewURL);
        } catch (err) {
            console.error("Ошибка загрузки аватара:", err);
        }
    };

    useEffect(() => {
        // Пример: загрузка аватара для текущего пользователя (можно адаптировать для нового пользователя)
        if (currentUser.id) {
            fetchAvatar(currentUser.id);
        }
    }, [currentUser.id]);

    if (currentUser.role !== "admin") {
        return (
            <div className="p-6">
                <p className="text-red-500">Доступ запрещён: Только администраторы могут получить доступ к этой странице</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl">
                <h1 className="text-4xl font-bold text-center mb-8">Создание аккаунта сотрудника</h1>
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Left Section: Avatar and Upload Button */}
                    <div className="flex flex-col items-center w-full md:w-1/3">
                        <div className="relative">
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt="Preview аватара"
                                    className="w-48 h-48 rounded-lg object-cover border-2 border-purple-500"
                                />
                            ) : (
                                <div className="w-48 h-48 rounded-lg bg-gray-200 flex items-center justify-center border-2 border-purple-500">
                                    <span className="text-gray-500">Нет аватара</span>
                                </div>
                            )}
                            <label
                                htmlFor="avatar-upload"
                                className="absolute top-2 right-2 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600"
                            >
                                Загрузить аватар
                            </label>
                            <input
                                type="file"
                                id="avatar-upload"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                        </div>
                    </div>

                    {/* Right Section: Form Fields */}
                    <div className="w-full md:w-2/3 space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">ФИО</label>
                            <input
                                type="text"
                                name="fullName"
                                value={newUser.New.fullName}
                                onChange={handleInputChange}
                                className="p-3 border rounded-full w-full border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                                placeholder="Введите ФИО"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Пароль</label>
                            <input
                                type="password"
                                name="password"
                                value={newUser.New.password}
                                onChange={handleInputChange}
                                className="p-3 border rounded-full w-full border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                                placeholder="Введите пароль"
                                required
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="w-1/2">
                                <label className="block text-sm font-medium mb-1 text-gray-700">Телефон</label>
                                <input
                                    type="text"
                                    name="phoneNumber"
                                    value={newUser.New.phoneNumber || ""}
                                    onChange={handleInputChange}
                                    className="p-3 border rounded-full w-full border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                                    placeholder="Введите номер телефона (опционально)"
                                />
                            </div>
                            <div className="w-1/2">
                                <label className="block text-sm font-medium mb-1 text-gray-700">Почта</label>
                                <input
                                    type="email"
                                    name="email"
                                    value="01.01.0001" // Dummy value as per image, but you can make it editable if needed
                                    disabled
                                    className="p-3 border rounded-full w-full border-purple-300 bg-gray-100 cursor-not-allowed"
                                    placeholder="01.01.0001"
                                />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-1/2">
                                <label className="block text-sm font-medium mb-1 text-gray-700">Роли</label>
                                <select
                                    name="role"
                                    value={newUser.New.role}
                                    onChange={handleInputChange}
                                    className="p-3 border rounded-full w-full border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                                >
                                    <option value={UserRole.ADMIN}>Admin</option>
                                    <option value={UserRole.MANAGER}>Manager</option>
                                    <option value={UserRole.USER}>User</option>
                                </select>
                            </div>
                            <div className="w-1/2">
                                <label className="block text-sm font-medium mb-1 text-gray-700">Пол</label>
                                <select
                                    name="gender"
                                    value="Женский" // Default value as per image, can be made dynamic
                                    disabled
                                    className="p-3 border rounded-full w-full border-purple-300 bg-gray-100 cursor-not-allowed"
                                >
                                    <option value="Мужской">Мужской</option>
                                    <option value="Женский">Женский</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 mt-6">
                            <button
                                onClick={createNewUser}
                                className="bg-blue-500 text-white p-3 rounded-full px-8 hover:bg-blue-600 disabled:bg-gray-400"
                                disabled={!newUser.New.password.trim()} // Disable if password is empty
                            >
                                Создать аккаунт
                            </button>
                        </div>
                        {error && <p className="text-red-500 mt-4">{error}</p>}
                        {success && <p className="text-green-500 mt-4">{success}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps<MailProps> = async (context) => {
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
        console.error("Ошибка при получении пользователя для mail:", error);
        return {
            redirect: { destination: "/", permanent: false },
        };
    }
};