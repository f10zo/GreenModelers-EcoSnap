'use client';

import { useState, useEffect } from "react";
import Navbar from "./home/components/Navbar";
import HomePageBackground from "./home/components/HomePageBackground";
import "./globals.css";

export default function ClientLayout({ children }) {
    const [currentTheme, setCurrentTheme] = useState("light");
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedTheme = localStorage.getItem("theme");
            const htmlClass = document.documentElement.className;
            setCurrentTheme(savedTheme || htmlClass || "light");
        }
        const observer = new MutationObserver(() => {
            setCurrentTheme(document.documentElement.className);
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => observer.disconnect();
    }, []);

    return (
        <body className="flex flex-col min-h-screen">
            <HomePageBackground>
                <Navbar />
                <main className="p-4 sm:p-8">
                    {children}
                </main>
                <footer
                    className="w-full text-center p-4 transition-colors duration-500 flex flex-col items-center"
                >
                    <div className="w-full flex justify-center items-end mt-3 mb-3">
                        <img
                            src={currentTheme === 'dark' ? "/lake_maps_dark.png" : "/lake_maps_light.png"}
                            alt="Lake Map"
                            className="rounded-lg w-24 sm:w-32 h-auto"
                        />
                    </div>
                    <span
                        className={`font-sans transition-colors duration-500 font-bold
                            ${currentTheme === 'light' ? 'bg-[#2175c9] px-4 py-2 rounded-full border border-[#6da1dc] text-white' : 'text-white'}`}
                    >
                        © 2025 EcoSnap. All rights reserved.
                    </span>
                </footer>
            </HomePageBackground>
        </body>
    );
}
