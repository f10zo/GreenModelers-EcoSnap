'use client';

import React, { useState, useEffect, useCallback } from "react";
import { db } from "../../../firebase";
import { collection, query, onSnapshot } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { FaWaze, FaGoogle } from "react-icons/fa";
import { GiWorld } from "react-icons/gi";

// GEOAPIFY API Key from your saved information
const GEOAPIFY_API_KEY = "798aff4296834f94ae8593ec7f2146b5";

const getCoords = (coordString) => {
    if (!coordString || typeof coordString !== 'string' || !coordString.includes("Lat:") || !coordString.includes("Lon:")) {
        console.error("Invalid coordinate string format:", coordString);
        return { lat: null, lon: null };
    }
    const parts = coordString.split(',');
    // Improved parsing with regex for safety
    const latMatch = parts[0].match(/Lat:\s*([-\d.]+)/);
    const lonMatch = parts[1].match(/Lon:\s*([-\d.]+)/);

    const lat = latMatch ? parseFloat(latMatch[1]) : null;
    const lon = lonMatch ? parseFloat(lonMatch[1]) : null;

    // Check if parsing resulted in valid numbers
    if (isNaN(lat) || isNaN(lon)) {
        console.error("Parsed coordinates are not numbers:", { lat, lon });
        return { lat: null, lon: null };
    }

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

    const handleNavigate = useCallback((service) => {
        if (!selectedImage || !selectedImage.coordinates) return;

        const { lat, lon } = getCoords(selectedImage.coordinates);

        if (lat === null || lon === null) {
            alert(`Coordinates are invalid or missing for this report: ${selectedImage.coordinates}`);
            return;
        }

        let url;
        switch (service) {
            case "google":
                // Correct Google Maps URL
                url = `https://maps.google.com/?q=${lat},${lon}`;
                break;
            case "waze":
                // Standard Waze URL.
                url = `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`;
                break;
            case "geoapify":
                // Correct Geoapify Interactive Map URL
                url = `https://maps.geoapify.com/v/open-street-map?center=lonlat:${lon},${lat}&zoom=15&marker=lonlat:${lon},${lat};color:%23ff0000;size:large&apiKey=${GEOAPIFY_API_KEY}`;
                break;
            default:
                return;
        }

        setShowNavOptions(false); // Close options menu
        window.open(url, "_blank"); // Open the correct URL
    }, [selectedImage]);

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
                // 1. UPDATED: Modal backdrop for blur effect
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-xl flex items-center justify-center p-4 z-50"
                    onClick={handleCloseModal}
                >
                    <div
                        className={`relative flex flex-col rounded-lg shadow-2xl max-h-[90vh] max-w-[90vw] p-6 ${currentTheme === 'dark' ? 'bg-black/90 text-white' : 'bg-white/95 text-black'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={selectedImage.imageUrl}
                            alt="Enlarged view"
                            width={800} // Increased size for better modal presentation
                            height={600} // Increased size for better modal presentation
                            className="rounded-xl max-h-[60vh] object-contain"
                        />
                        <div className="mt-6 text-center">
                            <p className="font-bold text-xl">{selectedImage.description}</p>
                            <p className={`text-sm mt-1 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>📍 {selectedImage.location}</p>
                            <p className={`text-xs mt-1 ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {selectedImage.pollution_level} | {selectedImage.date}
                            </p>
                            {selectedImage.coordinates && (
                                <div className="relative flex justify-center mt-6">
                                    {/* 2. UPDATED: Navigate Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent modal close when opening nav options
                                            setShowNavOptions(!showNavOptions);
                                        }}
                                        className={`flex items-center justify-center px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${currentTheme === "dark"
                                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                            : "bg-emerald-400 text-black hover:bg-emerald-500"
                                            }`}
                                    >
                                        Navigate to Location
                                    </button>

                                    {/* 3. UPDATED: Navigation Popover with new styling */}
                                    {showNavOptions && (
                                        <div
                                            className={`absolute top-full mt-2 left-1/2 transform -translate-x-1/2 w-52 rounded-xl shadow-2xl p-3 z-20 transition-all duration-300 flex justify-around items-center space-x-2 ${currentTheme === "dark"
                                                ? "bg-slate-700 border border-emerald-500"
                                                : "bg-white border border-emerald-300"
                                                }`}
                                            onClick={(e) => e.stopPropagation()} // Stop propagation inside the popover
                                        >

                                            {/* Google Maps Icon - Style maintained */}
                                            <button
                                                onClick={() => handleNavigate("google")}
                                                className={`p-3 rounded-full transition-colors duration-200 hover:scale-110 ${currentTheme === "dark" ? "bg-black/40 text-white hover:text-emerald-300" : "bg-gray-100 text-black hover:text-emerald-700"}`}
                                                title="Navigate with Google Maps"
                                            >
                                                <FaGoogle className="w-6 h-6" style={{ color: currentTheme === "dark" ? undefined : "#4285F4" }} />
                                            </button>

                                            {/* Waze Icon - Style maintained */}
                                            <button
                                                onClick={() => handleNavigate("waze")}
                                                className={`p-3 rounded-full transition-colors duration-200 hover:scale-110 ${currentTheme === "dark" ? "bg-black/40 text-white hover:text-emerald-300" : "bg-gray-100 text-black hover:text-emerald-700"}`}
                                                title="Navigate with Waze"
                                            >
                                                <FaWaze className="w-6 h-6 text-blue-500" />
                                            </button>

                                            {/* Geoapify Icon - New option with similar styling */}
                                            <button
                                                onClick={() => handleNavigate("geoapify")}
                                                className={`p-3 rounded-full transition-colors duration-200 hover:scale-110 ${currentTheme === "dark" ? "bg-black/40 text-white hover:text-emerald-300" : "bg-gray-100 text-black hover:text-emerald-700"}`}
                                                title="Navigate with Geoapify Map"
                                            >
                                                <GiWorld className="w-6 h-6 text-purple-500" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleCloseModal}
                            className="absolute top-4 right-4 p-2 bg-gray-600/70 text-white rounded-full hover:bg-gray-700 transition-colors z-10"
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