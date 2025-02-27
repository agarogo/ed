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
            console.log("Searching users with query:", query); // Отладка
            const response = await api.get<User[]>(`/users?q=${query}`);
            console.log("Search results:", response.data); // Отладка
            setUsers(response.data);
        } catch (err: any) {
            console.error("Failed to fetch users:", err.message); // Отладка
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
        <div className="container mx-auto ">

            <form onSubmit={handleSearch} className="w-[45%] mt-24 mx-auto">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="p-2 border rounded-xl w-[80%] mr-2"
                />
                <button type="submit" className="bg-blue-500 text-white p-2 rounded-xl hover:bg-blue-600">
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
                <ul className=" flex">
                    {users.map((user) => (
                        <li key={user.id} className=" bg-white rounded-xl shadow flex  items-center h-64 w-52 ml-10">
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