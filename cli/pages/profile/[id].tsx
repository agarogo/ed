import { GetServerSideProps } from "next";
import { parseCookies } from "nookies";
import api from "../../lib/api";
import { User } from "../../lib/types";
import UserProfile from "../../components/UserProfile";
import { isAuthenticated } from "../../lib/auth";

interface ProfileProps {
    currentUser: User;
    userId: string;
}

export default function Profile({ currentUser, userId }: ProfileProps) {
    return <UserProfile currentUser={currentUser} userId={userId} />;
}

export const getServerSideProps: GetServerSideProps<ProfileProps> = async (context) => {
    if (!isAuthenticated(context)) {
        return {
            redirect: { destination: "/", permanent: false },
        };
    }

    const { _token } = parseCookies(context);
    const { id } = context.params as { id: string };

    try {
        const response = await api.get<User>("/users/me", {
            headers: { Authorization: `Bearer ${_token}` },
        });

        // Если это не админ, разрешаем только доступ к своему профилю
        if (response.data.role !== "admin" && id !== "me") {
            return {
                redirect: { destination: "/profile/me", permanent: false },
            };
        }

        // Если это другой пользователь и не админ, перенаправляем на свой профиль
        if (id !== "me" && response.data.role !== "admin") {
            return {
                redirect: { destination: "/profile/me", permanent: false },
            };
        }

        return { props: { currentUser: response.data, userId: id } };
    } catch (error) {
        console.error("Error fetching user for profile:", error);
        return {
            redirect: { destination: "/", permanent: false },
        };
    }
};