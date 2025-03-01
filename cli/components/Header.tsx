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
      
    const handleNotificationsClick = () => {
        router.push("/notifications");
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
                <button onClick={handleNotificationsClick} className="p-2 rounded text-xl ml-16">
                    Уведомления
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
                    <div className="bg-white p-20 rounded-[40] shadow-lg w-[60%] relative h-[80vh]" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={closeModal}
                            className="absolute top-2 right-16 mt-16 text-black hover:text-gray-700 text-2xl font-bold"
                        >
                            ×
                        </button>
                        <h2 className="text-3xl font-bold mb-4">Профиль</h2>
                        <div className="h-[40%] w-[80%] mx-auto p-10 flex">
                            <div className="h-[100%] w-2/3">
                                <div className="h-40 w-40 my-auto rounded-full fi8"></div>
                            </div>
                            <div className="h-full w-1/3 flex">
                                <button
                                    onClick={handleLogout}
                                    className="rounded-full border-2 h-10 w-20 bg-red-400 text-xl ml-auto mt-auto"
                                >
                                    Выйти
                                </button>
                            </div>
                        </div>
                        <div className="h-[55%] w-full border-2 border-black rounded-[20] p-16 flex">
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
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;