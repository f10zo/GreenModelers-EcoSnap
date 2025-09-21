"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import dynamic from 'next/dynamic';
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { FiUpload, FiCamera } from "react-icons/fi";
import { db, storage } from "../../../firebase";
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import imageCompression from 'browser-image-compression';

// Dynamically import the map component
const PickedLocationMap = dynamic(() => import('./PickedLocationMap'), {
    ssr: false,
});

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
const geocodeAddress = async (latitude, longitude, LOCATIONIQ_API_KEY) => {
    if (!latitude || !longitude) return null;
    try {
        const response = await fetch(`https://us1.locationiq.com/v1/reverse.php?key=${LOCATIONIQ_API_KEY}&lat=${latitude}&lon=${longitude}&format=json`);
        if (!response.ok) throw new Error('Failed to fetch location data');
        const data = await response.json();

        if (data.address) {
            const { lat, lon } = data;
            const { road, city, postcode, country } = data.address;
            return { lat, lon, road, city, postcode, country };
        } else {
            return null;
        }
    } catch (error) {
        console.error("Reverse geocoding error:", error);
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

const galileeBeaches = [
    { id: 'amnion-bay', name: 'מפרץ אמנון', lat: 32.89112, lon: 35.596733 },
    { id: 'kinneret', name: 'כינרת', lat: 32.7935, lon: 35.5562 },
    { id: 'duga', name: 'דוגה', lat: 32.8597, lon: 35.6473 },
    { id: 'dugit', name: 'דוגית', lat: 32.8499, lon: 35.6489 },
    { id: 'golan', name: 'גולן', lat: 32.8485, lon: 35.6496 },
    { id: 'tzaalon', name: 'צאלון', lat: 32.8400, lon: 35.6500 },
    { id: 'kursi', name: 'כורסי', lat: 32.8248, lon: 35.6488 },
    { id: 'lebanon', name: 'לבנון', lat: 32.8200, lon: 35.6500 },
    { id: 'halukim', name: 'חלוקים', lat: 32.7980, lon: 35.6190 },
    { id: 'gofra', name: 'גופרה', lat: 32.8033, lon: 35.6436 },
    { id: 'susita', name: 'סוסיתא', lat: 32.7900, lon: 35.6400 },
    { id: 'tzemach', name: 'צמח', lat: 32.7110, lon: 35.5800 },
    { id: 'tzinbari', name: 'צינברי', lat: 32.7400, lon: 35.5700 },
    { id: 'beriniki', name: 'ברניקי', lat: 32.7616, lon: 35.5579 },
    { id: 'shikmim', name: 'שקמים', lat: 32.8680, lon: 35.5750 },
    { id: 'hukuk-north', name: 'חוקוק צפון', lat: 32.8600, lon: 35.5400 },
    { id: 'shizaf-rotem', name: 'שיזף-רותם', lat: 32.8002, lon: 35.6411 },
    { id: 'hanion-haon', name: 'חניון האון', lat: 32.7660, lon: 35.6290 },
    { id: 'hanion-yarden-kinneret', name: 'חניון ירדן כינרת', lat: 32.7060, lon: 35.5890 },
    { id: 'the-diamond', name: 'הדאימונד', lat: 32.8346, lon: 35.6422 },
    { id: 'shitaim', name: 'שיטים', lat: 32.7600, lon: 35.6400 },
    { id: 'deganya', name: 'דגניה', lat: 32.7100, lon: 35.5800 },
    { id: 'hadekel', name: 'הדקל', lat: 32.7670, lon: 35.5450 },
    { id: 'gino', name: 'ג\'ינו', lat: 32.8800, lon: 35.5700 },
    { id: 'sfirit', name: 'ספירית', lat: 32.8800, lon: 35.5800 },
    { id: 'ein-gev-resort', name: 'נופש עין-גב', lat: 32.7830, lon: 35.6260 },
    { id: 'haon-resort', name: 'נופש האון', lat: 32.7660, lon: 35.6290 },
    { id: 'maagan-eden', name: 'מעגן עדן', lat: 32.7210, lon: 35.5990 },
    { id: 'the-separated-beach', name: 'החוף הנפרד', lat: 32.8020, lon: 35.5480 },
    { id: 'hamei-tiberias', name: 'חמי טבריה', lat: 32.7700, lon: 35.5500 },
    { id: 'ganim', name: 'גנים', lat: 32.7800, lon: 35.5500 },
    { id: 'sironit', name: 'סירונית', lat: 32.7930, lon: 35.5450 },
    { id: 'gai', name: 'גיא', lat: 32.7800, lon: 35.5400 },
    { id: 'gali-kinneret-rimonim', name: 'גלי כינרת רימונים', lat: 32.7859, lon: 35.5440 },
    { id: 'the-promenade', name: 'הטיילת', lat: 32.7870, lon: 35.5390 },
    { id: 'shket-leonardo', name: 'שקט לאונרדו', lat: 32.7985, lon: 35.5395 },
    { id: 'hatekhelet', name: 'התכלת', lat: 32.7950, lon: 35.5470 },
    { id: 'raket', name: 'רקת (בורה בורה)', lat: 32.8000, lon: 35.5300 },
    { id: 'green', name: 'גרין', lat: 32.8100, lon: 35.5300 },
    { id: 'restel', name: 'רסטל', lat: 32.8200, lon: 35.5200 },
    { id: 'nof-ginosar', name: 'נוף גינוסר', lat: 32.8444, lon: 35.5228 }
];


export default function UploadForm({ onUploadSuccess }) {
    const router = useRouter();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [manualLocation, setManualLocation] = useState("");
    const [pollutionLevel, setPollutionLevel] = useState("Low");
    const [isMapVisible, setIsMapVisible] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [coordinates, setCoordinates] = useState("");
    const [apiErrorMessage, setApiErrorMessage] = useState("");
    const [searchStatusMessage, setSearchStatusMessage] = useState("");
    const [currentTheme, setCurrentTheme] = useState('light');
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

    const LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY;

    const [status, setStatus] = useState("");


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
                const compressedFile = await imageCompression(f, options);
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

    // Function to load the form's state from local storage
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
        }
    };

    // Function to save the form's state to local storage
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
        };
        localStorage.setItem('uploadFormState', JSON.stringify(state));
    };


    // UseEffect to load the state when the component first mounts
    useEffect(() => {
        loadFormState();
    }, []);

    // UseEffect to save the state whenever a relevant state variable changes
    useEffect(() => {
        saveFormState();
    }, [description, location, manualLocation, pollutionLevel, dateValue, timeValue, coordinates, preview]);


    const showOnMap = () => {
        saveFormState();
        const locationNameForMap = manualLocation || galileeBeaches.find(b => b.id === location)?.name || "";
        if (coordinates && coordinates.trim() !== "Coordinates not found" && coordinates.trim() !== "Error converting address" && coordinates.trim() !== "Error getting real-time coordinates") {
            const { lat, lon } = getCoords(coordinates);
            setIsMapVisible(true);
        } else {
            setSearchStatusMessage("Please find coordinates before showing on map.");
        }
    };

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

        setIsCameraActive(true);

        try {
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


    const handleAutoLocation = () => {
        setApiErrorMessage("");
        setSearchStatusMessage("Getting your current location...");
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const { latitude, longitude } = pos.coords;
                setCoordinates(`Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`);

                try {
                    const response = await fetch(`https://us1.locationiq.com/v1/reverse.php?key=${LOCATIONIQ_API_KEY}&lat=${latitude}&lon=${longitude}&format=json`);
                    const data = await response.json();

                    if (data.address) {
                        const address = data.address;
                        let street = address.road || '';
                        let city = address.city || address.town || address.village || '';
                        const postcode = address.postcode || '';
                        const addressParts = [];

                        if (street) addressParts.push(street);
                        if (city) addressParts.push(city);
                        if (postcode) addressParts.push(postcode);

                        const newLocationName = addressParts.join(', ').trim();
                        setManualLocation(newLocationName || "Unknown Location");
                        setSearchStatusMessage("Location found!");
                    } else {
                        setManualLocation("Unknown Location");
                        setSearchStatusMessage("Location name not found.");
                    }
                } catch (err) {
                    console.error("Reverse geocoding error:", err);
                    setManualLocation("Error getting location name");
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

    const onSearchLocation = async () => {
        if (manualLocation.trim() === "") {
            setSearchStatusMessage("Please enter a location to search.");
            return;
        }
        setSearchStatusMessage("Searching for coordinates...");

        const searchAddress = manualLocation;
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchAddress)}&format=json&bounded=1&viewbox=35.5,32.65,35.7,32.95`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.length > 0) {
                const { lat, lon, display_name } = data[0];
                setCoordinates(`Lat: ${parseFloat(lat).toFixed(5)}, Lon: ${parseFloat(lon).toFixed(5)}`);
                setManualLocation(display_name);
                setSearchStatusMessage("Location found!");
            } else {
                setSearchStatusMessage("No coordinates found for this location.");
                setCoordinates("Coordinates not found");
            }
        } catch (err) {
            console.error("Geocoding error:", err);
            setSearchStatusMessage("Error finding coordinates. Please try again.");
            setCoordinates("Error finding coordinates");
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
                        location: locationToSave,
                        coordinates: coordinates,
                        pollution_level: pollutionLevel,
                        date: `${dateDisplay} ${time}`,
                    });

                    if (onUploadSuccess) onUploadSuccess();

                    setFile(null);
                    setPreview(null);
                    setDescription("");
                    setLocation("");
                    setManualLocation("");
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
    const isDarkMode = currentTheme.includes('dark');

    return (
            <div
                className="w-full max-w-4xl rounded-3xl p-6 relative overflow-y-auto border-2 shadow-2xl transition-colors duration-500"
                style={{
                    backdropFilter: "blur(12px)", // stronger blur for outer container
                    backgroundColor:
                        currentTheme === "dark"
                            ? "rgba(15, 23, 42, 0.7)" // dark semi-transparent
                            : "rgba(255, 255, 255, 0.35)", // light semi-transparent
                    borderColor: currentTheme === "dark" ? "#22c55e" : "#4ade80",
                    color: currentTheme === "dark" ? "#fff" : "#000",
                }}
            >
                {/* Map Modal */}
                {isMapVisible && (
                    <Suspense fallback={<div>Loading map...</div>}>
                        <PickedLocationMap
                            lat={getCoords(coordinates).lat}
                            lon={getCoords(coordinates).lon}
                            locationName={manualLocation || galileeBeaches.find(b => b.id === location)?.name || ""}
                        />
                        <button
                            onClick={() => setIsMapVisible(false)}
                            className="absolute top-4 right-4 z-[1000] p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </Suspense>
                )}

                {/* Header */}
                <h2 className={`text-3xl font-bold mb-6 text-center ${currentTheme === "dark" ? "text-emerald-300" : "text-emerald-700"}`}>
                    <strong>Upload Report</strong>
                </h2>

                {/* Camera / Upload Section */}
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
                                className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 ${currentTheme === 'dark' ? 'bg-black/30 border-gray-600' : 'bg-white/50 border-gray-300'} ${isDragging ? "border-blue-500 bg-blue-100" : ""}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <FiUpload className={`w-8 h-8 transition-colors duration-500 ${currentTheme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'}`} />
                                <p className={`text-sm transition-colors duration-500 ${currentTheme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'}`}>Drag and drop a photo here,</p>
                                <p className={`text-sm transition-colors duration-500 ${currentTheme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'}`}>or click to choose one.</p>
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
                                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2
    ${currentTheme === 'dark' ? 'bg-gray-800 text-emerald-300 border-gray-600 hover:bg-gray-700 focus:ring-emerald-500' : 'bg-white text-emerald-700 border-gray-300 hover:bg-gray-100 focus:ring-emerald-500'}`}
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
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* Location selection, date/time, urgency, description */}
                <div className="flex flex-col gap-3 mt-4">
                    {/* Location & manual input */}
                    <select
                        value={location}
                        onChange={(e) => {
                            const selectedValue = e.target.value;
                            setLocation(selectedValue);
                            const selectedBeach = galileeBeaches.find(beach => beach.id === selectedValue);
                            if (selectedBeach) {
                                setCoordinates(`Lat: ${selectedBeach.lat}, Lon: ${selectedBeach.lon}`);
                                setSearchStatusMessage(`Coordinates for ${selectedBeach.name} updated.`);
                            } else {
                                setCoordinates("");
                                setSearchStatusMessage("");
                            }
                        }}
                        className={`w-full border rounded-lg p-2 focus:outline-none focus:ring-2 transition-colors duration-500 ${currentTheme === 'dark' ? 'bg-black/30 text-emerald-300' : 'bg-white/70 text-emerald-700'}`}
                    >
                        <option value="">Select a Beach</option>
                        {galileeBeaches.map((beach) => (
                            <option key={beach.id} value={beach.id}>{beach.name}</option>
                        ))}
                    </select>

                    <div className="flex gap-2 items-center">
                        <textarea
                            placeholder="Or Enter Location Manually (Address, City, Zip Code)"
                            className={`flex-1 border rounded-lg p-2 resize-none focus:outline-none focus:ring-2 transition-colors duration-500 ${currentTheme === 'dark' ? 'bg-black/30 text-emerald-300 placeholder-gray-400' : 'bg-white/70 text-emerald-700 placeholder-gray-500'}`}
                            value={manualLocation}
                            onChange={(e) => { setManualLocation(e.target.value); setLocation(""); setCoordinates(""); setApiErrorMessage(""); }}
                            rows="2"
                        />
                        <button onClick={handleAutoLocation} className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">Auto</button>
                        <button onClick={() => onSearchLocation(manualLocation)} className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm">Search</button>
                    </div>

                    <div className={`flex-1 p-2 transition-colors duration-500 ${currentTheme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'}`}>
                        {coordinates || "Coordinates:"}
                    </div>
                    
                    {searchStatusMessage && <p className={`text-sm text-center font-semibold ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>{searchStatusMessage}</p>}
                    {apiErrorMessage && <p className="text-red-500 text-sm text-center">{apiErrorMessage}</p>}

                    <button onClick={showOnMap} className="w-full py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 font-semibold transition-colors duration-200">
                        Show on Map 🗺️
                    </button>

                    {/* Date & Time */}
                    <div className="flex gap-2 items-center text-sm">
                        <label className={`font-semibold transition-colors duration-500 ${currentTheme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'}`}>
                            Date:
                        </label>
                        <input type="date" className={`border rounded-lg p-1 flex-1 transition-colors duration-500 ${currentTheme === 'dark' ? 'bg-black/30 text-white' : 'bg-white/70 text-black'}`} value={dateValue} onChange={(e) => setDateValue(e.target.value)} />
                        <input type="time" className={`border rounded-lg p-1 flex-1 transition-colors duration-500 ${currentTheme === 'dark' ? 'bg-black/30 text-white' : 'bg-white/70 text-black'}`} value={timeValue} onChange={(e) => setTimeValue(e.target.value)} />
                        <button type="button" className={`px-3 py-2 text-white rounded-lg text-sm font-bold transition-colors duration-500 ${currentTheme === 'dark' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-emerald-600 hover:bg-emerald-700'}`} onClick={setCurrentDateTime}>Now</button>
                    </div>

                    {/* Urgency */}
                    <label className={`font-semibold block mt-2 text-lg transition-colors duration-500 ${currentTheme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'}`}>
                        Select the Urgency of this Report:
                    </label>
                    <div className="flex gap-2">
                        {["Low", "Medium", "High"].map((level) => {
                            const colors = { Low: "bg-green-400 text-green-900", Medium: "bg-yellow-400 text-yellow-900", High: "bg-red-400 text-red-900" };
                            const selectedColors = { Low: "bg-green-600 text-white", Medium: "bg-yellow-600 text-black", High: "bg-red-600 text-white" };
                            return (
                                <button
                                    key={level}
                                    className={`flex-1 py-2 rounded-lg font-semibold transition-all duration-200 ${pollutionLevel === level ? selectedColors[level] : colors[level]}`}
                                    onClick={() => setPollutionLevel(level)}
                                >
                                    {level}
                                </button>
                            );
                        })}
                    </div>

                    {/* Description */}
                    <textarea
                        placeholder="Description"
                        className={`w-full border rounded-lg p-2 resize-none focus:outline-none focus:ring-2 transition-colors duration-500 ${currentTheme === 'dark' ? 'bg-black/30 text-white placeholder-gray-400' : 'bg-white/70 text-black placeholder-gray-500'}`}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    {/* Progress & Submit */}
                    {progress > 0 && (
                        <div className="flex items-center gap-3">
                            <div className="flex-1 w-full bg-gray-200 rounded-full h-3">
                                <div className="bg-green-600 h-3 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                            <button onClick={handleCancel} className="bg-red-500 text-white text-sm px-3 py-1 rounded-lg hover:bg-red-600 font-semibold transition-colors duration-200">
                                Cancel
                            </button>
                        </div>
                    )}

                    <button onClick={handleUpload} className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 font-semibold transition-colors duration-200">
                        Submit Report
                    </button>

                    {successMessage && (
                        <div className="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-100" role="alert">
                            <span className="font-medium">Success!</span> {successMessage}
                        </div>
                    )}
                </div>
            </div>
    );
}