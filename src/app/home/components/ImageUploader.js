// src/app/home/components/ImageUploader.js
"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { FiUpload, FiCamera } from "react-icons/fi";
import * as piexif from 'piexifjs';


// Helper function to convert File/Blob to DataURL using native API
const fileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

// A simple function to get the current location
const getCurrentGpsLocation = () => {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            console.log("Getting geolocation...");
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    };
                    console.log("GPS coordinates obtained:", coords);
                    resolve(coords);
                },
                (error) => {
                    console.error("Geolocation Error:", error.code, error.message);
                    reject(new Error("Could not retrieve GPS location."));
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            reject(new Error("Geolocation is not supported by this browser."));
        }
    });
};

// Component to handle image upload, preview, and camera capture
export default function ImageUploader({
    handleImageChange,
    preview,
    lat,
    lon,
    currentTheme,
    fileInputKey,
    setFileInputKey,
}) {
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const videoStreamRef = useRef(null);

    // Log the received props
    console.log("ImageUploader received props:", { lat, lon });

    // Update the GPS display check in your JSX
    const renderGpsInfo = () => {
        // Use strict type checking
        if (typeof lat === 'number' && typeof lon === 'number') {
            return (
                <p className="text-sm mt-2 text-center text-green-600">
                    📍 Location detected: <strong>{lat.toFixed(6)}, {lon.toFixed(6)}</strong>
                </p>
            );
        }

        // Only show warning if we have a preview but no GPS
        if (preview) {
            return (
                <p className="text-sm mt-2 text-center text-amber-600">
                    ⚠️ Setting location...
                </p>
            );
        }
        return null;
    };

    const handleFileChange = async (f) => {
        if (!f) {
            await handleImageChange(null, null);
            return;
        }

        try {
            const originalFile = f;
            const dataUrl = await fileToDataUrl(originalFile);

            let gps = null;

            if (originalFile.type === "image/jpeg") {
                try {
                    const GPSLatitude = 2;
                    const GPSLongitude = 4;
                    const GPSLatitudeRef = 1;
                    const GPSLongitudeRef = 3;

                    const exifObj = piexif.load(dataUrl);

                    console.log("--- DEBUG: EXIF Object Keys ---", Object.keys(exifObj));

                    const gpsData = exifObj["GPS"];

                    // Helper to convert EXIF GPS rational numbers (arrays of [numerator, denominator]) to decimal
                    const dmsToDecimal = (dms, ref) => {
                        const getFloat = (rational) => {
                            if (!rational || rational.length < 2 || typeof rational[0] !== 'number' || typeof rational[1] !== 'number') {
                                console.error("Malformed rational number array:", rational);
                                return 0;
                            }
                            if (rational[1] === 0) {
                                console.error("Division by zero in rational number:", rational);
                                return 0;
                            }
                            return rational[0] / rational[1];
                        };

                        // Structural check
                        if (!dms || dms.length < 3 || !Array.isArray(dms[0])) {
                            console.error("Malformed DMS array structure:", dms);
                            return NaN;
                        }

                        try {
                            const degVal = getFloat(dms[0]);
                            const minVal = getFloat(dms[1]);
                            const secVal = getFloat(dms[2]);

                            console.log(`DEBUG: Calculated values (DMS): ${degVal}, ${minVal}, ${secVal}`);

                            let dec = degVal + minVal / 60 + secVal / 3600;
                            const cleanRef = String(ref).replace(/[^\w]/g, '').toUpperCase();

                            if (cleanRef === "S" || cleanRef === "W") dec = -dec;

                            return dec;
                        } catch (e) {
                            console.error("Parsing failure in dmsToDecimal:", e);
                            return NaN;
                        }
                    };

                    if (gpsData) {
                        console.log("--- DEBUG: Raw GPS Data Found ---", gpsData);

                        // --- CRITICAL FIX START ---
                        const rawLat = gpsData[GPSLatitude];
                        const rawLon = gpsData[GPSLongitude];

                        let lat = NaN;
                        let lon = NaN;

                        if (rawLat) {
                            lat = dmsToDecimal(rawLat, gpsData[GPSLatitudeRef]);
                        } else {
                            console.warn("Raw Latitude data (tag 2) is missing from EXIF GPS block.");
                        }

                        if (rawLon) {
                            lon = dmsToDecimal(rawLon, gpsData[GPSLongitudeRef]);
                        } else {
                            console.warn("Raw Longitude data (tag 4) is missing from EXIF GPS block.");
                        }
                        // --- CRITICAL FIX END ---

                        if (typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon)) {
                            gps = { lat, lon };
                        } else {
                            console.warn("GPS data found, but coordinates could not be parsed.");
                        }

                    } else {
                        console.warn("No GPS data found in image EXIF.");
                    }

                } catch (exifErr) {
                    console.error("EXIF read failed:", exifErr);
                }
            }

            await handleImageChange(originalFile, dataUrl, gps?.lat, gps?.lon);

            setIsCameraActive(false);

        } catch (error) {
            console.error("File processing failed:", error);
            alert("There was an error processing the image. Please try a different file.");
            await handleImageChange(null, null);
        }
    };

    // Helper to receive files from input, drag/drop, or camera capture
    const handleFileInput = (event) => {
        const f = event.target.files[0];
        if (f) {
            handleFileChange(f);
        }
    };

    // --- Camera Logic ---
    const startCamera = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Your browser does not support camera access.");
            return;
        }
        setIsCameraActive(true);
        // Stop any running streams when starting a new one
        if (videoStreamRef.current) {
            videoStreamRef.current.getTracks().forEach(track => track.stop());
        }
        try {
            // Wait briefly for potential stream cleanup
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
        // Cleanup function for camera stream when component unmounts
        return () => {
            if (videoStreamRef.current) {
                videoStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Update the handleCapturePhoto function
    const handleCapturePhoto = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
            const capturedFile = new File([blob], "captured_photo.jpeg", { type: "image/jpeg" });

            // Get GPS location first
            let gps = null;
            try {
                gps = await getCurrentGpsLocation();
                console.log("GPS obtained:", gps);
            } catch (err) {
                console.warn("GPS acquisition failed:", err);
            }

            const dataUrl = await fileToDataUrl(capturedFile);

            // Stop video stream
            if (videoStreamRef.current) {
                videoStreamRef.current.getTracks().forEach(track => track.stop());
            }

            // Pass data to parent
            await handleImageChange(
                capturedFile,
                dataUrl,
                gps?.latitude || null,
                gps?.longitude || null
            );

            setIsCameraActive(false);
        }, "image/jpeg");
    };

    const handleCancelPreview = async () => {
        await handleImageChange(null, null);
        setFileInputKey(prev => prev + 1);
        setIsCameraActive(false);
    };

    // --- Drag & Drop Logic ---
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (!droppedFile || !droppedFile.type.startsWith("image/")) {
            alert("Please drop an image file.");
            return;
        }
        await handleFileChange(droppedFile);
    };

    // --- Paste Listener ---
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


    return (
        <div className="space-y-4">

            {/* 🛑 FIX: Only show Camera or Upload controls IF a picture is NOT yet previewed 🛑 */}
            {!preview && (
                <>
                    {isCameraActive ? (
                        <div className="flex flex-col items-center w-full max-w-md mx-auto">
                            <div className="relative w-full">
                                <video
                                    ref={videoRef}
                                    className="w-full rounded-lg mb-4"
                                    autoPlay
                                    playsInline
                                ></video>
                                {/* Add capture button overlay */}
                                <button
                                    onClick={handleCapturePhoto}
                                    className="absolute bottom-8 left-1/2 transform -translate-x-1/2
                                        w-16 h-16 rounded-full bg-white border-4 border-green-500
                                        flex items-center justify-center
                                        hover:bg-green-50 transition-colors duration-200"
                                    title="Capture photo"
                                >
                                    <FiCamera className="w-8 h-8 text-green-500" />
                                </button>
                            </div>
                            <div className="flex gap-2 w-full">
                                <button
                                    onClick={() => {
                                        setIsCameraActive(false);
                                        if (videoStreamRef.current) {
                                            videoStreamRef.current.getTracks().forEach(track => track.stop());
                                        }
                                    }}
                                    className="flex-1 py-2 px-4 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div
                                className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 ${currentTheme === 'dark' ? 'bg-black/30 border-gray-600' : 'bg-white/50 border-gray-300'} ${isDragging ? "border-blue-500 bg-blue-100" : ""}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <FiUpload className={`w-8 h-8 transition-colors duration-500 ${currentTheme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'}`} />
                                <p className={`text-sm transition-colors duration-500 ${currentTheme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'}`}>Drag and drop or paste a photo here,</p>
                                <p className={`text-sm transition-colors duration-500 ${currentTheme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'}`}>or click to choose one.</p>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileInput} // <-- Use the new handler here
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    key={fileInputKey}
                                />
                            </div>
                            {/* Add the GPS display right after the upload div */}
                            {renderGpsInfo()}

                            <div className="flex gap-2 justify-center mt-2 w-full max-w-md mx-auto">
                                <button
                                    // Trigger the hidden file input click
                                    onClick={() => document.querySelector('input[type="file"]').click()}
                                    type="button" // Important for forms
                                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2
                                    ${currentTheme === 'dark' ? 'bg-gray-800 text-emerald-300 border-gray-600 hover:bg-gray-700 focus:ring-emerald-500' : 'bg-white text-emerald-700 border-gray-300 hover:bg-gray-100 focus:ring-emerald-500'}`}
                                >
                                    Choose Photo
                                </button>
                                <button
                                    onClick={startCamera}
                                    type="button" // Important for forms
                                    className="flex-1 py-2 px-4 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors duration-200"
                                >
                                    <FiCamera className="inline-block mr-2" /> Take Photo
                                </button>
                            </div>
                        </>
                    )}
                </>
            )}

            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

            {/* This block displays the image and location info WHEN 'preview' is set */}
            {preview && (
                <div className="relative border rounded-lg overflow-hidden mt-4">
                    {/* 🛑 FIX: The GPS info should be displayed near the image when it's the main view */}
                    {renderGpsInfo()}

                    <Image
                        src={preview}
                        alt="preview"
                        width={600}
                        height={400}
                        className="w-full h-auto object-cover"
                    />
                    <button
                        onClick={handleCancelPreview}
                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors duration-200"
                        title="Remove photo"
                    >
                        &times;
                    </button>
                </div>
            )}
        </div>
    );
}