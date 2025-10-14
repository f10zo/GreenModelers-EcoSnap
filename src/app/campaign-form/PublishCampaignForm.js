'use client';

import React, { useState, useEffect, useMemo } from "react";
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import dynamic from 'next/dynamic';
import { galileeBeaches } from "@/lib/utils/constants/beaches";


// ====================================================================
// 📅 DATE UTILITIES
// ====================================================================

// Utility to format Date object into YYYY-MM-DD string
const toIsoDateString = (date) => {
    return date.toISOString().split('T')[0];
};

// Utility to convert YYYY-MM-DD (ISO) to DD/MM/YYYY format for display/storage
const isoToDisplayDate = (isoDate) => {
    if (!isoDate || isoDate.length !== 10) return '';
    const parts = isoDate.split('-'); // YYYY-MM-DD
    return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
};

// Utility to convert DD/MM/YYYY (Display) to YYYY-MM-DD format for input value
const displayToIsoDate = (displayDate) => {
    if (!displayDate || displayDate.length !== 10) return '';
    const parts = displayDate.split('/'); // DD/MM/YYYY
    // Check if parts are numbers and correct length
    if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
    }
    return '';
};


/**
 * Checks if a date string in 'YYYY-MM-DD' format is valid and within the allowed 6-month window.
 * This is primarily a fallback/final check, as min/max HTML attributes enforce the range in the picker.
 * It also checks against your specific year requirement (not too far in the future).
 * @param {string} dateString - The date input from the user (e.g., "2025-10-15").
 * @param {string} minIsoDate - The minimum allowed date in YYYY-MM-DD.
 * @param {string} maxIsoDate - The maximum allowed date in YYYY-MM-DD.
 * @returns {boolean} - True if the date passes all checks, false otherwise.
 */
const isDateValidAndInRange = (dateString, minIsoDate, maxIsoDate) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;

    const inputDate = new Date(dateString);
    if (isNaN(inputDate.getTime())) return false; // Invalid date (e.g., 30/02)

    // Normalize comparison dates
    const minDate = new Date(minIsoDate);
    minDate.setHours(0, 0, 0, 0);

    // Max date needs to be set to the *end* of its day for accurate comparison
    const maxDate = new Date(maxIsoDate);
    maxDate.setHours(23, 59, 59, 999);

    const comparisonDate = new Date(inputDate);
    comparisonDate.setHours(0, 0, 0, 0);

    // Check if date is within the allowed range (today up to 6 months)
    if (comparisonDate < minDate) return false;
    if (comparisonDate > maxDate) return false;

    // Check for years too far in the future (e.g., 2222)
    const currentYear = new Date().getFullYear();
    const inputYear = inputDate.getFullYear();

    // This strictly checks that the year is the current year or the year 6 months from now.
    // Given the 6-month limit, the maximum year should be currentYear + 1.
    if (inputYear > currentYear + 1) {
        return false;
    }

    return true;
};

// ====================================================================
// 🛑 END DATE UTILITIES
// ====================================================================


const DynamicSimpleMap = dynamic(
    () => import('./SimpleMapDisplay'),
    {
        ssr: false,
        loading: () => <p className="text-center text-sm p-4">Loading map preview...</p>,
    }
);

export default function PublishCampaignForm() {
    const [manualLocation, setManualLocation] = useState('');
    const [selectedBeach, setSelectedBeach] = useState('');
    const [coordinates, setCoordinates] = useState('');
    const [searchStatusMessage, setSearchStatusMessage] = useState('');
    const [apiErrorMessage, setApiErrorMessage] = useState('');
    const [isDropdownSelected, setIsDropdownSelected] = useState(false);
    const [isMapVisible, setIsMapVisible] = useState(false);
    const [lat, setLat] = useState(null);
    const [lon, setLon] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

    const [currentTheme, setCurrentTheme] = useState('light');
    const [status, setStatus] = useState("");

    const [dateError, setDateError] = useState(null);

    const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;


    // 🆕 Calculate min and max date strings for the calendar input
    const { minDateISO, maxDateISO } = useMemo(() => {
        const today = new Date();
        const sixMonthsLater = new Date();
        // Use the month after the current date + 6 months to define the limit
        sixMonthsLater.setMonth(today.getMonth() + 6);

        // Normalize to start of day for accurate 'min'
        today.setHours(0, 0, 0, 0);

        return {
            minDateISO: toIsoDateString(today),
            maxDateISO: toIsoDateString(sixMonthsLater),
        };
    }, []);

    useEffect(() => {
        // 1. Initialize the observer to watch for class changes on the root HTML element
        const observer = new MutationObserver(() => {
            const newTheme = document.documentElement.className;
            // The theme change will trigger a state update in React
            setCurrentTheme(newTheme);
        });

        // 2. Start observing the <html> tag for attribute changes (specifically 'class')
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        // 3. Cleanup function: This runs when the component unmounts
        return () => {
            observer.disconnect();

            // 4. Cleanup for the image preview URL (inherited from previous step)
            if (imagePreviewUrl) {
                URL.revokeObjectURL(imagePreviewUrl);
            }
        };
        // 5. Dependency array: The imagePreviewUrl needs to be here because it's used in the cleanup return function
    }, [imagePreviewUrl]);

    const [formData, setFormData] = useState({
        campaignName: "",
        organizer: "",
        // Date is stored in DD/MM/YYYY format
        date: "",
        time: "",
        location: "",
        description: "",
        volunteersNeeded: "",
        materials: "",
        locationLat: null,
        locationLon: null,
    });

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];

            setImageFile(file);

            if (imagePreviewUrl) {
                URL.revokeObjectURL(imagePreviewUrl);
            }
            setImagePreviewUrl(URL.createObjectURL(file));
        } else {
            // If no file is selected (e.g., user cancels, or we call it to clear)
            setImageFile(null);
            if (imagePreviewUrl) {
                URL.revokeObjectURL(imagePreviewUrl);
            }
            setImagePreviewUrl(null);
        }
    };

    const handleClearImage = () => {
        // Clear the file input element. This is important for re-selecting the same file.
        const fileInput = document.getElementById('imageUpload'); // Ensure your input has this ID
        if (fileInput) {
            fileInput.value = ''; // Reset the input value
        }
        setImageFile(null);
        if (imagePreviewUrl) {
            URL.revokeObjectURL(imagePreviewUrl);
        }
        setImagePreviewUrl(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'date') {
            setDateError(null);

            if (e.target.type === 'date') {
                // Input from picker (YYYY-MM-DD) -> store as DD/MM/YYYY
                const displayDate = isoToDisplayDate(value);
                setFormData((prev) => ({ ...prev, [name]: displayDate }));
                return;
            }

            // 🚨 FIX for manual year input and format restriction (using text input)
            // Regex to allow typing DD/MM/YYYY while limiting year to 4 digits
            const dateInputRegex = /^(\d{0,2}\/?\d{0,2}\/?\d{0,4})$/;
            if (dateInputRegex.test(value)) {
                setFormData((prev) => ({ ...prev, [name]: value }));
            }
            // Ignore input if it goes beyond the DD/MM/YYYY format
            return;
        }

        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // 🚨 NEW Handler to strictly enforce year logic on manual input (when blurring or on final submit)
    const handleDateBlur = (e) => {
        const dateString = e.target.value;
        setDateError(null);

        // First, check for full DD/MM/YYYY format
        const fullFormatRegex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!fullFormatRegex.test(dateString)) {
            if (dateString) {
                setDateError("❌ Please enter the date in DD/MM/YYYY format.");
                // If invalid format, reset year to 0000 and notify user
                setFormData(prev => ({ ...prev, date: '00/00/0000' }));
                e.target.focus(); // Keep focus for correction
            }
            return;
        }

        const isoDate = displayToIsoDate(dateString);

        // Final range and year check (handles "2222" issue)
        if (!isDateValidAndInRange(isoDate, minDateISO, maxDateISO)) {
            const parts = dateString.split('/');
            const inputYear = parseInt(parts[2], 10);
            const currentYear = new Date().getFullYear();

            if (inputYear > currentYear + 1) {
                // 🚨 FIX for year 2222: set year to 0000 and show error
                setDateError("❌ The selected year is too far in the future. Please choose a year within the next 6 months.");
                setFormData(prev => ({ ...prev, date: `${parts[0]}/${parts[1]}/0000` }));
                e.target.focus(); // Keep focus for correction
            } else {
                // General range error (past date or invalid day/month)
                setDateError("❌ The date must be today or in the future and within the next 6 months.");
                setFormData(prev => ({ ...prev, date: '00/00/0000' }));
                e.target.focus(); // Keep focus for correction
            }
            return;
        }
    };


    const handleBeachChange = (e) => {
        const val = e.target.value;
        setSelectedBeach(val);
        setManualLocation('');
        const beach = galileeBeaches.find(b => b.id === val);
        if (beach) {
            setCoordinates(`Lat: ${beach.lat}, Lon: ${beach.lon}`);
            setFormData(prev => ({
                ...prev,
                location: beach.name,
                locationLat: beach.lat,
                locationLon: beach.lon
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                location: "",
                locationLat: null,
                locationLon: null
            }));
        }
        setSearchStatusMessage('');
    };

    // Auto-detect location (using saved GEOAPIFY_API_KEY)
    const handleAutoLocation = async () => {
        setApiErrorMessage('');
        setSearchStatusMessage('Getting your current location...');
        if (!navigator.geolocation) {
            setSearchStatusMessage('Geolocation not supported.');
            return;
        }
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            setCoordinates(`Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`);
            setSelectedBeach('');

            // Perform reverse geocoding to get a location name
            try {
                const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=${GEOAPIFY_API_KEY}`;
                const response = await fetch(url);
                const data = await response.json();

                if (data.features && data.features.length > 0) {
                    const locationName = data.features[0].properties.formatted;
                    setManualLocation(locationName); // Set the name in the manual input field
                    setSearchStatusMessage('Location detected and named automatically.');
                    setFormData(prev => ({
                        ...prev,
                        locationLat: latitude,
                        locationLon: longitude,
                        location: locationName
                    }));
                } else {
                    setSearchStatusMessage('Location detected, but could not get a name for it.');
                    setManualLocation('');
                }
            } catch (err) {
                console.error("Error with Geoapify reverse geocoding:", err);
                setApiErrorMessage('Error getting location name. Try searching manually.');
                setManualLocation('');
            }
        }, (err) => {
            console.error(err);
            setSearchStatusMessage('Could not get location. Enable location services.');
            setCoordinates('');
        });
    };

    // Search coordinates from manual input (using saved GEOAPIFY_API_KEY)
    const onSearchLocation = async () => {
        if (!manualLocation.trim()) {
            setSearchStatusMessage('Please enter a location to search.');
            return;
        }
        setSearchStatusMessage('Searching for coordinates...');
        try {
            const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(manualLocation)}&apiKey=${GEOAPIFY_API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.features.length > 0) {
                const { lat, lon, formatted } = data.features[0].properties;
                const latitude = parseFloat(lat);
                const longitude = parseFloat(lon);
                setCoordinates(`Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`);
                setManualLocation(formatted);
                setSelectedBeach('');
                setSearchStatusMessage('Location found!');
                setFormData(prev => ({
                    ...prev,
                    locationLat: latitude,
                    locationLon: longitude,
                    location: formatted
                }));
            } else {
                setCoordinates('Coordinates not found');
                setSearchStatusMessage('No coordinates found for this location.');
                setFormData(prev => ({
                    ...prev,
                    locationLat: null,
                    locationLon: null,
                    location: manualLocation
                }));
            }
        } catch (err) {
            console.error(err);
            setCoordinates('Error');
            setSearchStatusMessage('Error finding coordinates. Try again.');
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("Validating form...");
        setDateError(null);

        // Perform the full date validation just before submission
        const isoDateForValidation = displayToIsoDate(formData.date);

        if (!isDateValidAndInRange(isoDateForValidation, minDateISO, maxDateISO)) {
            const errorMessage = "❌ Please select a date that is today or in the future and within the next 6 months.";
            setDateError(errorMessage);
            setStatus(errorMessage);

            // If the year is invalid (e.g., '2222'), reset it to 0000 on submit failure
            if (formData.date.length === 10) {
                const parts = formData.date.split('/');
                const inputYear = parseInt(parts[2], 10);
                const currentYear = new Date().getFullYear();
                if (inputYear > currentYear + 1) {
                    setFormData(prev => ({ ...prev, date: `${parts[0]}/${parts[1]}/0000` }));
                }
            }

            return;
        }

        const { locationLat, locationLon } = formData;
        if (!locationLat || !locationLon) {
            setStatus("❌ Please provide a location by selecting a beach or searching manually.");
            return;
        }

        let imageURL = null;
        if (imageFile) {
            setStatus("Uploading image...");
            try {
                const storage = getStorage();
                const imageRef = ref(storage, `campaign_images/${imageFile.name}_${Date.now()}`);
                await uploadBytes(imageRef, imageFile);
                imageURL = await getDownloadURL(imageRef);
                setStatus("Image uploaded. Publishing campaign details...");
            } catch (error) {
                console.error("Error uploading image:", error);
                setStatus("❌ Failed to upload image. Please try again.");
                return;
            }
        }
        try {
            await addDoc(collection(db, "campaigns"), {
                ...formData,
                volunteersNeeded: Number(formData.volunteersNeeded),
                createdAt: serverTimestamp(),
                imageUrl: imageURL,
            });

            setStatus("✅ Campaign published successfully!");
            setFormData({
                campaignName: "",
                organizer: "",
                date: "",
                time: "",
                location: "",
                description: "",
                volunteersNeeded: "",
                materials: "",
                locationLat: null,
                locationLon: null,
            });
            setManualLocation('');
            setSelectedBeach('');
            setCoordinates('');
            setImageFile(null);
        } catch (error) {
            console.error("Error submitting campaign:", error);
            setStatus("❌ Failed to publish campaign. Please try again.");
        }
    };

    const handleShowMap = () => {
        const latitude = formData.locationLat;
        const longitude = formData.locationLon;

        if (latitude != null && longitude != null) {
            setLat(latitude);
            setLon(longitude);
            setIsMapVisible(true);
            setSearchStatusMessage("Showing location on map!");
        } else {
            setSearchStatusMessage("Please select a location first.");
            setIsMapVisible(false);
        }
    };

    const isDarkMode = currentTheme.includes('dark');

    return (
        <div
            className="max-w-2xl mx-auto rounded-3xl shadow-xl p-6 overflow-hidden border-2 transition-colors duration-500"
            style={{
                backdropFilter: 'blur(12px)',
                backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.7)" : "rgba(255, 255, 255, 0.4)",
                borderColor: isDarkMode ? "#22c55e" : "#4ade80",
                color: isDarkMode ? "#fff" : "#000",
            }}
        >
            <h2
                className={`text-2xl sm:text-3xl font-bold mb-3 text-center mt-2 transition-colors duration-500 ${isDarkMode ? "text-emerald-300" : "text-emerald-700"}`}
            >
                📢 Publish a Volunteer Campaign
            </h2>

            <p className={`text-center mb-6 text-lg font-medium transition-colors duration-500 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Initiate a cleanup effort. Use this form to announce a <strong>volunteer campaign</strong> dedicated to remediating sites previously identified as polluted.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
                {/* Campaign & Organizer */}
                <input
                    type="text"
                    name="campaignName"
                    placeholder="Campaign Name"
                    value={formData.campaignName}
                    onChange={handleChange}
                    className={`w-full p-2 rounded-lg border transition-colors duration-500 ${isDarkMode ? 'border-emerald-500 bg-slate-700 text-gray-200 placeholder-emerald-300' : 'border-emerald-300 bg-white/70 text-gray-800 placeholder-emerald-700'}`}
                    required
                />

                <input
                    type="text"
                    name="organizer"
                    placeholder="Organizer Name / Contact"
                    value={formData.organizer}
                    onChange={handleChange}
                    className={`w-full p-2 rounded-lg border transition-colors duration-500 ${isDarkMode ? 'border-emerald-500 bg-slate-700 text-gray-200 placeholder-emerald-300' : 'border-emerald-300 bg-white/70 text-gray-800 placeholder-emerald-700'}`}
                    required
                />

                {/* Date and Time Input with Robust Time Format Enforcement */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Date Input */}
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium mb-1">
                            Date (DD/MM/YYYY)
                        </label>
                        <input
                            // 🚨 Using type="date" to let the browser enforce its min/max/4-digit year limits 
                            // and type="text" when the stored date is empty for better manual input experience.
                            // The value is switched between DD/MM/YYYY (state) and YYYY-MM-DD (input value)
                            type={formData.date ? "date" : "text"}
                            id="date"
                            name="date"
                            placeholder="DD/MM/YYYY"
                            // Value is passed in YYYY-MM-DD (ISO) format when type="date"
                            // or DD/MM/YYYY (state) format when type="text"
                            value={formData.date ? displayToIsoDate(formData.date) : formData.date}
                            onChange={handleChange}
                            onBlur={handleDateBlur} // 🚨 New handler to enforce strict year/format checks on manual entry
                            min={minDateISO} // Cannot choose past dates (Point 4)
                            max={maxDateISO} // Cannot choose beyond 6 months (Point 3)
                            maxLength={10} // Strictly limits the length of manual DD/MM/YYYY entry
                            className={`p-3 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full
                            ${isDarkMode ? 'border-emerald-500 bg-slate-700 text-gray-200' : 'border-emerald-300 bg-white/70 text-gray-800'} 
                            ${dateError ? 'border-red-500' : ''}`}
                            required
                        />
                        {/* 📝 New note for user */}
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            You can choose a date from today up to 6 months from now.
                        </p>
                        {/* ❌ Display Date Validation Error */}
                        {dateError && <p className={`text-xs mt-1 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{dateError}</p>}
                    </div>

                    {/* Time Input and 'Now' Button */}
                    <div className="flex flex-col">
                        <label htmlFor="time" className="block text-sm font-medium mb-1">
                            Time (HH:MM)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="time"
                                id="time"
                                name="time"
                                placeholder="--:--"
                                value={formData.time}
                                onChange={handleChange}
                                className={`flex-1 p-3 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block
                                ${isDarkMode ? 'border-emerald-500 bg-slate-700 text-gray-200 placeholder-emerald-300' : 'border-emerald-300 bg-white/70 text-gray-800 placeholder-emerald-700'}`}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    const now = new Date();
                                    // Set date to DD/MM/YYYY for the user
                                    const day = String(now.getDate()).padStart(2, '0');
                                    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
                                    const year = now.getFullYear();

                                    setFormData(prev => ({
                                        ...prev,
                                        date: `${day}/${month}/${year}`, // DD/MM/YYYY (stored format)
                                        time: now.toTimeString().slice(0, 5) // HH:MM format
                                    }));
                                }}
                                className={`px-4 py-3 rounded-lg text-sm transition-colors duration-500 whitespace-nowrap
                                ${isDarkMode ? 'bg-emerald-700 text-white hover:bg-emerald-600' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                            >
                                Now
                            </button>
                        </div>
                    </div>
                </div>

                {/* Location Selection (Beach dropdown + manual input + buttons) */}
                <div className="flex flex-col gap-3 mt-2">
                    {/* Dropdown */}
                    <div className="flex gap-2 items-center">
                        <select
                            value={selectedBeach}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedBeach(val);
                                const beach = galileeBeaches.find(b => b.id === val);

                                if (beach) {
                                    setCoordinates(`Lat: ${beach.lat.toFixed(5)}, Lon: ${beach.lon.toFixed(5)}`);
                                    setFormData(prev => ({
                                        ...prev,
                                        location: beach.name,
                                        locationLat: beach.lat,
                                        locationLon: beach.lon
                                    }));
                                    setManualLocation('');
                                    setIsDropdownSelected(true);
                                } else {
                                    setFormData(prev => ({
                                        ...prev,
                                        location: '',
                                        locationLat: null,
                                        locationLon: null
                                    }));
                                    setManualLocation('');
                                    setCoordinates('');
                                    setIsDropdownSelected(false);
                                }
                            }}
                            className={`flex-1 border rounded-lg p-2 focus:outline-none focus:ring-2 transition-colors duration-500 ${isDarkMode ? 'bg-slate-700 text-emerald-300' : 'bg-white/70 text-emerald-700'}`}
                        >
                            <option value="">Select a Beach</option>
                            {galileeBeaches.map((beach, index) => (
                                <option key={`${beach.id}-${index}`} value={beach.id}>
                                    {beach.name} ({beach.english})
                                </option>
                            ))}
                        </select>

                        {/* Clear dropdown */}
                        {isDropdownSelected && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedBeach('');
                                    setIsDropdownSelected(false);
                                    setManualLocation('');
                                    setCoordinates('');
                                    setFormData(prev => ({
                                        ...prev,
                                        location: '',
                                        locationLat: null,
                                        locationLon: null
                                    }));
                                }}
                                className="px-3 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 text-sm"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Manual input + search + auto buttons */}
                    <div className="flex gap-2 items-center">
                        <textarea
                            placeholder="Or enter location manually (Address, City, Zip Code)"
                            className={`flex-1 border rounded-lg p-2 resize-none focus:outline-none focus:ring-2 transition-colors duration-500 ${isDarkMode ? 'bg-black/30 text-emerald-300 placeholder-gray-400' : 'bg-white/70 text-emerald-700 placeholder-gray-500'} ${isDropdownSelected ? 'cursor-not-allowed' : ''}`}
                            value={manualLocation}
                            onChange={(e) => {
                                setManualLocation(e.target.value);
                                setSelectedBeach('');
                                setCoordinates('');
                                setFormData(prev => ({
                                    ...prev,
                                    location: e.target.value,
                                    locationLat: null,
                                    locationLon: null
                                }));
                                setIsDropdownSelected(false);
                            }}
                            disabled={isDropdownSelected}
                            rows={2}
                        />
                        <button
                            type="button"
                            onClick={onSearchLocation}
                            disabled={isDropdownSelected || !manualLocation}
                            className={`px-3 py-2 text-white rounded-lg hover:bg-blue-600 text-sm transition-colors duration-200 ${isDropdownSelected || !manualLocation ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500'}`}
                        >
                            Search
                        </button>
                        <button
                            type="button"
                            onClick={handleAutoLocation}
                            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                        >
                            Auto
                        </button>
                    </div>

                    {/* Display coordinates & status */}
                    {coordinates && <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{coordinates}</p>}
                    {searchStatusMessage && <p className={`text-xs ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>{searchStatusMessage}</p>}
                    {apiErrorMessage && <p className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{apiErrorMessage}</p>}
                </div>

                <button
                    type="button"
                    onClick={handleShowMap}
                    className="w-full py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 font-semibold transition-colors duration-200"
                >
                    Show on Map 🗺️
                </button>

                {isMapVisible && formData.locationLat != null && formData.locationLon != null && (
                    <DynamicSimpleMap
                        lat={formData.locationLat} // Use formData state for coordinates
                        lon={formData.locationLon} // Use formData state for coordinates
                        onClose={() => setIsMapVisible(false)}
                    />
                )}

                {/* Drag & Drop Image */}
                <div
                    className={`w-full p-4 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors duration-500 ${isDarkMode ? 'border-emerald-500 bg-slate-700 text-gray-200' : 'border-emerald-300 bg-white/70 text-gray-800'} mb-1 relative`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) handleImageChange({ target: { files: e.dataTransfer.files } });
                    }}
                >
                    <p className={`text-center mb-1 text-sm ${isDarkMode ? 'placeholder-emerald-300' : 'placeholder-emerald-700'}`}>{imageFile ? `Selected: ${imageFile.name}` : `Drag & drop an image here, or click to select`}</p>
                    <input type="file" id="imageUpload" accept="image/*" onChange={handleImageChange} className="absolute w-full h-full opacity-0 cursor-pointer" />

                    {imagePreviewUrl && (
                        <div className="mt-4 w-full flex justify-center relative"> {/* Add relative here for absolute positioning of button */}
                            <img
                                src={imagePreviewUrl}
                                alt="Selected Image Preview"
                                className="max-w-full h-40 object-contain rounded-lg shadow-md border"
                            />
                            {/* 🆕 "X" BUTTON FOR CLEARING IMAGE */}
                            <button
                                type="button"
                                onClick={handleClearImage}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold opacity-75 hover:opacity-100 transition-opacity duration-200"
                                aria-label="Clear image"
                            >
                                X
                            </button>
                        </div>
                    )}
                </div>

                {/* Description */}
                <textarea
                    name="description"
                    placeholder="Description of the campaign"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className={`w-full p-2 rounded-lg border transition-colors duration-500 ${isDarkMode ? 'border-emerald-500 bg-slate-700 text-white placeholder-emerald-300' : 'border-emerald-300 bg-white/70 text-gray-800 placeholder-emerald-700'}`}
                    required
                />

                {/* Volunteers & Materials */}
                <input
                    type="number"
                    name="volunteersNeeded"
                    placeholder="Volunteers Needed (e.g., 10)"
                    value={formData.volunteersNeeded}
                    onChange={handleChange}
                    min="0"
                    className={`w-full p-2 rounded-lg border transition-colors duration-500 ${isDarkMode ? 'border-emerald-500 bg-slate-700 text-gray-200 placeholder-emerald-300' : 'border-emerald-300 bg-white/70 text-gray-800 placeholder-emerald-700'}`}
                    required
                />
                <input
                    type="text"
                    name="materials"
                    placeholder="Materials / Requirements (optional)"
                    value={formData.materials}
                    onChange={handleChange}
                    className={`w-full p-2 rounded-lg border transition-colors duration-500 ${isDarkMode ? 'border-emerald-500 bg-slate-700 text-gray-200 placeholder-emerald-300' : 'border-emerald-300 bg-white/70 text-gray-800 placeholder-emerald-700'}`}
                />
                <button
                    type="submit"
                    className={`w-full p-2 rounded-lg font-semibold transition-colors duration-500 ${isDarkMode ? 'bg-emerald-500 text-white hover:bg-emerald-400' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                >
                    Publish Campaign
                </button>

                {status && <p className={`text-center mt-2 text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{status}</p>}
            </form>
        </div>
    );
}