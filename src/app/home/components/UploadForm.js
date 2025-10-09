// src/app/home/components/UploadForm.js
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { db, storage } from "../../../firebase"; // Assuming this path is correct
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// Import local utilities and constants
import { getCurrentDateTime, dataURLtoBlob, geocodeAddress } from "@/lib/utils/helpers";
import { dmsToDecimal, extractGeolocation } from "@/lib/utils/exifUtils";
import { galileeBeaches } from "@/lib/utils/constants/beaches";

import ImageUploader from "./ImageUploader";
import LocationPicker from "./LocationPicker";
import piexif from "piexifjs";


export default function UploadForm({ onUploadSuccess }) {
    const router = useRouter();
    const [file, setFile] = useState(null); // The actual File/Blob object
    const [preview, setPreview] = useState(null); // Base64 string for preview/reupload
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState(""); // Selected beach ID (from dropdown)
    const [manualLocation, setManualLocation] = useState(""); // Manually typed location or reverse-geocoded name
    const [pollutionLevel, setPollutionLevel] = useState("Low");
    const [isMapVisible, setIsMapVisible] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentUploadTask, setCurrentUploadTask] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [coordinates, setCoordinates] = useState("");
    const [fileInputKey, setFileInputKey] = useState(0);
    const [imageLocation, setImageLocation] = useState(null);
    const [address, setAddress] = useState(null);

    // Coordinates state for map and location setting
    const [lat, setLat] = useState(null);
    const [lon, setLon] = useState(null);

    // **NEW STATE**: Track if location was set by EXIF data
    const [isLocationFromImage, setIsLocationFromImage] = useState(false);

    // Date/Time
    const { dateInput, time } = getCurrentDateTime();
    const [dateValue, setDateValue] = useState(dateInput);
    const [timeValue, setTimeValue] = useState(time);

    // Theme state
    const [currentTheme, setCurrentTheme] = useState("light");

    const resetFileInput = () => {
        setFileInputKey(prev => prev + 1);
    };


    // Helper function to call your API route for reverse geocoding
    const reverseGeocode = async (lat, lon) => {
        // 🛑 CRITICAL CHANGE: Use the helper function directly 🛑
        try {
            setManualLocation("Auto-detecting location name..."); // Keep this for user feedback
            const address = await geocodeAddress(lat, lon); // Call the existing helper

            if (address && !address.includes("No address found") && !address.includes("failed")) {
                setManualLocation(address);
                return address;
            } else {
                // Fallback message if geocoding failed or returned a generic error
                const fallback = `Coordinates: Lat ${lat.toFixed(5)}, Lon ${lon.toFixed(5)}`;
                setManualLocation(fallback);
                console.error("Reverse Geocode failed to return a specific address.");
                return fallback;
            }
        } catch (error) {
            console.error("Reverse Geocoding network error:", error);
            const fallback = `Coordinates: Lat ${lat.toFixed(5)}, Lon ${lon.toFixed(5)}`;
            setManualLocation(fallback);
            return fallback;
        }
    };

    /**
     * Handles file selection, sets up the preview, and receives the EXIF GPS data
     * directly from the ImageUploader component.
     * @param {File | null} file - The original file object.
     * @param {string | null} dataUrl - The Base64 string of the image.
     * @param {number | null} exiFlat - The extracted latitude from EXIF.
     * @param {number | null} exiFlon - The extracted longitude from EXIF.
     */
    const handleImageChange = async (file, dataUrl, exiFlat, exiFlon) => {
        setPreview(dataUrl);

        // --- NEW LOGIC: Handle Clearing Image ---
        if (!file) {
            setFile(null);
            setPreview(null); // Clear preview when file is null
            // Only reset coordinates if they were set by the image (i.e., EXIF data was present)
            if (isLocationFromImage) {
                setLat(null);
                setLon(null);
                setLocation("");
                setManualLocation("");
                setIsLocationFromImage(false);
            }
            // If the user had manually set a location, we preserve it.
            setImageLocation(null);
            setAddress(null);
            console.log("Image cleared. Preserving manually set location.");
            return;
        }
        // --- END NEW LOGIC ---

        setFile(file);

        const latValue = exiFlat;
        const lonValue = exiFlon;

        console.log("UploadForm received EXIF coordinates:", { latValue, lonValue });

        if (latValue && lonValue) {
            console.log("EXIF Location Found and Received:", { latValue, lonValue });

            // Set coordinates for the map
            setLat(latValue);
            setLon(lonValue);
            // Flag the location as coming from the image
            setIsLocationFromImage(true);

            // Clear pre-selected beach/dropdown location (since we have precise EXIF data)
            setLocation("");

            // Reverse geocode the coordinates to get a readable address
            await reverseGeocode(latValue, lonValue);

        } else {
            console.log("No GPS data received from ImageUploader. Keeping current location if manually set.");
            setImageLocation(null);
            // If no EXIF data, we DO NOT reset the existing lat/lon state.
            // This preserves the location the user may have picked manually.
            setIsLocationFromImage(false); // Clear flag
        }
    };


    // --- State Persistence (Local Storage) ---
    // Make sure to add the new state variable to load/save
    const loadFormState = () => {
        const storedState = localStorage.getItem('uploadFormState');
        if (storedState) {
            const state = JSON.parse(storedState);
            setDescription(state.description || "");
            setLocation(state.location || "");
            setManualLocation(state.manualLocation || "");
            setPollutionLevel(state.pollutionLevel || "Low");
            setDateValue(state.dateValue || getCurrentDateTime().dateInput);
            setTimeValue(state.timeValue || getCurrentDateTime().time);
            setCoordinates(state.coordinates || "");
            setPreview(state.preview || null);
            setLat(state.lat || null);
            setLon(state.lon || null);
            setIsLocationFromImage(state.isLocationFromImage || false); // ⬅️ ADDED
        }
    };

    const saveFormState = () => {
        const state = {
            description,
            location,
            manualLocation,
            pollutionLevel,
            dateValue,
            timeValue,
            coordinates,
            preview,
            lat,
            lon,
            isLocationFromImage, // ⬅️ ADDED
        };
        localStorage.setItem('uploadFormState', JSON.stringify(state));
    };

    useEffect(() => { loadFormState(); }, []);

    useEffect(() => { saveFormState(); }, [description, location, manualLocation, pollutionLevel, dateValue, timeValue, coordinates, preview, lat, lon, isLocationFromImage]); // ⬅️ ADDED isLocationFromImage

    // --- Theme Observer ---
    useEffect(() => {
        if (typeof document !== "undefined") {
            const observer = new MutationObserver(() => {
                const newTheme = document.documentElement.className || "light";
                setCurrentTheme(newTheme);
            });
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
            return () => observer.disconnect();
        }
    }, []);

    const getLevelColorClass = (level, isDark) => {
        switch (level) {
            case "Low":
                // Green for Low/Minor pollution
                return isDark ? 'text-green-400 border-green-400' : 'text-green-700 border-green-500';
            case "Medium":
                // Yellow/Orange for Medium pollution
                return isDark ? 'text-yellow-400 border-yellow-400' : 'text-orange-600 border-yellow-500';
            case "High":
                // Red for High/Critical pollution
                return isDark ? 'text-red-400 border-red-400' : 'text-red-700 border-red-500';
            default:
                return isDark ? 'text-white border-gray-600' : 'text-black border-gray-300';
        }
    };

    // --- Submission Logic ---
    const handleUpload = async () => {
        let fileToUpload = file;

        // Convert preview to file/blob if original file was lost (e.g., page reload, state loaded from storage)
        if (!fileToUpload && preview) {
            const blob = dataURLtoBlob(preview);
            fileToUpload = new File([blob], `reupload_${Date.now()}.png`, { type: blob.type });
        }

        if (!fileToUpload) {
            alert("Please select a photo.");
            return;
        }

        const locationToSave = manualLocation || galileeBeaches.find(beach => beach.id === location)?.name || "";

        if (!locationToSave) {
            alert("Location is a required field. Please select a beach or enter a location.");
            return;
        }
        if (!pollutionLevel) {
            alert("Pollution level is a required field. Please select an urgency level.");
            return;
        }

        try {
            const storageRef = ref(storage, `images/${Date.now()}_${fileToUpload.name}`);
            const uploadTask = uploadBytesResumable(storageRef, fileToUpload);
            setCurrentUploadTask(uploadTask);

            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const prog = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    setProgress(prog);
                },
                (err) => {
                    console.error("Upload error:", err);
                    alert("Upload failed. Check console.");
                    setCurrentUploadTask(null);
                },
                async () => {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    const { dateInput: dateDisplay, time } = getCurrentDateTime();

                    await addDoc(collection(db, "reports"), {
                        imageUrl: url,
                        description,
                        location: locationToSave,
                        coordinates: lat && lon ? `Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}` : "N/A",
                        pollution_level: pollutionLevel,
                        date: `${dateValue} ${timeValue}`,
                        timestamp: new Date().toISOString(),
                    });

                    if (onUploadSuccess) onUploadSuccess();

                    // Reset Form
                    setFile(null);
                    setPreview(null);
                    setDescription("");
                    setLocation("");
                    setManualLocation("");
                    setPollutionLevel("Low");
                    setProgress(0);
                    setFileInputKey(Date.now()); // Force re-render of file input
                    setCurrentUploadTask(null);
                    setCoordinates("");
                    setLat(null);
                    setLon(null);
                    setIsLocationFromImage(false); // ⬅️ RESET NEW STATE
                    localStorage.removeItem('uploadFormState');
                    setSuccessMessage("Upload successful! Your report is now in the gallery.");
                    setTimeout(() => { setSuccessMessage(""); }, 5000);
                }
            );
        } catch (err) {
            console.error(err);
            alert("Upload failed. Check console.");
            setCurrentUploadTask(null);
        }
    };

    const handleCancel = () => {
        if (currentUploadTask) {
            currentUploadTask.cancel();
            alert("Upload cancelled.");
            setProgress(0);
            setFile(null);
            setPreview(null);
            setCurrentUploadTask(null);
            setFileInputKey(Date.now());
        }
    };

    const isDarkMode = currentTheme.includes('dark');

    return (
        <div
            className="w-full max-w-4xl rounded-3xl p-6 relative overflow-y-auto border-2 shadow-2xl transition-colors duration-500"
            style={{
                backdropFilter: "blur(12px)",
                backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.7)" : "rgba(255, 255, 255, 0.35)",
                borderColor: isDarkMode ? "#22c55e" : "#4ade80",
                color: isDarkMode ? "#fff" : "#000",
            }}
        >
            {/* Header */}
            <h2 className={`text-3xl font-bold mb-6 text-center ${isDarkMode ? "text-emerald-300" : "text-emerald-700"}`}>
                <strong>Upload Report</strong>
            </h2>

            {/* Success Message */}
            {successMessage && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
                    <p className="font-bold">Success! 🎉</p>
                    <p>{successMessage}</p>
                </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleUpload(); }} className="space-y-6">

                {/* 1. Image Uploader Section */}
                <ImageUploader
                    // Pass the new handler to ImageUploader
                    handleImageChange={handleImageChange}
                    preview={preview}
                    setPreview={setPreview}
                    lat={lat}
                    setLat={setLat}
                    lon={lon}
                    setLon={setLon}
                    currentTheme={currentTheme}
                    fileInputKey={fileInputKey}
                    setFileInputKey={setFileInputKey}
                />

                {/* 2. Description and Pollution Level */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Description Field */}
                    <div>
                        <label htmlFor="description" className="block text-lg font-medium mb-1">
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows="3"
                            placeholder="Describe the pollution (e.g., plastic bottles, oil spill, etc.)"
                            className={`p-3 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full
                ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                        ></textarea>
                    </div>

                    {/* Pollution Level Field with Colors */}
                    <div>
                        <label htmlFor="pollutionLevel" className="block text-lg font-medium mb-1">
                            Pollution Level *
                        </label>
                        <select
                            id="pollutionLevel"
                            value={pollutionLevel}
                            onChange={(e) => setPollutionLevel(e.target.value)}
                            // Apply dynamic color class to the SELECT element for the currently chosen value
                            className={`p-3 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full appearance-none transition duration-150 ease-in-out font-semibold
                ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}
                ${getLevelColorClass(pollutionLevel, isDarkMode)}`}
                            required
                        >
                            {/* Low Level Option: Green */}
                            <option
                                value="Low"
                                className={`font-semibold ${isDarkMode ? 'bg-gray-700 text-green-400' : 'bg-white text-green-700'}`}
                            >
                                Low (Few items)
                            </option>

                            {/* Medium Level Option: Orange */}
                            <option
                                value="Medium"
                                className={`font-semibold ${isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-white text-orange-600'}`}
                            >
                                Medium (Scattered area)
                            </option>

                            {/* High Level Option: Red */}
                            <option
                                value="High"
                                className={`font-semibold ${isDarkMode ? 'bg-gray-700 text-red-400' : 'bg-white text-red-700'}`}
                            >
                                High (Major accumulation/Spill)
                            </option>
                        </select>
                    </div>
                </div>

                {/* 3. Date and Time Input */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="date" className="block text-lg font-medium mb-1">
                            Date of Sighting
                        </label>
                        <input
                            type="date"
                            id="date"
                            value={dateValue}
                            onChange={(e) => setDateValue(e.target.value)}
                            max={dateInput}
                            className={`p-3 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full
                ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                        />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="time" className="block text-lg font-medium mb-1">
                            Time of Sighting
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="time"
                                id="time"
                                value={timeValue}
                                onChange={(e) => setTimeValue(e.target.value)}
                                className={`flex-1 p-3 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block
                    ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                            />
                            <button
                                type="button"
                                onClick={() => { setDateValue(dateInput); setTimeValue(time); }}
                                className="p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Now
                            </button>
                        </div>
                    </div>
                </div>

                {/* 4. Location Picker Section */}
                <LocationPicker
                    manualLocation={manualLocation}
                    setManualLocation={setManualLocation}
                    location={location}
                    setLocation={setLocation}
                    coordinates={coordinates}
                    setCoordinates={setCoordinates}
                    lat={lat}
                    setLat={setLat}
                    lon={lon}
                    setLon={setLon}
                    isMapVisible={isMapVisible}
                    setIsMapVisible={setIsMapVisible}
                    currentTheme={currentTheme}
                />

                {/* 5. Upload Status and Actions */}
                <div className="mt-8 pt-4 border-t border-gray-700">
                    {currentUploadTask && progress > 0 && progress < 100 && (
                        <div className="mb-4">
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium">Uploading...</span>
                                <span className="text-sm font-medium">{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={!file || currentUploadTask || progress > 0}
                            className={`flex-1 py-3 px-6 rounded-xl text-white font-bold transition-colors duration-200 shadow-lg ${!file || currentUploadTask ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                        >
                            Submit Report
                        </button>

                        {currentUploadTask && (
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="py-3 px-6 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors duration-200 shadow-lg"
                            >
                                Cancel Upload
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}