import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { parseCookies } from "nookies";
import api from "../lib/api";
import { User } from "../lib/types";
import { isAuthenticated } from "../lib/auth";
import { useState, useEffect } from "react"; // Import useState and useEffect

interface WelcomeProps {
    currentUser: User;
}

export default function Welcome({ currentUser }: WelcomeProps) {
    const router = useRouter();
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


    const handleDockClick = () => {
        router.push("/dock");
    };

    // Target date: March 2, 2025
    const targetDate = new Date("2025-03-02T00:00:00");

    // Calculate time remaining for the countdown
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

        // Cleanup interval on component unmount
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="container2 bg-[#] mx-auto mt-24">
            <h1 className="text-5xl font-bold">Новости</h1>
            <div className="h-[40vh] w-[65%] diagonal-gradient ml-auto rounded-[40] flex">
                <div className="h-[80%] my-auto mx-auto w-[90%] flex">
                    <div className="h-[95%] w-[49%]  my-auto">
                        <div className="h-[100%] w-[70%] fi6 my-auto"></div>
                    </div>
                    <div className="h-full w-[51%]">
                        <p className="text-white text-5xl font-bold">One Task Of The Month</p>
                        <div className="h-[30%] w-full rounded-3xl bg-white mt-[30%] flex">
                            <div className=" text-center text-black my-auto mx-auto"> {/* Changed text color to match the blue theme */}
                                <h2 className="text-2xl font-bold">Countdown to March 2, 2025</h2>
                                <div className="flex space-x-4 text-lg ">
                                    <div className="flex space-x-4 mt-4 text-2lg mx-auto">
                                        <div className="">
                                            <span className="block text-3xl font-bold">
                                                {timeLeft?.days ?? 0}
                                            </span>
                                            <span>Days</span>
                                        </div>
                                        <div className="">
                                            <span className="block text-3xl font-bold">
                                                {timeLeft?.hours ?? 0}
                                            </span>
                                            <span>Hours</span>
                                        </div>
                                        <div className="">
                                            <span className="block text-3xl font-bold">
                                                {timeLeft?.minutes ?? 0}
                                            </span>
                                            <span>Minutes</span>
                                        </div>
                                        <div className="mr-auto">
                                            <span className="block text-3xl font-bold">
                                                {timeLeft?.seconds ?? 0}
                                            </span>
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
            </div>
            <div className="h-[30vh] w-full bg-white mt-[5%] shadow-md rounded-[40] flex">
                <div className="h-[90%] my-auto mx-auto w-[95%] flex">
                    <div className="h-full w-[50%] ">
                        <p className="text-5xl mt-5 font-bold">Документы</p>
                        <p className="text-2xl mt-1 font-medium">Бланк письма</p>

                        <p className="text-2xl mt-1 font-medium">Заявление на отпуск</p>

                        <p className="text-2xl mt-1 font-medium">Заявление на увольнение</p>

                        <p className="text-2xl mt-1 font-medium">С3 на выдачу средств под отчёт</p>
                        <button onClick={handleDockClick} className="h-20 mt-10 w-[60%] bg-[#3314F1] rounded-[20] text-white text-2xl">Пройти</button>
                    </div>
                    <div className="h-full w-[31%] mx-auto fi7"></div>
                </div>
            </div>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps<WelcomeProps> = async (context) => {
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
        console.error("Error fetching user for welcome:", error);
        return {
            redirect: { destination: "/", permanent: false },
        };
    }
};