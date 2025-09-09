"use client";

import React, { useState, useEffect, useRef } from "react";
import { db, storage } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { FiUpload, FiCamera } from "react-icons/fi";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from 'next/navigation';

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

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [pollutionLevel, setPollutionLevel] = useState("Low");
  const [gallery, setGallery] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [coordinates, setCoordinates] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [showNavOptions, setShowNavOptions] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState("");
  const [searchStatusMessage, setSearchStatusMessage] = useState("");

  const { dateInput, time } = getCurrentDateTime();
  const [dateValue, setDateValue] = useState(dateInput);
  const [timeValue, setTimeValue] = useState(time);

  const [filterPollution, setFilterPollution] = useState("All");
  const [dateSort, setDateSort] = useState("newest");

  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const [currentUploadTask, setCurrentUploadTask] = useState(null);

  const [isDragging, setIsDragging] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const videoStreamRef = useRef(null);

  const GEOAPIFY_API_KEY = "798aff4296834f94ae8593ec7f2146b5";

  // This function saves all form state to your browser's local storage.
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

  // This function loads the form state from local storage.
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

  // This effect runs ONCE when the page loads to check for any previously saved data.
  useEffect(() => {
    loadFormState();
    fetchGallery();
  }, []);

  // This effect runs every time a key form field changes, automatically saving the data.
  useEffect(() => {
    saveFormState();
  }, [description, location, pollutionLevel, dateValue, timeValue, coordinates, preview, saveFormState]); // Fix here: Added saveFormState to dependencies

  const fetchGallery = async () => {
    try {
      const q = query(collection(db, "reports"), orderBy("date", "desc"));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((doc) => doc.data());
      setGallery(items);
    } catch (err) {
      console.error("Error fetching gallery:", err);
    }
  };

  const setCurrentDateTime = () => {
    const { dateInput, time } = getCurrentDateTime();
    setDateValue(dateInput);
    setTimeValue(time);
  };

  const handleFileChange = (f) => {
    if (f) {
      setFile(f);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(f);
      setIsCameraActive(false);
    } else {
      setFile(null);
      setPreview(null);
    }
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
      alert("Your browser does not support camera access. Please use a different browser like Chrome, Firefox, or Safari.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      videoRef.current.srcObject = stream;
      videoStreamRef.current = stream;
      setIsCameraActive(true);
    } catch (err) {
      console.error("Camera access denied or error:", err);
      alert("Could not access the camera. Please check your browser's permissions for this site and ensure no other application is using the camera.");
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

  const geocodeAddress = async (address) => {
    if (!address) return;
    try {
      const response = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${GEOAPIFY_API_KEY}`);
      if (!response.ok) throw new Error('Failed to fetch coordinates');
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const { lat, lon, street, housenumber, postcode, city } = data.features[0].properties;
        setCoordinates(`Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`);
        setApiErrorMessage("");
        // Return the specific properties
        return { lat, lon, street, housenumber, postcode, city };
      } else {
        setCoordinates("Coordinates not found");
        setApiErrorMessage("Location not found. Please try a different address.");
        return null;
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setCoordinates("Error converting address");
      setApiErrorMessage("Error. Please check your API key and network connection.");
      return null;
    }
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
    geocodeAddress(location).then((data) => {
      if (data) {
        setSearchStatusMessage("Coordinates updated.");
        // The geocodeAddress function will now return the specific properties
        const { street, housenumber, city, postcode } = data;
        const newLocation = `${street || ''} ${housenumber || ''}, ${city || ''}, ${postcode || ''}`.trim().replace(/^,/, '').trim();
        setLocation(newLocation || location);
      } else {
        setSearchStatusMessage("Error finding coordinates.");
      }
    }).catch(() => {
      setSearchStatusMessage("Error finding coordinates.");
    });
  };

  const handleCoordinatesChange = (e) => {
    const newCoords = e.target.value;
    setCoordinates(newCoords);
  };

  const handleAutoLocation = () => {
    setApiErrorMessage("");
    setSearchStatusMessage("Getting your current location...");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoordinates(`Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`);

        try {
          const response = await fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=${GEOAPIFY_API_KEY}`);
          const data = await response.json();
          if (data.features && data.features.length > 0) {
            const properties = data.features[0].properties;
            const street = properties.street || '';
            const houseNumber = properties.housenumber || '';
            const city = properties.city || '';
            const postcode = properties.postcode || '';

            // Construct the desired string: Address, City, Zip Code
            const newLocation = `${street} ${houseNumber}, ${city}, ${postcode}`.trim().replace(/^,/, '').trim();

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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (location.trim() !== "") {
        setSearchStatusMessage("Searching for coordinates...");
        geocodeAddress(location).then(() => {
          setSearchStatusMessage("Coordinates updated.");
        }).catch(() => {
          setSearchStatusMessage("Error finding coordinates.");
        });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [location]);

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
          fetchGallery();
          setFile(null);
          setPreview(null);
          setDescription("");
          setLocation("");
          setPollutionLevel("Low");
          setProgress(0);
          setFileInputKey(Date.now());
          setCurrentUploadTask(null);
          setCoordinates("");

          // Clear the form's local storage data on successful upload
          localStorage.removeItem('uploadFormState');
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

  const showOnMap = () => {
    // This line saves all your form data to the browser before navigating
    saveFormState();
    if (coordinates && coordinates.trim() !== "Coordinates not found" && coordinates.trim() !== "Error converting address") {
      const { lat, lon } = getCoords(coordinates);
      router.push(`/pickedLocation?lat=${lat}&lon=${lon}&locationName=${encodeURIComponent(location)}`);
    } else {
      setSearchStatusMessage("Please find coordinates before showing on map.");
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-screen-xl">
        <div className="w-full backdrop-blur-sm bg-white/30 rounded-3xl shadow-2xl p-6 text-black md:col-span-1 lg:col-span-1">
          <h2 className="text-3xl font-bold mb-6">Upload Report</h2>
          <div className="space-y-4">
            {isCameraActive ? (
              <div className="flex flex-col items-center">
                <video ref={videoRef} className="w-full rounded-lg mb-4"></video>
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
                  className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 bg-white/70 ${isDragging ? "border-blue-500 bg-blue-100" : "border-gray-300"}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <FiUpload className="text-gray-500 w-8 h-8" />
                  <p className="text-gray-500 text-sm">Drag and drop a photo here,</p>
                  <p className="text-gray-500 text-sm">or click to choose one.</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      try {
                        handleFileChange(e.target.files[0]);
                      } catch (error) {
                        console.error("Error in file change handler:", error);
                        // You might also want to display a message to the user
                        alert("An error occurred. Please try again.");
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    key={fileInputKey}
                  />
                </div>
                <div className="flex gap-2 justify-center mt-2">
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
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <textarea
                  placeholder="Location (Address, City, Zip Code)"
                  className="flex-1 border rounded-lg p-2 bg-white/70 resize-none"
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
                className="flex-1 border rounded-lg p-2 bg-white/70 resize-none"
                value={coordinates}
                readOnly={true}
                rows="1"
              />
              {searchStatusMessage && (
                <p className="text-sm text-center font-semibold text-gray-700">{searchStatusMessage}</p>
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
                  className="border rounded-lg p-1 flex-1 bg-white/70"
                  value={dateValue}
                  onChange={(e) => setDateValue(e.target.value)}
                />
                <input
                  type="time"
                  className="border rounded-lg p-1 flex-1 bg-white/70"
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
              <label className="font-semibold block mt-2">Urgency of the pollution:</label>
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
                className="w-full border rounded-lg p-2 resize-none bg-white/70"
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
          </div>
        </div>
        <div className="w-full backdrop-blur-sm bg-white/30 rounded-3xl shadow-2xl p-6 text-black md:col-span-1 lg:col-span-2">
          <h2 className="text-3xl font-bold mb-6">📸 Gallery</h2>
          <div className="mb-4">
            <Link href="/map">
              <button className="py-2 px-4 rounded-lg bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-colors duration-200 w-full">
                View Reports on Map 🗺️
              </button>
            </Link>
          </div>
          <div className="flex gap-4 mb-6">
            <select
              className="flex-1 border rounded-lg p-2 font-semibold bg-white/70"
              value={filterPollution}
              onChange={(e) => setFilterPollution(e.target.value)}
            >
              <option>All</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
            <select
              className="flex-1 border rounded-lg p-2 font-semibold bg-white/70"
              value={dateSort}
              onChange={(e) => setDateSort(e.target.value)}
            >
              <option value="newest">Newest → Oldest</option>
              <option value="oldest">Oldest → Newest</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[70vh] pr-2">
            {filteredGallery.map((item, i) => (
              <div key={i} className="bg-white/50 shadow-lg rounded-xl overflow-hidden transform transition-transform duration-300 hover:scale-105">
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
                  <p className="text-xs text-gray-600 mt-1">
                    📍 {item.location}
                  </p>
                  <div className="flex items-center text-xs text-gray-600 mt-1">
                    <span className={`w-3 h-3 rounded-full mr-2 ${item.pollution_level === 'Low' ? 'bg-green-500' : item.pollution_level === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                    {item.pollution_level} | {item.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full backdrop-blur-sm bg-white/30 shadow-lg rounded-3xl p-6 overflow-y-auto text-black md:col-span-2 lg:col-span-3">
          <h3 className="text-2xl font-extrabold mb-4 text-blue-800">Keep Our Lake Clean!</h3>
          <p className="mb-4 text-sm text-gray-800 leading-relaxed">
            <strong className="text-base text-green-700">Every action helps!</strong> Let&apos;s protect our natural resources together.
          </p>
          <div className="space-y-4">
            <div>
              <h4 className="text-xl font-bold mb-2 text-purple-700">1. Volunteer for Cleanup</h4>
              <p className="text-sm leading-relaxed">
                Join local **cleanup groups** to make a **tangible difference** in the health of our environment.
              </p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-2 text-orange-700">2. Reduce Plastic Use</h4>
              <p className="text-sm leading-relaxed">
                Choose **reusable items** over single-use plastics like bottles and bags to protect aquatic life.
              </p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-2 text-teal-700">3. Report and Share Info</h4>
              <p className="text-sm leading-relaxed">
                The information you upload is crucial. **Share it with authorities** to prompt effective action against pollution.
              </p>
            </div>
          </div>
          <p className="mt-4 text-base italic text-gray-900 font-semibold text-center">
            Together, we can ensure the lake remains vibrant and healthy!
          </p>
        </div>
      </div>
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={handleCloseModal}
        >
          <div
            className="relative flex flex-col rounded-lg shadow-lg max-h-[90vh] max-w-[90vw] bg-white/95 backdrop-blur-md p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedImage.imageUrl}
              alt="Enlarged view"
              width={600}
              height={400}
              className="rounded-lg max-h-[60vh] object-contain"
            />
            <div className="mt-4 text-center text-black">
              <p className="font-bold text-lg">{selectedImage.description}</p>
              <p className="text-sm text-gray-700 mt-1">📍 {selectedImage.location}</p>
              <p className="text-xs text-gray-500 mt-1">
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
                    <div className="absolute bottom-full mb-2 w-48 bg-white rounded-lg shadow-lg overflow-hidden">
                      <a
                        href={`https://waze.com/ul?ll=${getCoords(selectedImage.coordinates).lat},${getCoords(selectedImage.coordinates).lon}&navigate=yes`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleCloseModal}
                        className="flex items-center gap-2 p-3 w-full text-left text-gray-800 hover:bg-gray-100 transition-colors"
                      >
                        <Image src="https://www.waze.com/favicon.ico" alt="Waze logo" width={10} height={10} className="w-5 h-5" />                        Waze
                      </a>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${getCoords(selectedImage.coordinates).lat},${getCoords(selectedImage.coordinates).lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleCloseModal}
                        className="flex items-center gap-2 p-3 w-full text-left text-gray-800 hover:bg-gray-100 transition-colors"
                      >
                        <Image src="https://www.google.com/images/branding/product/2x/maps_96dp.png" alt="Google Maps logo" width={32} height={32} className="w-8 h-8" />                        Google Maps
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
    </main>
  );
}