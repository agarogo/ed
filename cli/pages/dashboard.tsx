import { GetServerSideProps } from "next";
import { parseCookies } from "nookies";
import api from "../lib/api";
import { User } from "../lib/types";
import UserList from "../components/UserList";
import { isAuthenticated } from "../lib/auth";

interface DashboardProps {
    currentUser: User;
}

export default function Dashboard({ currentUser }: DashboardProps) {
    return <UserList currentUser={currentUser} />;
}

export const getServerSideProps: GetServerSideProps<DashboardProps> = async (context) => {
    console.log("Checking authentication for dashboard");
    console.log("Cookies in getServerSideProps:", parseCookies(context));
    if (!isAuthenticated(context)) {
        console.log("Not authenticated, redirecting to /");
        return {
            redirect: { destination: "/", permanent: false },
        };
    }

    try {
        const { _token } = parseCookies(context);
        console.log("Token for dashboard:", _token);
        const response = await api.get<User>("/users/me", {
            headers: { Authorization: `Bearer ${_token}` },
        });
        return { props: { currentUser: response.data } };
    } catch (error) {
        console.error("Error fetching user for dashboard:", error);
        return {
            redirect: { destination: "/", permanent: false },
        };
    }
};