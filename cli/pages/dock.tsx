import { GetServerSideProps } from "next";
import { parseCookies } from "nookies";
import api from "../lib/api";
import { User } from "../lib/types";
import { isAuthenticated } from "../lib/auth";
import { useState, useEffect } from "react";
interface DockProps {
    currentUser: User;
}

export default function Dock({ currentUser }: DockProps) {
    const [error, setError] = useState<string | null>(null); // State for error handling

    const handleDownload = (fileName: string) => {
        try {
            const encodedFileName = encodeURIComponent(fileName); // Кодируем имя файла для поддержки русских символов и пробелов
            const filePath = `/documents/${encodedFileName}`; // Path within public directory
            const link = document.createElement("a");
            link.href = filePath; // Use relative path for Next.js public directory
            link.download = fileName; // Set the file name for download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setError(null); // Clear any previous errors
        } catch (err) {
            console.error("Download failed:", err);
            setError(`Failed to download ${fileName}. Please try again or contact support.`);
        }
    };

    return (
        <div className="container2 bg-[#] mx-auto mt-24">
            <h1 className="text-2xl font-bold mb-4">Документы</h1>
            <div className="space-y-4">
                <button
                    onClick={() => handleDownload("Бланк письма.docx")}
                    className="bg-blue-500 text-white p-2 rounded-xl hover:bg-blue-600"
                >
                    Скачать Бланк письма
                </button>
                <button
                    onClick={() => handleDownload("Заявление на отпуск.docx")}
                    className="bg-blue-500 text-white p-2 rounded-xl hover:bg-blue-600 ml-5"
                >
                    Скачать Заявление на отпуск
                </button>
                <button
                    onClick={() => handleDownload("Заявление на увольнение.docx")}
                    className="bg-blue-500 text-white p-2 rounded-xl hover:bg-blue-600 ml-5"
                >
                    Скачать Заявление на увольнение
                </button>
                <button
                    onClick={() => handleDownload("СЗ на выдачу средств под отчет.docx")}
                    className="bg-blue-500 text-white p-2 rounded-xl hover:bg-blue-600 ml-5"
                >
                    Скачать СЗ на выдачу средств под отчет
                </button>
            </div>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps<DockProps> = async (context) => {
    if (!isAuthenticated(context)) {
        return {
            redirect: { destination: "/", permanent: false },
        };
    }

    const { _token } = parseCookies(context);
    try {
        const response = await api.get<User>("/users/me", {
            headers: { Authorization: `Bearer ${_token}` },
        });
        return { props: { currentUser: response.data } };
    } catch (error) {
        console.error("Error fetching user for dock:", error);
        return {
            redirect: { destination: "/", permanent: false },
        };
    }
};