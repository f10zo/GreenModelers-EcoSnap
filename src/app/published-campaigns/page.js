'use client';

import React, { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { db } from '../../firebase';
import { collection, getDocs, query, orderBy } from "firebase/firestore";

const DynamicMap = dynamic(() => import('./DynamicMap'), { ssr: false });

export default function PublishedCampaignsPage() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);

    const [mounted, setMounted] = useState(false);
    const [currentTheme, setCurrentTheme] = useState('light');

    // Fetch campaigns
    useEffect(() => {
        const fetchCampaigns = async () => {
            setLoading(true);
            try {
                const q = query(collection(db, "campaigns"), orderBy("createdAt", "desc"));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => {
                    const campaignData = doc.data();
                    return {
                        id: doc.id,
                        ...campaignData,
                        volunteersNeeded: parseInt(campaignData.volunteersNeeded) || 0
                    };
                });
                setCampaigns(data);
            } catch (err) {
                console.error("Error fetching campaigns:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCampaigns();
    }, []);

    // Detect theme on client
    useEffect(() => {
        setMounted(true); // ✅ marks that client-side rendering is ready
        const observer = new MutationObserver(() => {
            setCurrentTheme(document.documentElement.className);
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        setCurrentTheme(document.documentElement.className);
        return () => observer.disconnect();
    }, []);

    if (!mounted) return null; // Prevent SSR mismatch

    const isDarkMode = currentTheme.includes('dark');

    return (
        <div className="max-w-6xl mx-auto px-6 py-3">
            <div className={`max-w-lg mx-auto backdrop-blur-md p-4 rounded-3xl shadow-xl transition-colors duration-500 ${isDarkMode ? 'bg-slate-800/80' : 'bg-white/30'} my-4 text-center`}>
                <h1 className={`text-3xl font-bold mb-2 mt-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    📢 Published Campaigns
                </h1>
            </div>

            {loading && <p className="text-center mt-6 text-gray-500">Loading campaigns...</p>}

            {!loading && campaigns.length === 0 && (
                <p className="text-center mt-6 text-gray-500">No campaigns published yet.</p>
            )}

            {!loading && campaigns.length > 0 && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {campaigns.map((c) => (
                            <div
                                key={c.id}
                                className="rounded-2xl p-4 shadow-md transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                                style={{
                                    backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.3)'
                                }}
                            >
                                <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                    {c.campaignName}
                                </h3>
                                <div className="flex flex-col space-y-1 mb-2 text-sm">
                                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                                        <span className={`font-bold mr-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>👤 Organizer:</span> {c.organizer}
                                    </p>
                                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                                        <span className={`font-bold mr-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>📅 Date & Time:</span> {c.date} at {c.time}
                                    </p>
                                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                                        <span className={`font-bold mr-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>📍 Location:</span> {c.location}
                                    </p>
                                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                                        <span className={`font-bold mr-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🧑‍🤝‍🧑 Volunteers:</span> {c.volunteersNeeded} needed
                                    </p>
                                    {c.materials && (
                                        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                                            <span className={`font-bold mr-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🛠️ Materials:</span> {c.materials}
                                        </p>
                                    )}
                                </div>
                                <hr className="my-1 border-gray-300 dark:border-gray-700" />
                                <p className={`text-xs italic ${isDarkMode ? 'text-gray-400' : 'text-gray-800'}`}>{c.description}</p>

                            </div>
                        ))}
                    </div>

                    <div className="max-w-lg mx-auto mt-8 space-y-3">
                        {/* Background for the title */}
                        <div className={`backdrop-blur-md p-4 rounded-3xl shadow-xl transition-colors duration-500 text-center ${isDarkMode ? 'bg-slate-800/80' : 'bg-white/30'}`}>
                            <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                🗺️ Campaign Map
                            </h2>
                        </div>

                        {/* Background for the paragraph */}
                        <div className={`backdrop-blur-md p-4 rounded-3xl shadow-xl transition-colors duration-500 text-center ${isDarkMode ? 'bg-slate-800/80' : 'bg-white/30'}`}>
                            <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                Click on a pin on the map to view the campaign&apos;s details.
                            </p>
                        </div>
                    </div>

                    <div className="w-full h-[70vh] rounded-2xl overflow-hidden shadow-xl mt-6">
                        <DynamicMap campaigns={campaigns} />
                    </div>
                </>
            )}
        </div>
    );
}
