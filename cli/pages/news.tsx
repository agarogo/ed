import { useState, useEffect } from "react";
import api from "../lib/api";
import { User, UserRole } from "../lib/types";
import Link from "next/link";
import { GetServerSideProps } from "next";
import { parseCookies } from "nookies";
import { isAuthenticated } from "../lib/auth";

interface News {
    id: number;
    title: string;
    content: string;
    created_by: number;
    is_active: boolean;
    created_at: string;
}

interface NewsProps {
    currentUser: User;
}

export default function News({ currentUser }: NewsProps) {
    const [news, setNews] = useState<News[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    }>({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true);
            try {
                const token = parseCookies()._token;
                const response = await api.get<News[]>("/news", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log("News fetched:", response.data);
                setNews(response.data);
            } catch (err: any) {
                console.error("Failed to fetch news:", err.message);
                setError(err.message || "Не удалось загрузить новости");
            } finally {
                setLoading(false);
            }
        };
        fetchNews();
    }, []);

    const targetDate = new Date("2025-03-02T00:00:00");

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const difference = targetDate.getTime() - now.getTime();

            if (difference <= 0) {
                setTimeLeft({
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                });
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            setTimeLeft({
                days,
                hours,
                minutes,
                seconds,
            });
            console.log("Time left updated:", { days, hours, minutes, seconds });
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="h-screen">
            <div className="mt-24 container2 mx-auto">  
                <p className="text-4xl font-bold p-12 text-center bg-gray-200 rounded-3xl mb-8">
                    Создавайте рассказы, которые <span className="text-[#3314F1]">вдохновляют</span>, дают <span className="text-[#3314F1]">знания</span>, и <span className="text-[#3314F1]">развлечение</span>
                </p>
                
                <div className="h-[40vh] my-auto mx-auto w-[100%] flex">  
                    <div className="h-[100%] w-[70%] flex diagonal-gradient rounded-[35]">
                        <div className="h-[80%] my-auto w-[49%] ">
                            <div className="h-full mx-auto fi6 w-[60%]"></div>
                        </div>
                        <div className="h-full  w-[51%]  p-6">
                            <p className="text-white text-3xl font-bold">One Task Of The Month</p>
                            <div className="h-[35%] w-full rounded-3xl bg-white mt-[30%] flex">
                                <div className="text-center text-black my-auto mx-auto">
                                    <h2 className="text-xl font-bold">Countdown to March 2, 2025</h2>
                                    <div className="flex space-x-4 text-lg">
                                        <div className="flex space-x-4 mt-4 text-lg mx-auto">
                                            <div>
                                                <span className="block text-2xl font-bold">{timeLeft.days}</span>
                                                <span>Days</span>
                                            </div>
                                            <div>
                                                <span className="block text-2xl font-bold">{timeLeft.hours}</span>
                                                <span>Hours</span>
                                            </div>
                                            <div>
                                                <span className="block text-2xl font-bold">{timeLeft.minutes}</span>
                                                <span>Minutes</span>
                                            </div>
                                            <div className="mr-auto">
                                                <span className="block text-2xl font-bold">{timeLeft.seconds}</span>
                                                <span>Seconds</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex">
                                <p className="text-white text-xl ml-auto mt-5">Подробнее</p>
                            </div>
                        </div>
                    </div>
                    <div className="h-[100%] w-[28%] ml-auto ">
                        <p className="text-4xl font-bold">Закрытие “<span className="text-[#3314F1]">Моя профессия IT 2025</span>” </p>
                        <p className="text-xl mt-[50%] font-bold">2 Марта будет проводится закрытие хакатона “Моя профессия IT 2025”</p>
                    </div>
                </div>

                <p className="text-4xl font-bold mt-24">Последние новости</p>
                <div className="grid h-[30vh] grid-cols-4 gap-6 mt-5">
                    
                    {loading ? (
                        <p className="text-center col-span-2">Загрузка...</p>
                    ) : error ? (
                        <p className="text-red-500 text-center col-span-2">{error}</p>
                    ) : news.length === 0 ? (
                        <p className="text-center col-span-2">Новостей не найдено</p>
                    ) : (
                        news.map((item) => (
                            
                            <div
                                key={item.id}
                                className="bg-white p-4 rounded-2xl shadow-md flex flex-col items-center"
                            >   
                                <div className="h-[20vh] fi9 w-full rounded-2xl"></div>
                                <h3 className="text-xl font-bold mb-2 mt-auto">{item.title}</h3>
                                <p className="text-center mb-2 text-sm line-clamp-3">{item.content}</p>
                                <p className="text-center mb-2 text-sm">
                                    Добавлено: {new Date(item.created_at).toLocaleDateString()}
                                </p>
                                <Link
                                    href={`/news/${item.id}`}
                                    className="bg-[#3314F1] text-white px-4 py-2 rounded-full hover:bg-purple-600"
                                >
                                    Подробнее
                                </Link>
                            </div>
                        ))
                    )}
                </div>
                <div className="h-[20vh]"></div>
            </div>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps<NewsProps> = async (context) => {
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
        console.error("Error fetching user for news:", error);
        return {
            redirect: { destination: "/", permanent: false },
        };
    }
};