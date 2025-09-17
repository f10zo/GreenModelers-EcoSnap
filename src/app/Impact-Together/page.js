"use client";

import React, { useState, useEffect } from "react";
import { db } from '../../firebase'; // Make sure this path is correct
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function PublishCampaignForm() {
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
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Publishing campaign...");

    try {
      // Save to Firestore collection named "campaigns"
      await addDoc(collection(db, "campaigns"), {
        ...formData,
        volunteersNeeded: Number(formData.volunteersNeeded), // Convert to number
        createdAt: serverTimestamp(),
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
      });
    } catch (error) {
      console.error("Error submitting campaign:", error);
      setStatus("❌ Failed to publish campaign. Please try again.");
    }
  };

  const isDarkMode = currentTheme.includes('dark');

  return (
    <div className={`max-w-3xl mx-auto backdrop-blur-md p-6 rounded-3xl shadow-xl transition-colors duration-500 ${isDarkMode ? 'bg-slate-800/80' : 'bg-white/30'}`}>
      <h2 className={`text-3xl font-bold mb-4 text-center mt-3 transition-colors duration-500 ${isDarkMode ? 'text-black-300' : 'text-white-700'}`}>
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

        <input
          type="text"
          name="location"
          placeholder="Location (e.g., North shore, Sea of Galilee)"
          value={formData.location}
          onChange={handleChange}
          className={`w-full p-3 rounded-lg border transition-colors duration-500 ${isDarkMode ? 'border-gray-600 bg-slate-700 text-gray-200' : 'border-gray-300 bg-white/70 text-gray-800'}`}
          required
        />

        <textarea
          name="description"
          placeholder="Description of the campaign"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className={`w-full p-3 rounded-lg border transition-colors duration-500 ${isDarkMode ? 'border-gray-600 bg-slate-700 text-gray-200' : 'border-gray-300 bg-white/70 text-gray-800'}`}
          required
        />

        <input
          type="number"
          name="volunteersNeeded"
          placeholder="Expected Number of Volunteers"
          value={formData.volunteersNeeded}
          onChange={handleChange}
          className={`w-full p-3 rounded-lg border transition-colors duration-500 ${isDarkMode ? 'border-gray-600 bg-slate-700 text-gray-200' : 'border-gray-300 bg-white/70 text-gray-800'}`}
        />

        <input
          type="text"
          name="materials"
          placeholder="Materials / Requirements (optional)"
          value={formData.materials}
          onChange={handleChange}
          className={`w-full p-3 rounded-lg border transition-colors duration-500 ${isDarkMode ? 'border-gray-600 bg-slate-700 text-gray-200' : 'border-gray-300 bg-white/70 text-gray-800'}`}
        />

        <button
          type="submit"
          className={`w-full p-3 rounded-lg font-semibold transition-colors duration-500 ${isDarkMode ? 'bg-green-500 text-white hover:bg-green-400' : 'bg-green-600 text-white hover:bg-green-700'}`}
        >
          Publish Campaign
        </button>

        {status && (
          <p className="text-center mt-4 text-green-600 dark:text-green-400">
            {status}
          </p>
        )}
      </form>
    </div>
  );
}