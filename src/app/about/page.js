"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link"; // <-- Import the Link component

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

    const headerBgClass = `w-full rounded-3xl p-8 mb-6 backdrop-blur-sm transition-colors duration-500 font-sans ${isDarkMode ? "bg-emerald-950/60 text-white border border-emerald-800" : "bg-emerald-100/50 text-emerald-900 border border-emerald-200"
        }`;

    const sectionClass = `w-full shadow-xl rounded-3xl p-6 mb-4 transition-all duration-500 border-2 ${isDarkMode
            ? "bg-emerald-900/70 text-white border-emerald-800 hover:border-white"
            : "bg-emerald-50/50 text-emerald-900 border-emerald-200 hover:border-emerald-800"
        }`;

    const headingClass = `text-2xl sm:text-2xl font-extrabold mb-2 transition-colors duration-500 font-sans ${isDarkMode ? "text-white" : "text-emerald-900"
        }`;

    const paragraphClass = `text-lg font-bold transition-colors duration-500 font-serif ${isDarkMode ? "text-emerald-50" : "text-emerald-800"
        }`;

    return (
        <div className="flex flex-col items-center pt-2 px-4">
            <div className="max-w-4xl w-full">
                {/* Page Header */}
                <div className={headerBgClass}>
                    <h1 className="text-4xl font-extrabold text-center font-serif">About Our Project</h1>
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
                    <Link href="/published-campaigns" passHref> {/* <-- The Link component wraps the section */}
                        <div className={`${sectionClass} cursor-pointer hover:scale-[1.02]`}>
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
                    </Link>
                </div>
            </div>
        </div>
    );
}
