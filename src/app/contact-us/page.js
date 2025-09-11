'use client';

import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// Function to safely access environment variables
const getEnvVar = (name) => {
    try {
        return typeof window !== 'undefined' && typeof window[name] !== 'undefined' ? window[name] : null;
    } catch (e) {
        return null;
    }
};

const firebaseConfig = getEnvVar('__firebase_config');
const initialAuthToken = getEnvVar('__initial_auth_token');
const appId = getEnvVar('__app_id') || 'default-app-id';

let db;
let auth;

const ContactUsPage = () => {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        mobile: "",
        email: "",
        message: "",
    });
    const [status, setStatus] = useState("");
    const [currentTheme, setCurrentTheme] = useState('light');
    const [firebaseReady, setFirebaseReady] = useState(false);

    useEffect(() => {
        if (firebaseConfig) {
            try {
                const app = initializeApp(JSON.parse(firebaseConfig));
                auth = getAuth(app);
                db = getFirestore(app);

                const authenticate = async () => {
                    try {
                        if (initialAuthToken) {
                            await signInWithCustomToken(auth, initialAuthToken);
                        } else {
                            await signInAnonymously(auth);
                        }
                        setFirebaseReady(true);
                    } catch (error) {
                        console.error("Firebase authentication failed:", error);
                        setFirebaseReady(false);
                    }
                };

                authenticate();
            } catch (error) {
                console.error("Firebase initialization failed:", error);
                setFirebaseReady(false);
            }
        } else {
            console.error("Firebase config is missing.");
            setFirebaseReady(false);
        }

        // Theme observer
        const observer = new MutationObserver(() => {
            const newTheme = document.documentElement.className;
            setCurrentTheme(newTheme);
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("");

        if (!firebaseReady) {
            setStatus("Firebase is not ready. Please try again in a moment.");
            return;
        }

        try {
            const collectionPath = `/artifacts/${appId}/public/data/contactRequests`;
            await addDoc(collection(db, collectionPath), {
                ...formData,
                timestamp: new Date(),
            });

            setStatus("Your message has been sent successfully!");
            setFormData({
                firstName: "",
                lastName: "",
                mobile: "",
                email: "",
                message: "",
            });
        } catch (error) {
            console.error("Error submitting request: ", error);
            setStatus("Failed to send your message. Please try again.");
        }
    };

    return (
        <div className={`min-h-screen p-4 sm:p-8 font-sans transition-colors duration-500`}>
            <div className="container mx-auto max-w-7xl">
                {/* Main Card */}
                <div className={`backdrop-blur-sm rounded-xl shadow-lg p-6 sm:p-8 space-y-6 sm:space-y-8 transition-colors duration-500 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mt-16 sm:mt-24 ${currentTheme.includes('dark') ? 'bg-gray-800/60 text-white' : 'bg-white/30 text-black'}`}>

                    {/* Contact Form - shown first on small screens */}
                    <div className="space-y-4 sm:space-y-6 order-1 md:order-2">
                        <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold text-center ${currentTheme.includes('dark') ? 'text-white' : 'text-black'}`}>CONTACT US</h2>
                        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <input type="text" name="firstName" placeholder="First Name *" value={formData.firstName} onChange={handleChange} className={`p-2 sm:p-3 w-full rounded border transition-colors duration-500 ${currentTheme.includes('dark') ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 backdrop-blur-sm" : "bg-white/50 border-gray-200 text-black placeholder-black backdrop-blur-sm"}`} required />
                                <input type="text" name="lastName" placeholder="Last Name *" value={formData.lastName} onChange={handleChange} className={`p-2 sm:p-3 w-full rounded border transition-colors duration-500 ${currentTheme.includes('dark') ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 backdrop-blur-sm" : "bg-white/50 border-gray-200 text-black placeholder-black backdrop-blur-sm"}`} required />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <input type="text" name="mobile" placeholder="Mobile No *" value={formData.mobile} onChange={handleChange} className={`p-2 sm:p-3 w-full rounded border transition-colors duration-500 ${currentTheme.includes('dark') ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 backdrop-blur-sm" : "bg-white/50 border-gray-200 text-black placeholder-black backdrop-blur-sm"}`} required />
                                <input type="email" name="email" placeholder="Email ID *" value={formData.email} onChange={handleChange} className={`p-2 sm:p-3 w-full rounded border transition-colors duration-500 ${currentTheme.includes('dark') ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 backdrop-blur-sm" : "bg-white/50 border-gray-200 text-black placeholder-black backdrop-blur-sm"}`} required />
                            </div>

                            <textarea name="message" placeholder="Message" rows="4" value={formData.message} onChange={handleChange} className={`p-2 sm:p-3 w-full rounded border transition-colors duration-500 ${currentTheme.includes('dark') ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 backdrop-blur-sm" : "bg-white/50 border-gray-200 text-black placeholder-black backdrop-blur-sm"}`} required></textarea>

                            <button type="submit" className="w-full p-3 sm:p-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all">
                                Submit <i className="fas fa-paper-plane"></i>
                            </button>
                        </form>
                        {status && <p className={`text-center mt-2 sm:mt-4 text-blue-600 ${currentTheme.includes('dark') ? 'dark:text-blue-400' : ''}`}>{status}</p>}
                    </div>

                    {/* Get In Touch / Mission Info - below on small screens */}
                    <div className="space-y-6 sm:space-y-8 order-2 md:order-1">
                        <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 ${currentTheme.includes('dark') ? 'text-white' : 'text-black'}`}>
                            Get In Touch With Us Now!
                        </h2>

                        <div className="space-y-4 sm:space-y-6">
                            {/* Mission */}
                            <div className="flex items-start gap-3 sm:gap-4">
                                <img
                                    src="https://placehold.co/24x24/111827/ffffff?text=M"
                                    alt="Mission Icon"
                                    width={24}
                                    height={24}
                                    className="rounded-full p-1 bg-blue-100 dark:bg-blue-900"
                                />
                                <div>
                                    <h3 className={`font-bold text-lg sm:text-xl md:text-2xl mb-1 sm:mb-2 ${currentTheme.includes("dark") ? "text-white" : "text-black"}`}>
                                        Our Mission
                                    </h3>
                                    <p className={`text-sm sm:text-base md:text-lg ${currentTheme.includes("dark") ? "text-white" : "text-black"}`}>
                                        Our <strong>M</strong>ission is to empower communities to protect our
                                        lakes and natural habitats by providing a simple way to report pollution
                                        and share information.
                                    </p>
                                </div>
                            </div>

                            {/* How to Get Involved */}
                            <div className="flex items-start gap-3 sm:gap-4">
                                <img
                                    src="https://placehold.co/24x24/111827/ffffff?text=V"
                                    alt="Volunteering Icon"
                                    width={24}
                                    height={24}
                                    className="rounded-full p-1 bg-blue-100 dark:bg-blue-900"
                                />
                                <div>
                                    <h3 className={`font-bold text-lg sm:text-xl md:text-2xl mb-1 sm:mb-2 ${currentTheme.includes("dark") ? "text-white" : "text-black"}`}>
                                        How to Get Involved
                                    </h3>
                                    <p className={`text-sm sm:text-base md:text-lg ${currentTheme.includes("dark") ? "text-white" : "text-black"}`}>
                                        You can contribute by uploading pollution reports, <strong>V</strong>olunteering
                                        for cleanup events, and spreading awareness. Every action counts!
                                    </p>
                                </div>
                            </div>

                            {/* Together */}
                            <div className="flex items-start gap-3 sm:gap-4">
                                <img
                                    src="https://placehold.co/24x24/111827/ffffff?text=W"
                                    alt="Teamwork Icon"
                                    width={24}
                                    height={24}
                                    className="rounded-full p-1 bg-blue-100 dark:bg-blue-900"
                                />
                                <div>
                                    <h3 className={`font-bold text-lg sm:text-xl md:text-2xl mb-1 sm:mb-2 ${currentTheme.includes("dark") ? "text-white" : "text-black"}`}>
                                        Together, We Can Make a Difference
                                    </h3>
                                    <p className={`text-sm sm:text-base md:text-lg ${currentTheme.includes("dark") ? "text-white" : "text-black"}`}>
                                        <strong>W</strong>e believe your reports are vital in helping local
                                        organizations and authorities respond quickly to environmental issues.
                                        Together, we can make a difference.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Image */}
                <div className="w-full flex justify-center items-end mt-6 sm:mt-10">
                    <img src="/lakeMaps.jpg" alt="Lake Map" className="rounded-lg p-4 sm:p-6 w-full max-w-xs h-auto" />
                </div>
            </div>
        </div>
    );
};

export default ContactUsPage;
