'use client';

import React, { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { db } from '../../firebase';
import { collection, getDocs, query, orderBy } from "firebase/firestore";

const DynamicMap = dynamic(() => import('./DynamicMap'), {
    ssr: false,
});

export default function PublishedCampaignsPage() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const [currentTheme, setCurrentTheme] = useState('light');
    const [status, setStatus] = useState("");
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
        <div className="max-w-6xl mx-auto p-4">
            <div className={`max-w-lg mx-auto backdrop-blur-md p-6 rounded-3xl shadow-xl transition-colors duration-500 ${isDarkMode ? 'bg-slate-800/80' : 'bg-white/30'} my-4 text-center`}>
                <h1 className={`text-3xl font-bold mb-4 mt-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    📢 Published Campaigns
                </h1>
            </div>


            {loading && (
                <p className="text-center mt-6 text-gray-500">Loading campaigns...</p>
            )}

            {!loading && campaigns.length === 0 && (
                <p className="text-center mt-6 text-gray-500">
                    No campaigns published yet.
                </p>
            )}

            {!loading && campaigns.length > 0 && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {campaigns.map((c) => (
                            <div
                                key={c.id}
                                className="rounded-2xl p-6 shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
                                style={{
                                    backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.3)'
                                }}
                            >
                                <h3 className={`text-2xl font-extrabold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {c.campaignName}
                                </h3>
                                <div className="flex flex-col space-y-1 mb-4">
                                    <p className={`flex items-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                                        <span className={`font-bold mr-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>👤 Organizer:</span> {c.organizer}
                                    </p>
                                    <p className={`flex items-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                                        <span className={`font-bold mr-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>📅 Date & Time:</span> {c.date} at {c.time}
                                    </p>
                                    <p className={`flex items-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                                        <span className={`font-bold mr-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>📍 Location:</span> {c.location}
                                    </p>
                                    <p className={`flex items-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                                        <span className={`font-bold mr-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>🧑‍🤝‍🧑 Volunteers:</span> {c.volunteersNeeded} needed
                                    </p>
                                    {c.materials && (
                                        <p className={`flex items-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                                            <span className={`font-bold mr-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>🛠️ Materials:</span> {c.materials}
                                        </p>
                                    )}
                                </div>
                                <hr className="my-2 border-gray-300 dark:border-gray-700" />
                                <p className={`text-sm italic ${isDarkMode ? 'text-gray-400' : 'text-gray-800'}`}>{c.description}</p>
                            </div>
                        ))}
                    </div>


                    <div className="max-w-lg mx-auto mt-8 space-y-3">
                        {/* Background for the title */}
                        <div className={`backdrop-blur-md p-4 rounded-3xl shadow-xl transition-colors duration-500 text-center ${isDarkMode ? 'bg-slate-800/80' : 'bg-white/30'}`}>
                            <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
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