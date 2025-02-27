import { useState, useEffect } from "react";
import { login } from "../lib/auth";
import { useRouter } from "next/router";
import { isAuthenticated } from "../lib/auth";
import "../styles/globals.css";

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
            console.log("Attempting login with email:", email, "and password:", password);
            const loginResponse = await login(email, password);
            console.log("Login successful, token:", loginResponse.access_token);
            console.log("Redirecting to dashboard via router.push");
            await router.push("/welcome");
        } catch (err: any) {
            console.error("Login error:", err);
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            setError(
                newAttempts >= 3
                    ? "Account locked due to too many attempts"
                    : err.response?.data?.detail || "Login failed"
            );
        }
    };

    // Проверка токена после монтирования компонента
    useEffect(() => {
        console.log("Checking authentication on mount");
        if (isAuthenticated()) {
            console.log("User is authenticated, redirecting to dashboard");
            router.push("/dashboard");
        }
    }, []);

    return (
        <div className="h-screen flex items-center justify-center relative bg-white">


            <form onSubmit={handleSubmit} className="h-screen bg-white rounded mr-auto  w-[49%] flex ">
                <div className="h-[30%] my-auto w-[40%] mx-auto">
                    <h1 className="text-5xl font-bold">Авторизация</h1>
                    <div className="w-full mx-auto mt-10">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-12 border rounded-[20] p-4 bg-[#EBEBEB] text-xl"
                            required
                        />

                    </div>
                    <div className="w-full mx-auto mt-5">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-12 border rounded-[20] p-4 bg-[#EBEBEB] text-xl"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 mb-4 text-xl">{error}</p>}
                    <p className="text-[#3314F1] mt-5">Забыли пароль?</p>
                    <button
                        type="submit"
                        disabled={attempts >= 3}
                        className="h-20 mt-5 bg-[#3314F1] text-white p-2 rounded-[20] hover:bg-blue-600 disabled:bg-gray-400 w-full text-xl"
                    >
                        Войти
                    </button>
                </div>
            </form>


            <div className="w-[49%] mr-auto h-[96%] rounded-3xl diagonal-gradient">
                <div className=" inset-0 overflow-hidden">
                    <div className="absolute w-[593.96px] h-[429.67px] ml-[5%] fi4 rounded-full animate-breathe-up-down delay-4"></div>
                    {/* Div 4 - Diagonal Breathing (up-left/down-right) */}
                    <div className="absolute w-[518px] h-[385.38px] mt-[30%] fi2 rounded-full animate-breathe-diagonal-ul-dr delay-6"></div>
                    {/* Div 1 - Up/Down Breathing */}
                    <div className="absolute w-[648.6px] h-[500px] ml-[22%] mt-[20%] fi rounded-full animate-breathe-diagonal-ur-dl delay-1"></div>
                    <div className="absolute w-[1200.53px] h-[1300.69px]  fi3 rounded-full animate-breathe-up-down delay-2"></div>
                    {/* Div 2 - Diagonal Breathing (up-right/down-left) */}

                    {/* Div 3 - Up/Down Breathing */}

                </div>
            </div>
        </div>
    );
};

export default LoginForm;