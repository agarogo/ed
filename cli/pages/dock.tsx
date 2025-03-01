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
            <h1 className="text-5xl font-bold mb-4">Документы</h1>
            <div className="space-y-4 mt-20">
                <div className="h-[30vh] w-full flex">
                    <div className="h-full w-[20%] rounded-2xl fi12 border-2 border-black"></div>
                    <div className=" ml-20">
                        <p className="text-3xl mt-10">Бланк письма</p>
                        <button
                        onClick={() => handleDownload("Бланк письма.docx")}
                        className="bg-blue-500 text-white  mt-[140px] p-3 rounded-3xl hover:bg-blue-600 text-center w-36 text-xl"
                        >
                            Скачать 
                        </button>
                    </div>
                    
                </div>
                
                <div className="h-[30vh] w-full flex">
                    <div className="h-full w-[20%] rounded-2xl fi10 border-2 border-black"></div>
                    <div className=" ml-20">
                        <p className="text-3xl mt-10">Заявление на отпуск</p>
                        <button
                            onClick={() => handleDownload("Заявление на отпуск.docx")}
                            className="bg-blue-500 text-white  mt-[140px] p-3 rounded-3xl hover:bg-blue-600 text-center w-36 text-xl"
                        >
                            Скачать 
                        </button>
                    </div>
                </div>

                <div className="h-[30vh] w-full flex">
                    <div className="h-full w-[20%] rounded-2xl fi11 border-2 border-black"></div>
                    <div className=" ml-20">
                        <p className="text-3xl mt-10">Заявление на увольнение</p>
                        <button
                            onClick={() => handleDownload("Заявление на увольнение.docx")}
                            className="bg-blue-500 text-white  mt-[140px] p-3 rounded-3xl hover:bg-blue-600 text-center w-36 text-xl"
                        >
                            Скачать 
                        </button>   
                    </div>
                </div>

                <div className="h-[30vh] w-full flex">
                    <div className="h-full w-[20%] rounded-2xl fi13 border-2 border-black"></div>
                    <div className=" ml-20">
                        <p className="text-3xl mt-10">СЗ на выдачу средств под отчет</p>
                        <button
                            onClick={() => handleDownload("СЗ на выдачу средств под отчет.docx")}
                            className="bg-blue-500 text-white mt-[140px] p-3 rounded-3xl hover:bg-blue-600 text-center w-36 text-xl"
                        >
                            Скачать
                        </button>
                    </div>
                </div>  
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