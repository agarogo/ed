import { useState } from "react";
import { login } from "../lib/auth";
import { useRouter } from "next/router";

const LoginForm: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [attempts, setAttempts] = useState(0);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (attempts >= 3) {
            setError("Account locked due to too many attempts");
            return;
        }

        try {
            await login(email, password);
            router.push("/dashboard");
        } catch (err: any) {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            setError(
                newAttempts >= 3
                    ? "Account locked due to too many attempts"
                    : err.response?.data?.detail || "Login failed"
            );
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-96">
                <h1 className="text-2xl font-bold mb-4">Login</h1>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 border rounded"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 border rounded"
                        required
                    />
                </div>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <button
                    type="submit"
                    disabled={attempts >= 3}
                    className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                    Login
                </button>
            </form>
        </div>
    );
};

export default LoginForm;