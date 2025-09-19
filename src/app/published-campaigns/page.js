'use client';

import React, { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { db } from '../../firebase';
import { collection, getDocs, query, orderBy } from "firebase/firestore";

const DynamicMap = dynamic(() => import('./DynamicMap'), { ssr: false });

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

    return (
        <div className="max-w-6xl mx-auto p-4">
            <h1 className="text-4xl font-bold text-center my-6 text-gray-900 dark:text-white">Published Campaigns</h1>

            {loading && <p className="text-center mt-6 text-gray-500">Loading campaigns...</p>}

            {!loading && campaigns.length === 0 && (
                <p className="text-center mt-6 text-gray-500">No campaigns published yet.</p>
            )}

            {!loading && campaigns.length > 0 && (
                <>
                    {/* The list of campaign cards will now be placed first */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {campaigns.map(c => (
                            <div key={c.id} className="bg-white/30 dark:bg-slate-800/80 rounded-2xl p-6 shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
                                <h3 className="text-2xl font-extrabold mb-3 text-gray-900 dark:text-white">{c.campaignName}</h3>
                                <div className="flex flex-col space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                                    <p className="flex items-center text-sm">
                                        <span className="font-bold mr-2 text-gray-900 dark:text-white">👤 Organizer:</span> {c.organizer}
                                    </p>
                                    <p className="flex items-center text-sm">
                                        <span className="font-bold mr-2 text-gray-900 dark:text-white">📅 Date & Time:</span> {c.date} at {c.time}
                                    </p>
                                    <p className="flex items-center text-sm">
                                        <span className="font-bold mr-2 text-gray-900 dark:text-white">📍 Location:</span> {c.location}
                                    </p>
                                    <p className="flex items-center text-sm">
                                        <span className="font-bold mr-2 text-gray-900 dark:text-white">🧑‍🤝‍🧑 Volunteers:</span> {c.volunteersNeeded} needed
                                    </p>
                                    {c.materials && (
                                        <p className="flex items-center text-sm">
                                            <span className="font-bold mr-2 text-gray-900 dark:text-white">🛠️ Materials:</span> {c.materials}
                                        </p>
                                    )}
                                </div>
                                <hr className="my-4 border-gray-300 dark:border-gray-700" />
                                <p className="text-gray-600 dark:text-gray-400 text-sm italic">{c.description}</p>
                            </div>
                        ))}
                    </div>

                    {/* The map will now be placed below the campaigns list */}
                    <h2 className="text-3xl font-bold text-center my-6 text-gray-900 dark:text-white">Campaign Map</h2>
                    <div className="w-full h-[70vh] rounded-2xl overflow-hidden shadow-xl mt-6">
                        <DynamicMap campaigns={campaigns} />
                    </div>
                </>
            )}
        </div>
    );
}