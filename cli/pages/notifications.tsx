import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { parseCookies } from "nookies";
import api from "../lib/api";
import { isAuthenticated } from "../lib/auth";
import { User, UserRole } from "../lib/types";

interface Notification {
    id: number;
    message: string;
    is_read: boolean;
    created_at: string;
    data?: { blocked_user_id?: number } | null;
}

interface NotificationsProps {
    currentUser: User;
    initialNotifications: Notification[];
}

export default function Notifications({ currentUser, initialNotifications }: NotificationsProps) {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
    const [error, setError] = useState<string | null>(null);
    const [unblockedIds, setUnblockedIds] = useState<Set<number>>(new Set());
    const [hiddenNotifications, setHiddenNotifications] = useState<Set<number>>(new Set()); // Новое состояние для скрытых уведомлений

    const fetchNotifications = async () => {
        try {
            const response = await api.get<Notification[]>("/users/me/notifications", {
                withCredentials: true,
            });
            setNotifications(response.data);
        } catch (err: any) {
            console.error("Failed to fetch notifications:", err);
            setError(err.response?.data?.detail || "Не удалось загрузить уведомления");
            if (err.response?.status === 401) {
                router.push("/");
            }
        }
    };

    const markAsRead = async (notificationId: number) => {
        try {
            await api.put(`/users/notifications/${notificationId}/read`, null, {
                withCredentials: true,
            });
            setNotifications((prev) =>
                prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
            );
        } catch (err: any) {
            console.error("Failed to mark notification as read:", err);
            setError("Не удалось отметить уведомление как прочитанное");
            if (err.response?.status === 401) {
                router.push("/");
            }
        }
    };

    const hideNotification = (notificationId: number) => {
        setHiddenNotifications((prev) => new Set(prev).add(notificationId));
    };

    const unblockUser = async (notificationId: number, blockedUserId: number) => {
        try {
            await api.post(`/users/unblock/${blockedUserId}`, null, {
                withCredentials: true,
            });
            await api.put(`/users/notifications/${notificationId}/read`, null, {
                withCredentials: true,
            });
            setUnblockedIds((prev) => new Set(prev).add(blockedUserId));
            setNotifications((prev) =>
                prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
            );
            hideNotification(notificationId); // Скрываем уведомление после разблокировки
            alert("Пользователь успешно разблокирован");
        } catch (err: any) {
            console.error("Failed to unblock user:", err);
            setError(err.response?.data?.detail || "Не удалось разблокировать пользователя");
            if (err.response?.status === 401) {
                router.push("/");
            }
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    return (
        <div className="min-h-screen">
            <div className="mt-24 container2 mx-auto">
                <h1 className="text-4xl font-bold mb-8">Уведомления</h1>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                {notifications.length === 0 ? (
                    <p className="text-center text-xl">Нет новых уведомлений</p>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((notification) => (
                            !hiddenNotifications.has(notification.id) && ( // Условный рендеринг: скрываем уведомление, если его ID в hiddenNotifications
                                <div
                                    key={notification.id}
                                    className={`bg-white rounded-2xl shadow-md p-4 flex items-center justify-between ${
                                        notification.is_read ? "opacity-50" : ""
                                    }`}
                                >
                                    <div>
                                        <p className="text-lg font-semibold">{notification.message}</p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(notification.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex space-x-4">
                                        {!notification.is_read && (
                                            <button
                                                onClick={() => markAsRead(notification.id)}
                                                className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600"
                                            >
                                                Отметить как прочитанное
                                            </button>
                                        )}
                                        {currentUser.role === UserRole.ADMIN &&
                                            notification.data?.blocked_user_id && (
                                                <button
                                                    onClick={() => unblockUser(notification.id, notification.data.blocked_user_id!)}
                                                    disabled={unblockedIds.has(notification.data.blocked_user_id)}
                                                    className={`px-4 py-2 rounded-full text-white ${
                                                        unblockedIds.has(notification.data.blocked_user_id)
                                                            ? "bg-gray-400 cursor-not-allowed"
                                                            : "bg-green-500 hover:bg-green-600"
                                                    }`}
                                                >
                                                    {unblockedIds.has(notification.data.blocked_user_id)
                                                        ? "Разблокировано"
                                                        : "Разблокировать"}
                                                </button>
                                            )}
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps<NotificationsProps> = async (context) => {
    if (!isAuthenticated(context)) {
        return {
            redirect: { destination: "/", permanent: false },
        };
    }

    const { _token } = parseCookies(context);
    try {
        const userResponse = await api.get<User>("/users/me", {
            headers: { Authorization: `Bearer ${_token}` },
            withCredentials: true,
        });
        const notificationsResponse = await api.get<Notification[]>("/users/me/notifications", {
            headers: { Authorization: `Bearer ${_token}` },
            withCredentials: true,
        });
        return {
            props: {
                currentUser: userResponse.data,
                initialNotifications: notificationsResponse.data,
            },
        };
    } catch (error) {
        console.error("Error fetching data for notifications:", error);
        return {
            redirect: { destination: "/", permanent: false },
        };
    }
};