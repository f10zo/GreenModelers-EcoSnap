'use client';

import React, { useState, useEffect } from "react";
import { db } from "../../../firebase";
import { collection, query, onSnapshot } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";

const getCoords = (coordString) => {
    if (!coordString || !coordString.includes("Lat:") || !coordString.includes("Lon:")) {
        console.error("Invalid coordinate string format:", coordString);
        return { lat: null, lon: null };
    }
    const parts = coordString.split(',');
    const lat = parseFloat(parts[0].split(':')[1].trim());
    const lon = parseFloat(parts[1].split(':')[1].trim());
    return { lat, lon };
};

export default function Gallery({ onUploadSuccess }) {
    const [gallery, setGallery] = useState([]);
    const [filterPollution, setFilterPollution] = useState("All");
    const [dateSort, setDateSort] = useState("newest");
    const [selectedImage, setSelectedImage] = useState(null);
    const [showNavOptions, setShowNavOptions] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentTheme, setCurrentTheme] = useState('light');

    useEffect(() => {
        const observer = new MutationObserver(() => {
            const newTheme = document.documentElement.className;
            setCurrentTheme(newTheme);
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        // This is the real-time listener that automatically updates the gallery.
        const q = query(collection(db, "reports"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setGallery(items);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching gallery:", error);
            setLoading(false);
        });

        // Clean up the listener when the component unmounts
        return () => unsubscribe();
    }, []);

    const handleImageClick = (item) => {
        setSelectedImage(item);
    };

    const handleCloseModal = () => {
        setSelectedImage(null);
        setShowNavOptions(false);
    };

    const filteredGallery = gallery
        .filter((item) =>
            filterPollution === "All" ? true : item.pollution_level === filterPollution
        )
        .sort((a, b) => {
            const dateA = new Date(a.date.replace(' ', 'T'));
            const dateB = new Date(b.date.replace(' ', 'T'));
            if (dateSort === "newest") return dateB - dateA;
            else return dateA - dateB;
        });

    return (
        <div className={`w-full rounded-3xl shadow 2xl p-6 md:col-span-1 lg:col-span-2 ${currentTheme === 'dark' ? 'bg-slate-800/80 text-white' : 'bg-white/30 text-black'}`} style={{ backdropFilter: 'blur(1px)' }}>
            <h3 className={`text-3xl font-extrabold mb-4 text-left flex items-center gap-2 transition-colors duration-500 ${currentTheme === 'dark' ? 'text-white-300' : 'text-white-700'}`}>
                📸 Gallery
            </h3>
            <div className="mb-4">
                <Link href="/map">
                    <button className="py-2 px-4 rounded-lg bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-colors duration-200 w-full">
                        View Reports on Map 🗺️
                    </button>
                </Link>
            </div>
            <div className="flex gap-4 mb-6">
                <select
                    className={`flex-1 border rounded-lg p-2 font-semibold ${currentTheme === 'dark' ? 'bg-black/30 text-white' : 'bg-white/70 text-black'}`}
                    value={filterPollution}
                    onChange={(e) => setFilterPollution(e.target.value)}
                >
                    <option>All</option>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                </select>
                <select
                    className={`flex-1 border rounded-lg p-2 font-semibold ${currentTheme === 'dark' ? 'bg-black/30 text-white' : 'bg-white/70 text-black'}`}
                    value={dateSort}
                    onChange={(e) => setDateSort(e.target.value)}
                >
                    <option value="newest">Newest → Oldest</option>
                    <option value="oldest">Oldest → Newest</option>
                </select>
            </div>
            {loading ? (
                <div className="flex justify-center items-center h-full">
                    <p className={`${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-lg`}>Loading...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[70vh] pr-2">
                    {filteredGallery.map((item, i) => (
                        <div key={i} className={`shadow-lg rounded-xl overflow-hidden transform transition-transform duration-300 hover:scale-105 ${currentTheme === 'dark' ? 'bg-black/50 text-white' : 'bg-white/50 text-black'}`}>
                            <Image
                                src={item.imageUrl}
                                alt=""
                                width={600}
                                height={400}
                                className="w-full h-48 object-cover cursor-pointer"
                                onClick={() => handleImageClick(item)}
                            />
                            <div className="p-3">
                                <p className="text-sm font-semibold">{item.description}</p>
                                <p className={`text-xs mt-1 ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    📍 {item.location}
                                </p>
                                <div className={`flex items-center text-xs mt-1 ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    <span className={`w-3 h-3 rounded-full mr-2 ${item.pollution_level === 'Low' ? 'bg-green-500' : item.pollution_level === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                                    {item.pollution_level} | {item.date}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {selectedImage && (
                <div
                    className={`fixed inset-0 bg-black backdrop-blur-sm flex items-center justify-center p-4 z-50 ${currentTheme === 'dark' ? 'bg-opacity-90' : 'bg-opacity-75'}`}
                    onClick={handleCloseModal}
                >
                    <div
                        className={`relative flex flex-col rounded-lg shadow-lg max-h-[90vh] max-w-[90vw] p-4 ${currentTheme === 'dark' ? 'bg-black/80 text-white' : 'bg-white/95 text-black'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={selectedImage.imageUrl}
                            alt="Enlarged view"
                            width={600}
                            height={400}
                            className="rounded-lg max-h-[60vh] object-contain"
                        />
                        <div className="mt-4 text-center">
                            <p className="font-bold text-lg">{selectedImage.description}</p>
                            <p className={`text-sm mt-1 ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>📍 {selectedImage.location}</p>
                            <p className={`text-xs mt-1 ${currentTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                                {selectedImage.pollution_level} | {selectedImage.date}
                            </p>
                            {selectedImage.coordinates && (
                                <div className="relative flex justify-center mt-4">
                                    <button
                                        onClick={() => setShowNavOptions(!showNavOptions)}
                                        className="py-2 px-6 rounded-lg bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-colors"
                                    >
                                        Navigate
                                    </button>
                                    {showNavOptions && (
                                        <div className={`absolute bottom-full mb-2 w-48 rounded-lg shadow-lg overflow-hidden ${currentTheme === 'dark' ? 'bg-black/90' : 'bg-white'}`}>
                                            <a
                                                href={`https://waze.com/ul?ll=${getCoords(selectedImage.coordinates).lat},${getCoords(selectedImage.coordinates).lon}&navigate=yes`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={handleCloseModal}
                                                className={`flex items-center gap-2 p-3 w-full text-left transition-colors ${currentTheme === 'dark' ? 'text-white hover:bg-gray-800' : 'text-gray-800 hover:bg-gray-100'}`}
                                            >
                                                <Image src="https://www.waze.com/favicon.ico" alt="Waze logo" width={10} height={10} className="w-5 h-5" /> Waze
                                            </a>
                                            <a
                                                href={`https://www.google.com/maps/dir/?api=1&destination=${getCoords(selectedImage.coordinates).lat},${getCoords(selectedImage.coordinates).lon}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={handleCloseModal}
                                                className={`flex items-center gap-2 p-3 w-full text-left transition-colors ${currentTheme === 'dark' ? 'text-white hover:bg-gray-800' : 'text-gray-800 hover:bg-gray-100'}`}
                                            >
                                                <Image src="https://www.google.com/images/branding/product/2x/maps_96dp.png" alt="Google Maps logo" width={32} height={32} className="w-8 h-8" /> Google Maps
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleCloseModal}
                            className="absolute top-2 right-2 p-1 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors z-10"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
