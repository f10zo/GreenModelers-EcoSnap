'use client';

import React, { useState, useEffect } from "react";
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default icon not showing
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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


  const galileeBeaches = [
    { id: 'amnion-bay', name: 'מפרץ אמנון', english: 'Amnion Bay', lat: 32.89112, lon: 35.596733 },
    { id: 'beriniki', name: 'ברניקי', english: 'Beriniki', lat: 32.7616, lon: 35.5579 },
    { id: 'gai', name: 'גיא', english: 'Gai', lat: 32.78, lon: 35.54 },
    { id: 'ganim', name: 'גנים', english: 'Ganim', lat: 32.7751, lon: 35.5462 },
    { id: 'gilan-kinneret-rimonim', name: 'גלי כינרת רימונים', english: 'Gali Kinneret Rimonim', lat: 32.7859, lon: 35.544 },
    { id: 'golan', name: 'גולן', english: 'Golan', lat: 32.8485, lon: 35.6496 },
    { id: 'gofra', name: 'גופרה', english: 'Gofra', lat: 32.8028, lon: 35.6433 },
    { id: 'gino', name: 'ג\'ינו', english: 'Gino', lat: 32.88, lon: 35.57 },
    { id: 'halukim', name: 'חלוקים', english: 'Halukim', lat: 32.8552, lon: 35.641 },
    { id: 'hanion-haon', name: 'חניון האון', english: 'Haon Parking', lat: 32.7266, lon: 35.6225 },
    { id: 'hanion-yarden-kinneret', name: 'חניון ירדן כינרת', english: 'Jordan Kinneret Parking', lat: 32.7117, lon: 35.576 },
    { id: 'hamei-tiberias', name: 'חמי טבריה', english: 'Hamei Tiberias', lat: 32.7681, lon: 35.5498 },
    { id: 'hadekel', name: 'הדקל', english: 'Hadekel', lat: 32.767, lon: 35.545 },
    { id: 'the-diamond', name: 'הדאימונד', english: 'The Diamond', lat: 32.8346, lon: 35.642 },
    { id: 'hatekhelet', name: 'התכלת', english: 'HaTekhelet', lat: 32.7939, lon: 35.5422 },
    { id: 'deganya', name: 'דגניה', english: 'Deganya', lat: 32.7087, lon: 35.5789 },
    { id: 'duga', name: 'דוגה', english: 'Duga', lat: 32.85966, lon: 35.64741 },
    { id: 'dugit', name: 'דוגית', english: 'Dugit', lat: 32.8499, lon: 35.6489 },
    { id: 'haon-resort', name: 'נופש האון', english: 'Haon Resort', lat: 32.7243, lon: 35.6188 },
    { id: 'ein-gev-resort', name: 'נופש עין-גב', english: 'Ein Gev Resort', lat: 32.7681, lon: 35.6393 },
    { id: 'nof-ginosar', name: 'נוף גינוסר', english: 'Nof Ginosar', lat: 32.85, lon: 35.52 },
    { id: 'lebanon', name: 'לבנון', english: 'Lebanon', lat: 32.82, lon: 35.65 },
    { id: 'kinneret', name: 'כינרת', english: 'Kinneret', lat: 32.7846, lon: 35.5416 },
    { id: 'kursi', name: 'כורסי', english: 'Kursi', lat: 32.8247, lon: 35.6483 },
    { id: 'maagan-eden', name: 'מעגן עדן', english: 'Maagan Eden', lat: 32.7081, lon: 35.5996 },
    { id: 'shizaf-rotem', name: 'שיזף-רותם', english: 'Shizaf-Rotem', lat: 32.8002, lon: 35.6411 },
    { id: 'shikmim', name: 'שקמים', english: 'Shikmim', lat: 32.8611, lon: 35.5586 },
    { id: 'shket-leonardo', name: 'שקט לאונרדו', english: 'Shket Leonardo', lat: 32.7984, lon: 35.5395 },
    { id: 'shitaim', name: 'שיטים', english: 'Shitaim', lat: 32.76, lon: 35.64 },
    { id: 'sironit', name: 'סירונית', english: 'Sironit', lat: 32.784, lon: 35.5403 },
    { id: 'susita', name: 'סוסיתא', english: 'Susita', lat: 32.7905, lon: 35.6402 },
    { id: 'sfirit', name: 'ספירית', english: 'Sfirit', lat: 32.8859, lon: 35.583 },
    { id: 'tzaalon', name: 'צאלון', english: 'Tzaalon', lat: 32.84, lon: 35.65 },
    { id: 'tzemach', name: 'צמח', english: 'Tzemach', lat: 32.7057, lon: 35.5853 },
    { id: 'tzinbari', name: 'צינברי', english: 'Tzinbari', lat: 32.7365, lon: 35.5696 },
    { id: 'the-separated-beach', name: 'החוף הנפרד', english: 'The Separated Beach', lat: 32.7662, lon: 35.5541 },
    { id: 'the-promenade', name: 'הטיילת', english: 'The Promenade', lat: 32.787, lon: 35.539 },
    { id: 'raket', name: 'רקת (בורה בורה)', english: 'Raket (Bora Bora)', lat: 32.8, lon: 35.53 },
    { id: 'restel', name: 'רסטל', english: 'Restel', lat: 32.8242, lon: 35.5166 }
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

    // Observe changes to the class attribute of <html>
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Clean up when component unmounts
    return () => {
      observer.disconnect();
    };
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


        {isMapVisible && lat != null && lon != null && (
          <div className="relative mt-2 w-full h-64 rounded-lg overflow-hidden shadow-lg">
            {/* Close button */}
            <button
              onClick={() => setIsMapVisible(false)}
              className="absolute top-2 right-2 z-[1000] bg-white text-red-600 font-bold rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-100"
              title="Close map"
            >
              ❌
            </button>

            <MapContainer center={[lat, lon]} zoom={15} style={{ width: '100%', height: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={[lat, lon]} />
            </MapContainer>
          </div>
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