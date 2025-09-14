"use client";

import React, { useState, useEffect, useRef } from "react";
import { db, storage } from "../../../firebase";
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { FiUpload, FiCamera } from "react-icons/fi";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';


// Helper function to get the current formatted date and time
const getCurrentDateTime = () => {
    const now = new Date();
    const options = { timeZone: "Asia/Jerusalem" };
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const israelDateInput = `${year}-${month}-${day}`;
    const israelTime = now.toLocaleTimeString("en-GB", {
        ...options,
        hour: "2-digit",
        minute: "2-digit",
    });
    return { dateInput: israelDateInput, time: israelTime };
};

// Helper function to convert a base64 string to a Blob
const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
};

// Helper function for geocoding
const geocodeAddress = async (address, GEOAPIFY_API_KEY) => {
    if (!address) return;
    try {
        const response = await fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&lang=en&apiKey=${GEOAPIFY_API_KEY}`);
        if (!response.ok) throw new Error('Failed to fetch coordinates');
        const data = await response.json();
        if (data.features && data.features.length > 0) {
            const { lat, lon, street, housenumber, postcode, city } = data.features[0].properties;
            return { lat, lon, street, housenumber, postcode, city };
        } else {
            return null;
        }
    } catch (error) {
        console.error("Geocoding error:", error);
        return null;
    }
};

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

export default function UploadForm({ onUploadSuccess }) {
    const router = useRouter();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [pollutionLevel, setPollutionLevel] = useState("Low");
    const [progress, setProgress] = useState(0);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [coordinates, setCoordinates] = useState("");
    const [apiErrorMessage, setApiErrorMessage] = useState("");
    const [searchStatusMessage, setSearchStatusMessage] = useState("");
    const [currentTheme, setCurrentTheme] = useState('light'); // Added new state for the theme

    const { dateInput, time } = getCurrentDateTime();
    const [dateValue, setDateValue] = useState(dateInput);
    const [timeValue, setTimeValue] = useState(time);

    const [fileInputKey, setFileInputKey] = useState(Date.now());
    const [currentUploadTask, setCurrentUploadTask] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const [successMessage, setSuccessMessage] = useState("");

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const videoStreamRef = useRef(null);

    const GEOAPIFY_API_KEY = "798aff4296834f94ae8593ec7f2146b5";

    // Added new useEffect to monitor theme changes
    useEffect(() => {
        const observer = new MutationObserver(() => {
            const newTheme = document.documentElement.className;
            setCurrentTheme(newTheme);
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const handleFileChange = async (f) => {
        if (f) {
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            };

            try {
                console.log(`Original file size: ${(f.size / 1024 / 1024).toFixed(2)} MB`);
                const compressedFile = await imageCompression(f, options);
                console.log(`Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

                setFile(compressedFile);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreview(reader.result);
                };
                reader.readAsDataURL(compressedFile);
                setIsCameraActive(false);
            } catch (error) {
                console.error("Image compression failed:", error);
                alert("There was an error compressing the image. Please try a different file.");
                setFile(null);
                setPreview(null);
            }
        } else {
            setFile(null);
            setPreview(null);
        }
    };

    const saveFormState = () => {
        const state = {
            description,
            location,
            pollutionLevel,
            dateValue,
            timeValue,
            coordinates,
            preview,
        };
        localStorage.setItem('uploadFormState', JSON.stringify(state));
    };

    const loadFormState = () => {
        const storedState = localStorage.getItem('uploadFormState');
        if (storedState) {
            const state = JSON.parse(storedState);
            setDescription(state.description || "");
            setLocation(state.location || "");
            setPollutionLevel(state.pollutionLevel || "Low");
            setDateValue(state.dateValue || getCurrentDateTime().dateInput);
            setTimeValue(state.timeValue || getCurrentDateTime().time);
            setCoordinates(state.coordinates || "");
            setPreview(state.preview || null);
        }
    };

    useEffect(() => {
        loadFormState();
    }, []);

    useEffect(() => {
        saveFormState();
    }, [description, location, pollutionLevel, dateValue, timeValue, coordinates, preview]);

    const setCurrentDateTime = () => {
        const { dateInput, time } = getCurrentDateTime();
        setDateValue(dateInput);
        setTimeValue(time);
    };


    const handleCancelPreview = () => {
        setFile(null);
        setPreview(null);
        setFileInputKey(Date.now());
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type.startsWith("image/")) {
            handleFileChange(droppedFile);
        } else {
            alert("Please drop an image file.");
        }
    };

    useEffect(() => {
        const handlePaste = (e) => {
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            for (const item of items) {
                if (item.type.startsWith("image/")) {
                    const pastedFile = item.getAsFile();
                    if (pastedFile) {
                        handleFileChange(pastedFile);
                    }
                    break;
                }
            }
        };
        document.addEventListener("paste", handlePaste);
        return () => {
            document.removeEventListener("paste", handlePaste);
        };
    }, []);

    const startCamera = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Your browser does not support camera access.");
            return;
        }

        setIsCameraActive(true); // make sure <video> renders first

        try {
            // small delay to ensure video element is rendered
            await new Promise(resolve => setTimeout(resolve, 100));

            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoStreamRef.current = stream;
                videoRef.current.play();
            }
        } catch (err) {
            console.error("Camera access denied or error:", err);
            alert("Could not access the camera. Please check your browser's permissions.");
            setIsCameraActive(false);
        }
    };

    useEffect(() => {
        if (isCameraActive && videoRef.current && videoStreamRef.current) {
            videoRef.current.play();
        }
        return () => {
            if (videoStreamRef.current) {
                videoStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [isCameraActive]);

    const handleCapturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
            const capturedFile = new File([blob], "captured_photo.jpeg", { type: "image/jpeg" });
            handleFileChange(capturedFile);
            setIsCameraActive(false);
        }, "image/jpeg");
    };

    const handleLocationChange = (e) => {
        const newLocation = e.target.value;
        setLocation(newLocation);
    };

    const onSearchLocation = () => {
        if (location.trim() === "") {
            setSearchStatusMessage("Please enter a location to search.");
            return;
        }
        setSearchStatusMessage("Searching for coordinates...");
        geocodeAddress(location, GEOAPIFY_API_KEY).then((data) => {
            if (data) {
                setSearchStatusMessage("Coordinates updated.");
                const { street, housenumber, city, postcode, lat, lon } = data;
                const newLocation = `${street || ''} ${housenumber || ''}, ${city || ''}, ${postcode || ''}`.trim().replace(/^,/, '').trim();
                setLocation(newLocation || location);
                setCoordinates(`Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`);
            } else {
                setSearchStatusMessage("Error finding coordinates.");
            }
        }).catch(() => {
            setSearchStatusMessage("Error finding coordinates.");
        });
    };

    const hebrewToEnglishMap = {
        'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z', 'ח': 'kh', 'ט': 't', 'י': 'y', 'כ': 'kh', 'ך': 'kh', 'ל': 'l', 'מ': 'm', 'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's', 'ע': 'a', 'פ': 'p', 'ף': 'p', 'צ': 'ts', 'ץ': 'ts', 'ק': 'k', 'ר': 'r', 'ש': 'sh', 'ת': 't',
        ' ': ' '
    };

    const transliterateHebrew = (text) => {
        if (!text) return '';
        let result = '';
        for (const char of text) {
            result += hebrewToEnglishMap[char] || char;
        }
        return result;
    };

    const handleAutoLocation = () => {
        setApiErrorMessage("");
        setSearchStatusMessage("Getting your current location...");
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const { latitude, longitude } = pos.coords;
                setCoordinates(`Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`);

                try {
                    const response = await fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&lang=en&apiKey=${GEOAPIFY_API_KEY}`);
                    const data = await response.json();
                    if (data.features && data.features.length > 0) {
                        const properties = data.features[0].properties;

                        let street = properties.street || '';
                        let city = properties.city || '';
                        const postcode = properties.postcode || '';

                        street = transliterateHebrew(street);
                        city = transliterateHebrew(city);

                        const addressParts = [];
                        if (street) addressParts.push(street);
                        if (city) addressParts.push(city);
                        if (postcode) addressParts.push(postcode);

                        const newLocation = addressParts.join(', ').trim();
                        setLocation(newLocation || "Unknown Location");
                        setSearchStatusMessage("Location found!");
                    } else {
                        setLocation("Unknown Location");
                        setSearchStatusMessage("Location name not found.");
                    }
                } catch (err) {
                    console.error("Reverse geocoding error:", err);
                    setLocation("Error getting location name");
                    setSearchStatusMessage("Error getting location name.");
                }
            }, (error) => {
                console.error("Geolocation error:", error);
                setSearchStatusMessage("Could not get your location. Please ensure location services are enabled.");
                setCoordinates("Error getting real-time coordinates");
            });
        } else {
            setSearchStatusMessage("Geolocation is not supported by your browser");
            setCoordinates("");
        }
    };

    const handleUpload = async () => {
        let fileToUpload = file;
        if (!fileToUpload && preview) {
            const blob = dataURLtoBlob(preview);
            fileToUpload = new File([blob], `reupload_${Date.now()}.png`, { type: blob.type });
        }

        if (!fileToUpload) {
            alert("Please select a photo.");
            return;
        }
        if (!location) {
            alert("Location is a required field. Please enter a location or use the 'Auto' button.");
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
                    const prog = Math.round(
                        (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                    );
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
                        location: location,
                        coordinates: coordinates,
                        pollution_level: pollutionLevel,
                        date: `${dateDisplay} ${time}`,
                    });

                    if (onUploadSuccess) onUploadSuccess();

                    setFile(null);
                    setPreview(null);
                    setDescription("");
                    setLocation("");
                    setPollutionLevel("Low");
                    setProgress(0);
                    setFileInputKey(Date.now());
                    setCurrentUploadTask(null);
                    setCoordinates("");
                    localStorage.removeItem('uploadFormState');
                    setSuccessMessage("Upload successful! Your report is now in the gallery.");

                    setTimeout(() => {
                        setSuccessMessage("");
                    }, 5000);
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

    const showOnMap = () => {
        saveFormState();
        if (coordinates && coordinates.trim() !== "Coordinates not found" && coordinates.trim() !== "Error converting address") {
            const { lat, lon } = getCoords(coordinates);
            router.push(`/pickedLocation?lat=${lat}&lon=${lon}&locationName=${encodeURIComponent(location)}`);
        } else {
            setSearchStatusMessage("Please find coordinates before showing on map.");
        }
    };

    return (
        <div className={`w-full backdrop-blur-sm rounded-3xl shadow-2xl p-6 ${currentTheme === 'dark' ? 'backdrop-dark text-white' : 'backdrop-light text-black'}`}>
            <h2 className="text-3xl font-bold mb-6">Upload Report</h2>
            <div className="space-y-4">
                {isCameraActive ? (
                    <div className="flex flex-col items-center w-full max-w-md mx-auto">
                        <video
                            ref={videoRef}
                            className="w-full rounded-lg mb-4"
                            autoPlay
                            playsInline
                        ></video>
                        <div className="flex gap-2 w-full">
                            <button
                                onClick={() => setIsCameraActive(false)}
                                className="flex-1 py-2 px-4 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCapturePhoto}
                                className="flex-1 py-2 px-4 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors duration-200"
                            >
                                <FiCamera className="inline-block mr-2" /> Take Photo
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div
                            className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 ${currentTheme === 'dark' ? 'bg-black/30 border-gray-600' : 'bg-white/70 border-gray-300'} ${isDragging ? "border-blue-500 bg-blue-100" : ""}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <FiUpload className={`w-8 h-8 ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                            <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Drag and drop a photo here,</p>
                            <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>or click to choose one.</p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e.target.files[0])}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                key={fileInputKey}
                            />
                        </div>
                        <div className="flex gap-2 justify-center mt-2 w-full max-w-md mx-auto">
                            <button
                                onClick={() => document.querySelector('input[type="file"]').click()}
                                className="flex-1 py-2 px-4 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors duration-200"
                            >
                                Choose Photo
                            </button>
                            <button
                                onClick={startCamera}
                                className="flex-1 py-2 px-4 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors duration-200"
                            >
                                <FiCamera className="inline-block mr-2" /> Take Photo
                            </button>
                        </div>
                    </>
                )}


                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                {preview && (
                    <div className="relative border rounded-lg overflow-hidden">
                        <Image
                            src={preview}
                            alt="preview"
                            width={600}
                            height={400}
                            className="w-full h-auto object-cover"
                        />
                        <button
                            onClick={handleCancelPreview}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full transition-colors duration-200"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
            <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                    <textarea
                        placeholder="Location (Address, City, Zip Code)"
                        className={`flex-1 border rounded-lg p-2 resize-none focus:outline-none focus:ring-2 transition-colors duration-500 ${currentTheme === 'dark' ? 'bg-black/30 text-white placeholder-gray-400' : 'bg-white/70 text-black placeholder-gray-500'}`}
                        value={location}
                        onChange={handleLocationChange}
                        rows="2"
                    />
                    <button
                        type="button"
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                        onClick={handleAutoLocation}
                    >
                        Auto
                    </button>
                    <button
                        type="button"
                        className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm"
                        onClick={onSearchLocation}
                    >
                        Search
                    </button>
                </div>
                <textarea
                    placeholder="Coordinates"
                    className={`flex-1 border rounded-lg p-2 resize-none focus:outline-none focus:ring-2 transition-colors duration-500 ${currentTheme === 'dark' ? 'bg-black/30 text-white placeholder-gray-400' : 'bg-white/70 text-black placeholder-gray-500'}`}
                    value={coordinates}
                    readOnly={true}
                    rows="1"
                />
                {searchStatusMessage && (
                    <p className={`text-sm text-center font-semibold ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>{searchStatusMessage}</p>
                )}
                {apiErrorMessage && (
                    <p className="text-red-500 text-sm text-center">{apiErrorMessage}</p>
                )}
                <button
                    type="button"
                    className="w-full py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 font-semibold transition-colors duration-200"
                    onClick={showOnMap}
                >
                    Show on Map 🗺️
                </button>
                <div className="flex gap-2 items-center text-sm">
                    <label className="font-semibold">Date:</label>
                    <input
                        type="date"
                        className={`border rounded-lg p-1 flex-1 transition-colors duration-500 ${currentTheme === 'dark' ? 'bg-black/30 text-white' : 'bg-white/70 text-black'}`}
                        value={dateValue}
                        onChange={(e) => setDateValue(e.target.value)}
                    />
                    <input
                        type="time"
                        className={`border rounded-lg p-1 flex-1 transition-colors duration-500 ${currentTheme === 'dark' ? 'bg-black/30 text-white' : 'bg-white/70 text-black'}`}
                        value={timeValue}
                        onChange={(e) => setTimeValue(e.target.value)}
                    />
                    <button
                        type="button"
                        className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                        onClick={setCurrentDateTime}
                    >
                        Now
                    </button>
                </div>

                <label className="font-semibold block mt-2 text-lg">Select the Urgency of this Report:</label>
                <div className="flex gap-2">
                    {["Low", "Medium", "High"].map((level) => {
                        const colors = {
                            Low: "bg-green-400 text-green-900",
                            Medium: "bg-yellow-400 text-yellow-900",
                            High: "bg-red-400 text-red-900"
                        };
                        const selectedColors = {
                            Low: "bg-green-600 text-white",
                            Medium: "bg-yellow-600 text-black",
                            High: "bg-red-600 text-white"
                        };
                        return (
                            <button
                                key={level}
                                className={`flex-1 py-2 rounded-lg font-semibold transition-all duration-200 ${pollutionLevel === level ? selectedColors[level] : colors[level]
                                    }`}
                                onClick={() => setPollutionLevel(level)}
                            >
                                {level}
                            </button>
                        );
                    })}
                </div>
                <textarea
                    placeholder="Description"
                    className={`w-full border rounded-lg p-2 resize-none focus:outline-none focus:ring-2 transition-colors duration-500 ${currentTheme === 'dark' ? 'bg-black/30 text-white placeholder-gray-400' : 'bg-white/70 text-black placeholder-gray-500'}`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>
            {progress > 0 && (
                <div className="flex items-center gap-3">
                    <div className="flex-1 w-full bg-gray-200 rounded-full h-3">
                        <div
                            className="bg-green-600 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="bg-red-500 text-white text-sm px-3 py-1 rounded-lg hover:bg-red-600 font-semibold transition-colors duration-200"
                    >
                        Cancel
                    </button>
                </div>
            )}
            <button
                onClick={handleUpload}
                className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 font-semibold transition-colors duration-200"
            >
                Submit Report
            </button>

            {successMessage && (
                <div className="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-100" role="alert">
                    <span className="font-medium">Success!</span> {successMessage}
                </div>
            )}
        </div>
    );
}