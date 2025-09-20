"use client";

import React, { useState, useEffect } from "react";

export default function AboutPage() {
    const [currentTheme, setCurrentTheme] = useState("light");

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        const htmlClass = document.documentElement.className;
        setCurrentTheme(savedTheme || htmlClass || "light");

        const observer = new MutationObserver(() => {
            setCurrentTheme(document.documentElement.className);
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => observer.disconnect();
    }, []);

    const isDarkMode = currentTheme.includes("dark");

    const headerBgClass = `w-full rounded-3xl p-8 mb-6 backdrop-blur-sm transition-colors duration-500 ${
        isDarkMode ? "bg-gray-800/60 text-white" : "bg-white/50 text-gray-800"
    }`;

    const sectionClass = `w-full shadow-xl rounded-3xl p-6 mb-4 transition-colors duration-500 ${
        isDarkMode
            ? "bg-gray-800/70 text-white border border-gray-700"
            : "bg-white/50 text-gray-800 border border-gray-300"
    }`;

    const headingClass = `text-2xl sm:text-2xl font-extrabold mb-2 transition-colors duration-500 ${
        isDarkMode ? "text-white" : "text-gray-800"
    }`;

    const paragraphClass = `text-lg font-bold transition-colors duration-500 ${
        isDarkMode ? "text-white" : "text-gray-800"
    }`;

    return (
        <div className="flex flex-col items-center justify-between min-h-screen pt-2 pb-2 px-4">
            <div className="max-w-4xl w-full">
                {/* Page Header */}
                <div className={headerBgClass}>
                    <h1 className="text-4xl font-extrabold text-center">About Our Project</h1>
                </div>

                {/* Sections */}
                <div className="space-y-4">
                    {/* Mission */}
                    <div className={sectionClass}>
                        <div className="flex items-start gap-3">
                            <div className="text-3xl p-2 rounded-full">🎯</div>
                            <div>
                                <h2 className={headingClass}>Our Mission</h2>
                                <p className={paragraphClass}>
                                    This project protects the Sea of Galilee by empowering local communities to report pollution and share information. We aim to foster a cleaner environment for everyone.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Vision */}
                    <div className={sectionClass}>
                        <div className="flex items-start gap-3">
                            <div className="text-3xl p-2 rounded-full">🌟</div>
                            <div>
                                <h2 className={headingClass}>Our Vision</h2>
                                <p className={paragraphClass}>
                                    We envision a future where community-led action drives proactive conservation, demonstrating how technology and collaboration lead to lasting change.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* How to Help */}
                    <div className={sectionClass}>
                        <div className="flex items-start gap-3">
                            <div className="text-3xl p-2 rounded-full">🤝</div>
                            <div>
                                <h2 className={headingClass}>How You Can Help</h2>
                                <p className={paragraphClass}>
                                    You can contribute by uploading reports and volunteering for cleanup efforts. Your participation is vital to our success.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}