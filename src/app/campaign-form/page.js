'use client';

import React, { useState, useEffect } from "react";
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function PublishCampaignForm() {

  const [manualLocation, setManualLocation] = useState('');
  const [selectedBeach, setSelectedBeach] = useState('');
  const [coordinates, setCoordinates] = useState('');
  const [searchStatusMessage, setSearchStatusMessage] = useState('');
  const [apiErrorMessage, setApiErrorMessage] = useState('');

  // The list of beaches is now shorter as requested.
  const galileeBeaches = [
    { "id": "amnion-bay", "name": "מפרץ אמנון", "lat": 32.89111, "lon": 35.59358 },
    { "id": "kinneret", "name": "כינרת", "lat": 32.72379, "lon": 35.56524 },
    { "id": "duga", "name": "דוגה", "lat": 32.8597, "lon": 35.6473 },
    { "id": "kursi", "name": "כורסי", "lat": 32.8261, "lon": 35.6502 },
    { "id": "susita", "name": "סוסיתא", "lat": 32.7900, "lon": 35.6400 },
    { "id": "tzemach", "name": "צמח", "lat": 32.7110, "lon": 35.5800 },
    { "id": "beriniki", "name": "ברניקי", "lat": 32.7616, "lon": 35.5579 },
  ];

  const GEOAPIFY_API_KEY = "798aff4296834f94ae8593ec7f2146b5";

  // Auto-detect location
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

  // Search coordinates from manual input using Geoapify
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
  // --- NEW STATE FOR IMAGE UPLOAD ---
  const [imageFile, setImageFile] = useState(null);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };


  const [currentTheme, setCurrentTheme] = useState('light');
  const [status, setStatus] = useState("");

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newTheme = document.documentElement.className;
      setCurrentTheme(newTheme);
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const [formData, setFormData] = useState({
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Publishing campaign...");

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
      // --- RESET IMAGE STATE AFTER SUCCESSFUL SUBMISSION ---
      setImageFile(null);
    } catch (error) {
      console.error("Error submitting campaign:", error);
      setStatus("❌ Failed to publish campaign. Please try again.");
    }
  };

  const isDarkMode = currentTheme === 'dark';

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

        {/* Date & Time */}
        <div className="flex gap-2">
          <input
            type="text"
            name="date"
            placeholder="DD/MM/YYYY"
            value={formData.date}
            onChange={handleChange}
            onFocus={(e) => e.target.type = 'date'}
            onBlur={(e) => { if (!e.target.value) e.target.type = 'text' }}
            className={`w-full p-2 rounded-lg border transition-colors duration-500 ${isDarkMode ? 'border-emerald-500 bg-slate-700 text-gray-200 placeholder-emerald-300' : 'border-emerald-300 bg-white/70 text-gray-800 placeholder-emerald-700'}`}
            required
          />
          <input
            type="text"
            name="time"
            placeholder="--:--"
            value={formData.time}
            onChange={handleChange}
            onFocus={(e) => e.target.type = 'time'}
            onBlur={(e) => { if (!e.target.value) e.target.type = 'text' }}
            className={`w-full p-2 rounded-lg border transition-colors duration-500 ${isDarkMode ? 'border-emerald-500 bg-slate-700 text-gray-200 placeholder-emerald-300' : 'border-emerald-300 bg-white/70 text-gray-800 placeholder-emerald-700'}`}
            required
          />
          <button
            type="button"
            className={`px-2 py-1 rounded-lg text-sm transition-colors duration-500 ${isDarkMode ? 'bg-emerald-700 text-white hover:bg-emerald-600' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
            onClick={() => {
              const now = new Date();
              setFormData(prev => ({
                ...prev,
                date: now.toISOString().split('T')[0],
                time: now.toTimeString().slice(0, 5)
              }));
            }}
          >
            Now
          </button>
        </div>

        {/* Beach Selection */}
        <select
          value={selectedBeach}
          onChange={handleBeachChange}
          className={`w-full p-2 rounded-lg border transition-colors duration-500 ${isDarkMode ? 'border-emerald-500 bg-slate-700 text-gray-200' : 'border-emerald-300 bg-white/70 text-gray-800'}`}
        >
          <option value="" className={`${isDarkMode ? 'bg-slate-700 text-emerald-300' : 'bg-white/70 text-emerald-700'}`}>Select a Beach</option>
          {galileeBeaches.map(beach => (
            <option key={beach.id} value={beach.id} className={`${isDarkMode ? 'bg-slate-700 text-gray-200' : 'bg-white/70 text-gray-800'}`}>{beach.name}</option>
          ))}
        </select>

        {/* Manual Location */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Or enter location manually"
            value={manualLocation}
            onChange={e => {
              setManualLocation(e.target.value);
              setSelectedBeach('');
              setCoordinates('');
              setFormData(prev => ({ ...prev, locationLat: null, locationLon: null, location: e.target.value }));
            }}
            className={`flex-1 p-2 rounded-lg border transition-colors duration-500 ${isDarkMode ? 'border-emerald-500 bg-slate-700 text-gray-200 placeholder-emerald-300' : 'border-emerald-300 bg-white/70 text-gray-800 placeholder-emerald-700'}`}
          />
          <button
            type="button"
            className={`px-3 py-1 rounded-lg text-sm transition-colors duration-500 ${isDarkMode ? 'bg-emerald-700 text-white hover:bg-emerald-600' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
            onClick={handleAutoLocation}
          >
            Auto
          </button>
          <button
            type="button"
            className={`px-3 py-1 rounded-lg text-sm transition-colors duration-500 ${isDarkMode ? 'bg-emerald-700 text-white hover:bg-emerald-600' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
            onClick={onSearchLocation}
          >
            Search
          </button>
        </div>
        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{coordinates}</div>
        <div className={`text-xs ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>{searchStatusMessage}</div>
        <div className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{apiErrorMessage}</div>

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
          <input type="file" accept="image/*" onChange={handleImageChange} className="absolute w-full h-full opacity-0 cursor-pointer" />
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