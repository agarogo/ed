import { useState, useEffect } from "react";
import api from "../lib/api";
import { User, UserRole, UserUpdate } from "../lib/types";
import { useRouter } from "next/router";
import { logout } from "../lib/auth";

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
                let endpoint: string;
                if (userId === "me") {
                    endpoint = "/users/me";
                } else {
                    // Теперь обычный пользователь может просматривать профили других пользователей
                    endpoint = `/users/${userId}`;
                }
                console.log("Fetching user from:", endpoint);
                const response = await api.get<User>(endpoint);
                console.log("User fetched:", response.data);
                setUser(response.data);
                setFormData({
                    full_name: response.data.full_name,
                    phone_number: response.data.phone_number,
                    role: response.data.role,
                });
            } catch (err: any) {
                console.error("Failed to fetch user:", err.message);
                if (err.response) {
                    console.error("Response status:", err.response.status);
                    console.error("Response data:", err.response.data);
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
            const endpoint = userId === "me" ? "/users/me" : `/users/${userId}`;
            const response = await api.put<User>(endpoint, formData);
            setUser(response.data);
            setEditMode(false);
        } catch (err) {
            console.error("Update failed:", err);
        }
    };

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    if (loading) return <p>Loading...</p>;
    if (!user) return <p>User not found</p>;

    return (
        <div className="container mx-auto mt-24">
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
                        <label className="block text-sm font-medium mb-1">Phone Number</label>
                        <input
                            type="text"
                            value={formData.phone_number || ""}
                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                            className="p-2 border rounded w-full"
                        />
                    </div>
                    {(currentUser.role === "admin" || userId === "me") && ( // Редактирование доступно для админа или в своём профиле
                        <div>
                            <label className="block text-sm font-medium mb-1">Role</label>
                            <select
                                value={formData.role || ""}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                className="p-2 border rounded w-full"
                            >
                                <option value="admin">Admin</option>
                                <option value="manager">Manager</option>
                                <option value="user">User</option>
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
                <div className="space-y-2">
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Phone:</strong> {user.phone_number || "N/A"}</p>
                    <p><strong>Role:</strong> {user.role}</p>
                    <div className="space-x-2">
                        {(currentUser.role === "admin" || (userId === "me" && currentUser.id === user.id)) && ( // Кнопка "Edit" для админа или в своём профиле
                            <button
                                onClick={() => setEditMode(true)}
                                className="bg-blue-500 text-white p-2 w-14 rounded-xl hover:bg-blue-600"
                            >
                                Edit
                            </button>
                        )}
                        {userId === "me" && currentUser.id === user.id && ( // Кнопка "Выйти" только в своём профиле
                            <button
                                onClick={handleLogout}
                                className="bg-red-600 hover:bg-red-700 p-2 rounded-xl"
                            >
                                Выйти
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;