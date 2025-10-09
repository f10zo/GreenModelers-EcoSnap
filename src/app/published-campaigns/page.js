"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { db } from "../../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

const DynamicMap = dynamic(() => import("./DynamicMap"), { ssr: false });

export default function PublishedCampaignsPage() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [currentTheme, setCurrentTheme] = useState("light");
    const [navbarHeight, setNavbarHeight] = useState(0);

    // Fetch campaigns
    useEffect(() => {
        const fetchCampaigns = async () => {
            setLoading(true);
            try {
                const q = query(collection(db, "campaigns"), orderBy("createdAt", "desc"));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map((doc) => {
                    const campaignData = doc.data();
                    return {
                        id: doc.id,
                        ...campaignData,
                        volunteersNeeded: parseInt(campaignData.volunteersNeeded) || 0,
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

    // Detect theme and calculate navbar height
    useEffect(() => {
        setMounted(true);

        const observer = new MutationObserver(() => {
            setCurrentTheme(document.documentElement.className);
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

        setCurrentTheme(document.documentElement.className);

        const updateNavbarHeight = () => {
            const navbar = document.querySelector("header");
            if (navbar) setNavbarHeight(navbar.offsetHeight);
        };
        updateNavbarHeight();
        window.addEventListener("resize", updateNavbarHeight);

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", updateNavbarHeight);
        };
    }, []);

    if (!mounted) return null;

    const isDarkMode = currentTheme.includes("dark");

    return (
        <main
            style={{ paddingTop: `${navbarHeight + 24}px` }} // 24px extra spacing to prevent overlap
            className="max-w-6xl mx-auto px-6 py-3 transition-colors duration-500"
        >
            {/* Published Campaigns Header */}
            <div className="max-w-lg mx-auto space-y-3">
                <div
                    className={`backdrop-blur-md p-4 rounded-3xl shadow-xl transition-colors duration-500 text-center ${isDarkMode ? "bg-slate-800/80" : "bg-white/30"
                        }`}
                >
                    <h1 className={`text-3xl font-bold ${isDarkMode ? "text-emerald-600" : "text-emerald-800"}`}>
                        📢 Published Campaigns
                    </h1>
                </div>
            </div>

            {/* Loading / Empty States */}
            {loading && <p className="text-center mt-6 text-gray-500">Loading campaigns...</p>}
            {!loading && campaigns.length === 0 && <p className="text-center mt-6 text-gray-500">No campaigns published yet.</p>}

            {/* Campaign Cards */}
            {!loading && campaigns.length > 0 && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                        {campaigns.map((c) => (
                            <div
                                key={c.id}
                                className={`rounded-2xl p-4 shadow-md transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${isDarkMode ? "bg-slate-900 text-emerald-400" : "bg-emerald-100/60 text-emerald-800"
                                    }`}
                            >
                                {c.imageUrl && (
                                    <div className="mb-3 w-full h-40 relative overflow-hidden rounded-xl shadow-lg">
                                        <Image
                                            src={c.imageUrl}
                                            alt={`Photo of ${c.campaignName} campaign location`}
                                            layout="fill"
                                            objectFit="cover"
                                            className="transition-transform duration-500 hover:scale-110"
                                        />
                                    </div>
                                )}
                                <h3 className="text-xl font-bold mb-2">{c.campaignName}</h3>
                                <div className="flex flex-col space-y-1 mb-2 text-sm">
                                    <p>
                                        <span className="font-bold mr-1">👤 Organizer:</span> {c.organizer}
                                    </p>
                                    <p>
                                        <span className="font-bold mr-1">📅 Date & Time:</span> {c.date} at {c.time}
                                    </p>
                                    <p>
                                        <span className="font-bold mr-1">📍 Location:</span> {c.location}
                                    </p>
                                    <p>
                                        <span className="font-bold mr-1">🧑‍🤝‍🧑 Volunteers:</span> {c.volunteersNeeded} needed
                                    </p>
                                    {c.materials && (
                                        <p>
                                            <span className="font-bold mr-1">🛠️ Materials:</span> {c.materials}
                                        </p>
                                    )}
                                </div>
                                <hr className="my-1 border-gray-300 dark:border-gray-700" />
                                <p className={`text-xs italic ${isDarkMode ? "text-gray-400" : "text-gray-800"}`}>{c.description}</p>
                            </div>
                        ))}
                    </div>

                    {/* Map Section */}
                    <div className="max-w-lg mx-auto mt-8 space-y-3">
                        <div
                            className={`backdrop-blur-md p-4 rounded-3xl shadow-xl transition-colors duration-500 text-center ${isDarkMode ? "bg-slate-800/80" : "bg-white/30"
                                }`}
                        >
                            <h2 className={`text-3xl font-bold ${isDarkMode ? "text-emerald-500" : "text-emerald-800"}`}>
                                🗺️ Campaign Map
                            </h2>
                        </div>
                        <div
                            className={`backdrop-blur-md p-4 rounded-3xl shadow-xl transition-colors duration-500 text-center ${isDarkMode ? "bg-slate-800/80" : "bg-white/30"
                                }`}
                        >
                            <p className={`text-sm font-semibold ${isDarkMode ? "text-emerald-500" : "text-emerald-800"}`}>
                                Click on a pin on the map to view the campaign&apos;s details.
                            </p>
                        </div>
                    </div>

                    <div className="w-full h-[70vh] rounded-2xl overflow-hidden shadow-xl mt-6">
                        <DynamicMap campaigns={campaigns} />
                    </div>
                </>
            )}
        </main>
    );
}
