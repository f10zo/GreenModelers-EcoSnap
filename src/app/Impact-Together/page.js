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

  const [currentTheme, setCurrentTheme] = useState('light');
  const [status, setStatus] = useState("");

  // --- NEW STATE FOR IMAGE UPLOAD ---
  const [imageFile, setImageFile] = useState(null);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
        setImageFile(e.target.files[0]);
    }
  };

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

    // --- NEW LOGIC TO UPLOAD IMAGE ---
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
    // --- END NEW LOGIC ---

    try {
      await addDoc(collection(db, "campaigns"), {
        ...formData,
        volunteersNeeded: Number(formData.volunteersNeeded),
        createdAt: serverTimestamp(),
        // --- ADD THE IMAGE URL TO THE DOCUMENT ---
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

  const isDarkMode = currentTheme.includes('dark');

  return (
    <div className={`max-w-3xl mx-auto backdrop-blur-md p-6 rounded-3xl shadow-xl transition-colors duration-500 ${isDarkMode ? 'bg-slate-800/80' : 'bg-white/30'}`}>
      <h2 className={`text-3xl font-bold mb-4 text-center mt-3 transition-colors duration-500 ${isDarkMode ? 'text-white-300' : 'text-gray-700'}`}>
        📢 Publish a Volunteer Campaign
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="campaignName"
          placeholder="Campaign Name"
          value={formData.campaignName}
          onChange={handleChange}
          className={`w-full p-3 rounded-lg border transition-colors duration-500 ${isDarkMode ? 'border-gray-600 bg-slate-700 text-gray-200' : 'border-gray-300 bg-white/70 text-gray-800'}`}
          required
        />

        <input
          type="text"
          name="organizer"
          placeholder="Organizer Name / Contact"
          value={formData.organizer}
          onChange={handleChange}
          className={`w-full p-3 rounded-lg border transition-colors duration-500 ${isDarkMode ? 'border-gray-600 bg-slate-700 text-gray-200' : 'border-gray-300 bg-white/70 text-gray-800'}`}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className={`w-full p-3 rounded-lg border transition-colors duration-500 ${isDarkMode ? 'border-gray-600 bg-slate-700 text-gray-200' : 'border-gray-300 bg-white/70 text-gray-800'}`}
            required
          />
          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            className={`w-full p-3 rounded-lg border transition-colors duration-500 ${isDarkMode ? 'border-gray-600 bg-slate-700 text-gray-200' : 'border-gray-300 bg-white/70 text-gray-800'}`}
            required
          />
        </div>

        <div className="mb-4 flex flex-col gap-2">
          {/* Beach Dropdown */}
          <select
            value={selectedBeach}
            onChange={handleBeachChange}
            className={`w-full p-3 rounded-lg border transition-colors duration-500 ${isDarkMode ? 'border-gray-600 bg-slate-700 text-gray-200' : 'border-gray-300 bg-white/70 text-gray-800'}`}
          >
            <option value="">Select a Beach</option>
            {galileeBeaches.map(beach => (
              <option key={beach.id} value={beach.id}>{beach.name}</option>
            ))}
          </select>

          {/* Manual input */}
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Or enter location manually"
              value={manualLocation}
              onChange={e => {
                setManualLocation(e.target.value);
                setSelectedBeach('');
                setCoordinates('');
                setFormData(prev => ({
                  ...prev,
                  locationLat: null,
                  locationLon: null,
                  location: e.target.value
                }));
              }}
              className={`w-full p-3 rounded-lg border transition-colors duration-500 flex-1 ${isDarkMode ? 'border-gray-600 bg-slate-700 text-gray-200' : 'border-gray-300 bg-white/70 text-gray-800'}`}
            />
            <button type="button" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600" onClick={handleAutoLocation}>Auto</button>
            <button type="button" className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600" onClick={onSearchLocation}>Search</button>
          </div>

          <div className="text-sm text-gray-500">{coordinates}</div>
          <div className="text-sm text-blue-500">{searchStatusMessage}</div>
          <div className="text-sm text-red-500">{apiErrorMessage}</div>
        </div>

        <textarea
          name="description"
          placeholder="Description of the campaign"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className={`w-full p-3 rounded-lg border transition-colors duration-500
          ${isDarkMode
            ? 'border-gray-600 bg-slate-700 text-white placeholder-gray-400'
            : 'border-gray-300 bg-white/70 text-gray-800 placeholder-gray-500'}`}
          required
        />

        <input
            type="number"
            name="volunteersNeeded"
            placeholder="Volunteers Needed (e.g., 10)"
            value={formData.volunteersNeeded}
            onChange={handleChange}
            className={`w-full p-3 rounded-lg border transition-colors duration-500 ${isDarkMode ? 'border-gray-600 bg-slate-700 text-gray-200' : 'border-gray-300 bg-white/70 text-gray-800'}`}
            min="0"
            required
        />
        
        <input
          type="text"
          name="materials"
          placeholder="Materials / Requirements (optional)"
          value={formData.materials}
          onChange={handleChange}
          className={`w-full p-3 rounded-lg border transition-colors duration-500 ${isDarkMode ? 'border-gray-600 bg-slate-700 text-gray-200' : 'border-gray-300 bg-white/70 text-gray-800'}`}
        />

        {/* --- NEW FILE INPUT FOR IMAGE UPLOAD --- */}
        <input
            type="file"
            name="campaignImage"
            accept="image/*"
            onChange={handleImageChange}
            className={`w-full p-3 rounded-lg border transition-colors duration-500 ${isDarkMode ? 'border-gray-600 bg-slate-700 text-gray-200' : 'border-gray-300 bg-white/70 text-gray-800'}`}
        />
        {/* --- END NEW FILE INPUT --- */}

        <button
          type="submit"
          className={`w-full p-3 rounded-lg font-semibold transition-colors duration-500 ${isDarkMode ? 'bg-green-500 text-white hover:bg-green-400' : 'bg-green-600 text-white hover:bg-green-700'}`}
        >
          Publish Campaign
        </button>

        {status && (
          <p className="text-center mt-4">
            {status}
          </p>
        )}
      </form>
    </div>
  );
}