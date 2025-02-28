import { useRouter } from "next/router";
import { User, UserRole } from "../lib/types";
import { logout } from "../lib/auth";
import { useState } from "react"; // Import useState for modal state

interface HeaderProps {
    currentUser: User | null; // Делаем currentUser опциональным
}

const Header: React.FC<HeaderProps> = ({ currentUser }) => {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility

    const handleDashboardClick = () => {
        router.push("/dashboard");
    };

    const handleNewsClick = () => {
        router.push("/news");
    };

    const handleProfileClick = () => {
        if (currentUser) {
            setIsModalOpen(true);
        } else {
            console.warn("Cannot open profile: user not authenticated");
        }
    };

    const handleMailClick = () => {
        if (currentUser && currentUser.role === "admin") {
            router.push("/mail");
        } else {
            console.warn("Only admins can access Create Employee");
        }
    };

    const handleCreateNewsClick = () => {
        if (currentUser && currentUser.role === "admin") {
            router.push("/create-news"); // Предполагаем, что страница для создания новости — /create-news
        } else {
            console.warn("Only admins can create news");
        }
    };

    const handleWelcomeClick = () => {
        router.push("/welcome");
    };

    const handleLogout = () => {
        if (currentUser) {
            logout();
            router.push("/");
        } else {
            console.warn("Cannot logout: user not authenticated");
        }
    };

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    if (!currentUser) {
        return null;
    }

    return (
        <header className="text-black p-4">
            <div className="container mx-auto flex">
                <form onClick={handleWelcomeClick}>
                    <div className="h-[30px] hed w-[150px] my-auto mt-1"></div>
                </form>

                {currentUser.role === "admin" && (
                    <>
                        <button
                            onClick={handleMailClick}
                            className="p-2 rounded text-xl ml-16"
                        >
                            Создать аккаунт сотрудника
                        </button>
                        <button
                            onClick={handleCreateNewsClick}
                            className="p-2 rounded text-xl ml-16"
                        >
                            Создать новость
                        </button>
                    </>
                )}

                <button
                    onClick={handleDashboardClick}
                    className="p-2 rounded text-xl ml-16"
                >
                    Список сотрудника
                </button>
                <button
                    onClick={handleNewsClick}
                    className="p-2 rounded text-xl ml-16"
                >
                    Новости
                </button>

                <div className="space-x-4 ml-auto flex">
                    <button
                        onClick={handleProfileClick}
                        className="h-[40px] w-[180px] text-xl"
                    >
                        Учетная запись
                    </button>
                </div>
            </div>

            {/* Modal Overlay and Content */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeModal}>
                    <div className="bg-white p-6 rounded-lg shadow-lg w-[60%] max-w-4xl" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={closeModal}
                            className="absolute top-2 right-2 text-black hover:text-gray-700 text-2xl font-bold"
                        >
                            ×
                        </button>
                        <h2 className="text-3xl font-bold mb-4">Профиль</h2>
                        <div className="space-y-4">
                            <p><strong>Имя:</strong> {currentUser.full_name}</p>
                            <p><strong>Корп. Email:</strong> {currentUser.email_corporate}</p>
                            <p><strong>Личный Email:</strong> {currentUser.email_user || "N/A"}</p>
                            <p><strong>Телефон:</strong> {currentUser.phone_number || "N/A"}</p>
                            <p><strong>Telegram:</strong> {currentUser.tg_name}</p>
                            <p><strong>Должность:</strong> {currentUser.position_employee}</p>
                            <p><strong>Подразделение:</strong> {currentUser.subdivision}</p>
                            <p><strong>Пол:</strong> {currentUser.sex}</p>
                            <p><strong>Роль:</strong> {currentUser.role}</p>
                        </div>
                        <div className="mt-4 flex justify-end space-x-4">
                            <button
                                onClick={handleLogout}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                            >
                                Выйти
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;