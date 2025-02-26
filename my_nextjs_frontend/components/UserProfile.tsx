import { useState, useEffect } from "react";
import api from "../lib/api";
import { User, UserRole, UserUpdate } from "../lib/types";

interface UserProfileProps {
    userId: string;
    currentUser: User;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId, currentUser }) => {
    const [user, setUser] = useState<User | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState<UserUpdate>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                let endpoint: string;
                if (userId === "me") {
                    endpoint = "/users/me";
                } else {
                    // Проверяем, является ли пользователь админом, чтобы запросить профиль другого пользователя
                    if (currentUser.role !== "admin") {
                        throw new Error("Only admins can view other users' profiles");
                    }
                    endpoint = `/users/${userId}`;
                }
                console.log("Fetching user from:", endpoint); // Отладка
                const response = await api.get<User>(endpoint);
                console.log("User fetched:", response.data); // Отладка
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

    if (loading) return <p>Loading...</p>;
    if (!user) return <p>User not found</p>;

    return (
        <div className="p-6">
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
                    {currentUser.role === "admin" && (
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
                    <button
                        onClick={() => setEditMode(true)}
                        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                    >
                        Edit
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserProfile;