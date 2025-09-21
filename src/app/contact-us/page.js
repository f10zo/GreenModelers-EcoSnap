'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function ContactUsPage() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        mobile: "",
        email: "",
        message: "",
    });
    const [status, setStatus] = useState("");
    const [currentTheme, setCurrentTheme] = useState('light');

    useEffect(() => {
        const observer = new MutationObserver(() => {
            const newTheme = document.documentElement.className;
            setCurrentTheme(newTheme);
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("Sending...");

        try {
            await addDoc(collection(db, "contactRequests"), {
                ...formData,
                createdAt: serverTimestamp(),
            });

            setStatus("✅ Your message has been sent successfully!");
            setFormData({
                firstName: "",
                lastName: "",
                mobile: "",
                email: "",
                message: "",
            });
        } catch (error) {
            console.error("Error submitting request: ", error);
            setStatus("❌ Failed to send your message. Please try again.");
        }
    };

    return (
        <div className={`font-sans transition-colors duration-500`}>
            <div className="container mx-auto max-w-7xl">
                <div
                    className={`backdrop-blur-sm rounded-xl shadow-lg p-6 sm:p-8 space-y-6 sm:space-y-8 
                        grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mt-2 sm:mt-4 transition-colors duration-500 
                        ${currentTheme.includes('dark') ? 'bg-gray-950/60 text-white' : 'bg-emerald-50/50 text-emerald-900'}`}>

                    {/* Contact Form */}
                    <div className="space-y-4 sm:space-y-6 order-1 md:order-2">
                        <h2
                            className={`text-2xl sm:text-3xl md:text-3xl font-extrabold text-center 
                ${currentTheme.includes('dark') ? 'text-emerald-300' : 'text-emerald-900'}`}
                        >
                            CONTACT US
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <input
                                    type="text"
                                    name="firstName"
                                    placeholder="First Name *"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className={`p-2 sm:p-3 w-full rounded border transition-colors duration-500 
                ${currentTheme.includes('dark')
                                            ? "bg-emerald-900/50 border-emerald-800 text-emerald-100 placeholder-emerald-200 backdrop-blur-sm"
                                            : "bg-emerald-50/50 border-emerald-200 text-emerald-900 placeholder-emerald-400 backdrop-blur-sm"}`}
                                    required
                                />
                                <input
                                    type="text"
                                    name="lastName"
                                    placeholder="Last Name *"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className={`p-2 sm:p-3 w-full rounded border transition-colors duration-500 
                ${currentTheme.includes('dark')
                                            ? "bg-emerald-900/50 border-emerald-800 text-emerald-100 placeholder-emerald-200 backdrop-blur-sm"
                                            : "bg-emerald-50/50 border-emerald-200 text-emerald-900 placeholder-emerald-400 backdrop-blur-sm"}`}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <input
                                    type="text"
                                    name="mobile"
                                    placeholder="Mobile No *"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    className={`p-2 sm:p-3 w-full rounded border transition-colors duration-500 
                ${currentTheme.includes('dark')
                                            ? "bg-emerald-900/50 border-emerald-800 text-emerald-100 placeholder-emerald-200 backdrop-blur-sm"
                                            : "bg-emerald-50/50 border-emerald-200 text-emerald-900 placeholder-emerald-400 backdrop-blur-sm"}`}
                                    required
                                />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email ID *"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`p-2 sm:p-3 w-full rounded border transition-colors duration-500 
                ${currentTheme.includes('dark')
                                            ? "bg-emerald-900/50 border-emerald-800 text-emerald-100 placeholder-emerald-200 backdrop-blur-sm"
                                            : "bg-emerald-50/50 border-emerald-200 text-emerald-900 placeholder-emerald-400 backdrop-blur-sm"}`}
                                    required
                                />
                            </div>

                            <textarea
                                name="message"
                                placeholder="Message"
                                rows={4}
                                maxLength={500}
                                value={formData.message}
                                onChange={handleChange}
                                className={`p-2 sm:p-3 w-full rounded border transition-colors duration-500 
        ${currentTheme.includes('dark')
                                        ? "bg-emerald-900/50 border-emerald-800 text-emerald-100 placeholder-emerald-200 backdrop-blur-sm"
                                        : "bg-emerald-50/50 border-emerald-200 text-emerald-900 placeholder-emerald-400 backdrop-blur-sm"} resize-y max-h-60`}
                                required
                            ></textarea>

                            <button
                                type="submit"
                                className="w-full p-3 sm:p-3 bg-emerald-700 text-white rounded hover:bg-emerald-800 transition-all"
                            >
                                Submit
                            </button>
                        </form>

                        {status && (
                            <p className={`text-center mt-2 sm:mt-4 font-bold
        ${currentTheme.includes('dark') ? 'text-emerald-300' : 'text-emerald-900'}`}>
                                {status}
                            </p>
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="space-y-6 sm:space-y-8 order-2 md:order-1">
                        <h2
                            className={`text-2xl sm:text-3xl md:text-3xl font-extrabold mb-4 sm:mb-6 
            ${currentTheme.includes("dark") ? "text-emerald-300" : "text-emerald-900"}`}
                        >
                            Get In Touch With Us Now!
                        </h2>

                        <div className="space-y-4 sm:space-y-6">
                            {/* Mission */}
                            <div className="flex items-start gap-3 sm:gap-4">
                                <div className="text-3xl p-2 rounded-full text-white">🎯</div>
                                <div>
                                    <h3 className={`font-extrabold text-lg sm:text-xl md:text-xl mb-1 sm:mb-2 ${currentTheme.includes("dark") ? "text-emerald-300" : "text-emerald-900"}`}>
                                        Our Mission
                                    </h3>
                                    <p className={`text-lg font-serif transition-colors duration-500 ${currentTheme.includes("dark") ? "text-emerald-50" : "text-emerald-800"}`}>
                                        Our <strong>M</strong>ission is to help communities protect lakes and nature by reporting pollution.
                                    </p>
                                </div>
                            </div>

                            {/* How to Get Involved */}
                            <div className="flex items-start gap-3 sm:gap-4">
                                <div className="text-3xl p-2 rounded-full text-white">🤝</div>
                                <div>
                                    <h3 className={`font-extrabold text-lg sm:text-xl md:text-xl mb-1 sm:mb-2 ${currentTheme.includes("dark") ? "text-emerald-300" : "text-emerald-900"}`}>
                                        How to Get Involved
                                    </h3>
                                    <p className={`text-lg font-serif transition-colors duration-500 ${currentTheme.includes("dark") ? "text-emerald-50" : "text-emerald-800"}`}>
                                        You can contribute by uploading pollution reports, <strong>V</strong>olunteering for cleanup events, and spreading awareness. Every action counts!
                                    </p>
                                </div>
                            </div>

                            {/* Together */}
                            <div className="flex items-start gap-3 sm:gap-4">
                                <div className="text-3xl p-2 rounded-full text-white">🌍</div>
                                <div>
                                    <h3 className={`font-extrabold text-lg sm:text-xl md:text-xl mb-1 sm:mb-2 ${currentTheme.includes("dark") ? "text-emerald-300" : "text-emerald-900"}`}>
                                        Together, We Can Make a Difference
                                    </h3>
                                    <p className={`text-lg font-serif transition-colors duration-500 ${currentTheme.includes("dark") ? "text-emerald-50" : "text-emerald-800"}`}>
                                        <strong>W</strong>e believe your reports are vital in helping local
                                        organizations and authorities respond quickly to environmental issues.
                                        Together, we can make a difference.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
