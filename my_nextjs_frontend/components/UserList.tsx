import { useState } from "react";
import api from "../lib/api";
import { User } from "../lib/types";
import Link from "next/link";

interface UserListProps {
    currentUser: User;
}

const UserList: React.FC<UserListProps> = ({ currentUser }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = async (query: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get<User[]>(`/users?q=${query}`);
            setUsers(response.data);
        } catch (err: any) {
            console.error("Failed to fetch users:", err.message);
            setError(err.message || "Failed to fetch users");
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

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Users</h1>
            <form onSubmit={handleSearch} className="mb-4">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="p-2 border rounded w-64 mr-2"
                />
                <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                    Search
                </button>
            </form>
            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : users.length === 0 ? (
                <p>No users found</p>
            ) : (
                <ul className="space-y-2">
                    {users.map((user) => (
                        <li key={user.id} className="p-4 bg-white rounded shadow flex justify-between items-center">
                            <Link href={`/profile/${user.id}`} className="text-blue-500 hover:underline">
                                {user.full_name} ({user.email})
                            </Link>
                            {currentUser.role === "admin" && (
                                <Link href={`/profile/${user.id}`} className="text-green-500 hover:underline">
                                    Edit
                                </Link>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default UserList;