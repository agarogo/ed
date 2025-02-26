import { GetServerSideProps } from "next";
import { parseCookies } from "nookies";
import api from "../lib/api";
import { User } from "../lib/types";
import UserList from "../components/UserList";

interface DashboardProps {
    currentUser: User;
}

export default function Dashboard({ currentUser }: DashboardProps) {
    return <UserList currentUser={currentUser} />;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { _token } = parseCookies(context);
    if (!_token) {
        return {
            redirect: { destination: "/", permanent: false },
        };
    }

    try {
        const response = await api.get<User>("/users/me", {
            headers: { Authorization: `Bearer ${_token}` },
        });
        return { props: { currentUser: response.data } };
    } catch {
        return {
            redirect: { destination: "/", permanent: false },
        };
    }
};