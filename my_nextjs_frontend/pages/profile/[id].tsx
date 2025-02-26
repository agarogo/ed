import { GetServerSideProps } from "next";
import { parseCookies } from "nookies";
import api from "../../lib/api";
import { User } from "../../lib/types";
import UserProfile from "../../components/UserProfile";

interface ProfileProps {
    currentUser: User;
    userId: string;
}

export default function Profile({ currentUser, userId }: ProfileProps) {
    return <UserProfile currentUser={currentUser} userId={userId} />;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { _token } = parseCookies(context);
    const { id } = context.params as { id: string };
    if (!_token) {
        return {
            redirect: { destination: "/", permanent: false },
        };
    }

    try {
        const response = await api.get<User>("/users/me", {
            headers: { Authorization: `Bearer ${_token}` },
        });
        return { props: { currentUser: response.data, userId: id } };
    } catch {
        return {
            redirect: { destination: "/", permanent: false },
        };
    }
};