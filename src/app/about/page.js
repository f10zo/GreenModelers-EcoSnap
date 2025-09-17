"use client";

import React, { useState, useEffect } from "react";

export default function AboutPage() {
    const [currentTheme, setCurrentTheme] = useState('light');

    // Watch <html> theme changes
    useEffect(() => {
        const observer = new MutationObserver(() => {
            const newTheme = document.documentElement.className;
            setCurrentTheme(newTheme);
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const isDarkMode = currentTheme.includes('dark');

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            {/* Main content container */}
            <div className={`backdrop-blur-sm shadow-2xl rounded-3xl p-8 max-w-7xl mx-auto text-center transition-colors duration-500 ${isDarkMode ? 'bg-gray-800/60 text-white' : 'bg-white/30 text-black'}`}>

                {/* Title Section */}
                <h1 className={`text-4xl font-extrabold mb-8 transition-colors duration-500 ${isDarkMode ? 'text-white-300' : 'text-white-700'}`}>About Our Project</h1>

                {/* Two-column layout for Mission and Image */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">

                    {/* Mission Text Column */}
                    <div className="md:w-1/2 text-left">

                        {/* Mission Section with Icon */}
                        <div className="flex items-center gap-4 mb-4">
                            <div className="text-3xl p-2 rounded-full bg-green-500 text-white">🎯</div>
                            <h2 className="text-3xl font-bold">Our Mission</h2>
                        </div>
                        <p className="text-xl font-semibold mb-4">
                            This project protects the Sea of Galilee by empowering local communities to report pollution and share information. We aim to foster a cleaner environment for everyone.
                        </p>

                        {/* Vision Section with Icon */}
                        <div className="flex items-center gap-4 mt-8 mb-4">
                            <div className="text-3xl p-2 rounded-full bg-blue-500 text-white">🌟</div>
                            <h2 className="text-3xl font-bold">Our Vision</h2>
                        </div>
                        <p className="text-xl font-semibold mb-4">
                            We envision a future where community-led action drives proactive conservation, demonstrating how technology and collaboration lead to lasting change.
                        </p>
                    </div>

                    {/* Image Column */}
                    <div className="md:w-1/2 flex justify-center items-center">
                        <img src="/kin1.png" alt="Our Mission" className="rounded-lg shadow-md" />
                    </div>

                </div>

                {/* How to Help Section */}
                <div className="mt-8">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="text-3xl p-2 rounded-full bg-yellow-500 text-white">🤝</div>
                        <h2 className="text-3xl font-bold">How You Can Help</h2>
                    </div>
                    <p className="mt-4 text-xl font-medium">
                        You can contribute by uploading reports and volunteering for cleanup efforts. Your participation is vital to our success.
                    </p>
                </div>

            </div>
        </div>
    );
}