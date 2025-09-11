"use client";


import React, { useState, useEffect } from 'react';
import Image from 'next/image';

export default function AboutPage() {
    const [currentTheme, setCurrentTheme] = useState('light');

    useEffect(() => {
        // Create a MutationObserver to watch for changes to the <html> tag's class attribute
        const observer = new MutationObserver(() => {
            const newTheme = document.documentElement.className;
            setCurrentTheme(newTheme);
        });

        // Start observing the <html> element for attribute changes, specifically the 'class' attribute
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        // Clean up the observer when the component unmounts
        return () => observer.disconnect();
    }, []);

    const imageUrl = currentTheme.includes('dark') ? '/lake-dusk1.png' : '/lake-daylight1.png';

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <div className={`backdrop-blur-sm shadow-2xl rounded-3xl p-8 max-w-2xl mx-auto text-center transition-colors duration-500 ${currentTheme.includes('dark') ? 'bg-gray-800/60 text-white' : 'bg-white/30 text-black'}`}>
                <Image
                    src={imageUrl}
                    alt="Lake view"
                    width={500}
                    height={300}
                    className="rounded-lg mb-6 mx-auto"
                />

                <h1 className={`text-4xl font-extrabold mb-4 transition-colors duration-500 ${currentTheme.includes('dark') ? 'text-emerald-300' : 'text-emerald-700'}`}>About Our Project</h1>
                <p className={`text-lg font-semibold transition-colors duration-500 ${currentTheme.includes('dark') ? 'text-gray-300' : 'text-gray-800'}`}>
                    This project is dedicated to monitoring and protecting our local lake.
                    By allowing users to report pollution and share information, we aim to
                    foster a cleaner, healthier environment for everyone.
                </p>
                <p className={`mt-4 text-base font-medium transition-colors duration-500 ${currentTheme.includes('dark') ? 'text-gray-300' : 'text-gray-800'}`}>
                    You can contribute by uploading reports and volunteering for cleanup efforts.
                </p>
            </div>
        </div>
    );
}
