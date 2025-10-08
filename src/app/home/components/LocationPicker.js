// src/app/home/components/LocationPicker.js
"use client";

import React, { useState, useEffect, Suspense } from "react";
import dynamic from 'next/dynamic';
import { galileeBeaches } from "@/lib/utils/constants/beaches";
import { geocodeAddress } from "@/lib/utils/helpers";
import { FiMapPin, FiSearch, FiTarget, FiXCircle } from "react-icons/fi"; // FiXCircle is imported


// Dynamically import the map component
const PickedLocationMap = dynamic(() => import('./PickedLocationMap'), {
    ssr: false,
    loading: () => <p className="text-center p-4">Loading Map...</p>
});


export default function LocationPicker({
    manualLocation,
    setManualLocation,
    location,
    setLocation,
    coordinates,
    setCoordinates,
    lat,
    setLat,
    lon,
    setLon,
    isMapVisible,
    setIsMapVisible,
    currentTheme,
    photoGpsLat,  // Add these new props
    photoGpsLon,  // Add these new props
}) {
    const [searchStatusMessage, setSearchStatusMessage] = useState("");
    const [apiErrorMessage, setApiErrorMessage] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [autoLocationTriggered, setAutoLocationTriggered] = useState(false);
    const [filteredBeaches, setFilteredBeaches] = useState([]);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const [isDropdownSelected, setIsDropdownSelected] = useState(false);


    // --- Location Dropdown Logic ---
    const handleInputChange = (e) => {
        const value = e.target.value;
        setManualLocation(value);
        setLocation(""); // Clear beach selection when typing manually
        setIsDropdownSelected(false); // Allow manual typing again

        if (value.length === 0) {
            setFilteredBeaches([]);
            setIsDropdownVisible(false);
            setLat(null);
            setLon(null);
            return;
        }

        const filtered = galileeBeaches.filter(
            (b) =>
                b.name.includes(value) ||
                b.english.toLowerCase().includes(value.toLowerCase())
        );

        setFilteredBeaches(filtered);
        setIsDropdownVisible(filtered.length > 0);
    };

    const selectBeach = (beach) => {
        setLocation(beach.id);
        setManualLocation(beach.name);
        setLat(beach.lat);
        setLon(beach.lon);
        setCoordinates(`Lat: ${beach.lat.toFixed(5)}, Lon: ${beach.lon.toFixed(5)}`);
        setIsDropdownVisible(false);
        setIsDropdownSelected(true);
        setSearchStatusMessage(`Location set to ${beach.name}.`);
        setIsMapVisible(true);
    };

    // --- Geocoding Logic (Manual Search) ---
    const handleSearchLocation = async () => {
        if (!manualLocation) {
            setApiErrorMessage("Please enter a location to search.");
            setSearchStatusMessage("");
            return;
        }
        setApiErrorMessage("");
        setSearchStatusMessage("Searching for location...");
        setIsSearching(true);
        try {
            const response = await fetch(
                // Added country filter 'il' (Israel) for better results
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualLocation)}&format=json&limit=1&countrycodes=il`,
                {
                    headers: { "User-Agent": "EcoSnap" }, // required by Nominatim
                }
            );

            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon, display_name } = data[0];
                const newLat = parseFloat(lat);
                const newLon = parseFloat(lon);

                setLat(newLat);
                setLon(newLon);
                setCoordinates(`Lat: ${newLat.toFixed(5)}, Lon: ${newLon.toFixed(5)}`);
                setLocation(""); // Clear dropdown selection
                setManualLocation(display_name);
                setIsDropdownSelected(false);
                setSearchStatusMessage("Location found! Showing on the map.");
                setIsMapVisible(true);
            } else {
                setSearchStatusMessage("Location not found. Please try a different query.");
                setCoordinates("");
                setIsMapVisible(false);
            }
        } catch (error) {
            setSearchStatusMessage("Failed to search for location. Check your network connection.");
            setApiErrorMessage(`Search Error: ${error.message}`);
            setCoordinates("");
            setIsMapVisible(false);
        } finally {
            setIsSearching(false);
        }
    };

    // --- Geolocation Logic (Auto Location) ---
    const handleAutoLocation = () => {
        if (autoLocationTriggered) return; // prevent double
        setAutoLocationTriggered(true);

        setApiErrorMessage("");
        setSearchStatusMessage("Getting your current location...");
        setLocation("");
        setIsDropdownSelected(false);

        if (!navigator.geolocation) {
            setSearchStatusMessage("Geolocation is not supported by your browser");
            setCoordinates("");
            setLat(null);
            setLon(null);
            setManualLocation("");
            setIsMapVisible(false);
            setAutoLocationTriggered(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setLat(latitude);
                setLon(longitude);
                setCoordinates(`Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`);
                setIsMapVisible(true);

                try {
                    // Using the remembered GEOAPIFY_API_KEY for reverse geocoding
                    const result = await geocodeAddress(latitude, longitude, '798aff4296834f94ae8593ec7f2146b5');

                    if (result) {
                        const { road, city, postcode, country } = result;
                        const locationName = [road, city, postcode, country].filter(Boolean).join(", ") || result.display_name || "";
                        setManualLocation(locationName);
                        setSearchStatusMessage(locationName ? `Location found: ${locationName}` : "Location found (name not resolved)");
                    } else {
                        setManualLocation("");
                        setSearchStatusMessage("Location name not found, coordinates set.");
                    }
                } catch (err) {
                    console.error("Reverse geocoding error:", err);
                    setSearchStatusMessage("Error getting location name.");
                } finally {
                    setAutoLocationTriggered(false);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                setSearchStatusMessage("Could not get your location. Please ensure location services are enabled.");
                setCoordinates("");
                setLat(null);
                setLon(null);
                setManualLocation("");
                setIsMapVisible(false);
                setAutoLocationTriggered(false);
            }
        );
    };

    const showOnMap = () => {
        if (lat != null && lon != null) {
            setIsMapVisible(true);
            setSearchStatusMessage("Showing location on map!");
        } else {
            setSearchStatusMessage("Please find or select a location with valid coordinates before showing on the map.");
        }
    };

    // --- Clear Location Logic ---
    const handleClearLocation = () => {
        setLat(null);
        setLon(null);
        setLocation("");
        setManualLocation(""); // Clears the input field
        setCoordinates("");
        setIsMapVisible(false);
        setIsDropdownSelected(false);
        setSearchStatusMessage("Location cleared. Please choose a new one.");
        setApiErrorMessage("");
    };

    // Add effect to handle GPS from photos
    useEffect(() => {
        if (photoGpsLat && photoGpsLon) {
            setLat(photoGpsLat);
            setLon(photoGpsLon);
            setIsMapVisible(true);
            setSearchStatusMessage("📍 Location detected from photo metadata");
            
            // Try to get location name
            geocodeAddress(photoGpsLat, photoGpsLon, '798aff4296834f94ae8593ec7f2146b5')
                .then(result => {
                    if (result) {
                        const locationName = [
                            result.road,
                            result.city,
                            result.country
                        ].filter(Boolean).join(", ");
                        setManualLocation(locationName);
                    }
                })
                .catch(console.error);
        }
    }, [photoGpsLat, photoGpsLon]);


    return (
        <div className="space-y-4">
            {/* Location Input and Dropdown */}
            <div className="relative">
                <label className="block text-sm font-medium mb-1">
                    Location (Beach, Area, or Search) *
                </label>
                <div className="flex">
                    <input
                        type="text"
                        value={manualLocation}
                        onChange={handleInputChange}
                        placeholder="e.g., Amnion Bay or Tiberias"
                        className={`flex-1 p-3 border ${!manualLocation ? 'rounded-l-lg' : ''} focus:ring-emerald-500 focus:border-emerald-500 block w-full
                            ${currentTheme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                        disabled={isDropdownSelected}
                    />

                    {/* NEW CLEAR BUTTON - Next to the input field */}
                    {manualLocation && (
                        <button
                            onClick={handleClearLocation}
                            type="button" // Important to prevent form submission
                            className={`p-3 text-white transition-colors duration-200 bg-red-500 hover:bg-red-600 ${currentTheme === 'dark' ? 'bg-gray-700/80 hover:bg-gray-700 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'}`}
                            title="Clear Location"
                        >
                            <FiXCircle className="inline-block" />
                        </button>
                    )}

                    <button
                        onClick={handleSearchLocation}
                        disabled={isSearching}
                        // Apply rounded-r-lg only to the last button in the group
                        className={`p-3 rounded-r-lg text-white transition-colors duration-200 ${isSearching ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}`}
                    >
                        <FiSearch className="inline-block" />
                    </button>
                </div>

                {isDropdownVisible && (
                    <ul className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto ${currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        {filteredBeaches.map((beach) => (
                            <li
                                key={beach.id}
                                onClick={() => selectBeach(beach)}
                                className={`p-3 cursor-pointer ${currentTheme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors duration-150`}
                            >
                                {beach.name} ({beach.english})
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Location Buttons - Reverted to two-column grid */}
            <div className="grid grid-cols-2 gap-2 justify-between">
                <button
                    onClick={handleAutoLocation}
                    disabled={autoLocationTriggered}
                    className={`py-2 px-4 rounded-lg text-white transition-colors duration-200 ${autoLocationTriggered ? 'bg-gray-400' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                >
                    <FiTarget className="inline-block mr-2" />
                    {autoLocationTriggered ? "Locating..." : "Auto-Locate Me"}
                </button>
                <button
                    onClick={showOnMap}
                    disabled={!lat || !lon}
                    className={`py-2 px-4 rounded-lg text-white transition-colors duration-200 ${!lat || !lon ? 'bg-gray-400' : 'bg-orange-500 hover:bg-orange-600'}`}
                >
                    <FiMapPin className="inline-block mr-2" />
                    Show on Map
                </button>
            </div>

            {/* Status and Coordinates */}
            {searchStatusMessage && (
                <p className={`text-sm ${searchStatusMessage.includes("Error") ? 'text-red-500' : 'text-emerald-500'} transition-colors duration-500`}>
                    {searchStatusMessage}
                </p>
            )}
            {lat && lon && (
                <p className="text-sm">
                    Coordinates: **Lat: {lat.toFixed(5)}, Lon: {lon.toFixed(5)}**
                </p>
            )}

            {/* Map Component */}
            {isMapVisible && lat && lon && (
                <div className="border-2 rounded-lg overflow-hidden h-64 mt-4">
                    <Suspense fallback={<p className="p-4">Map is loading...</p>}>
                        <PickedLocationMap
                            lat={lat}
                            lon={lon}
                            theme={currentTheme === 'dark' ? 'dark' : 'light'}
                        />
                    </Suspense>
                </div>
            )}
        </div>
    );
}