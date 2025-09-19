'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon not showing
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Function to calculate the center of all campaigns
const calculateCenter = (campaigns) => {
    // If there are no campaigns, return the fixed default center
    if (!campaigns || campaigns.length === 0) {
        return [32.85, 35.55]; // Default center (Sea of Galilee area)
    }

    // Filter campaigns to only include those with valid coordinates
    const validCampaigns = campaigns.filter(c => c.locationLat != null && c.locationLon != null);

    // If no valid campaigns are found, return the default center
    if (validCampaigns.length === 0) {
        return [32.85, 35.55];
    }

    // Sum up all valid latitudes and longitudes
    const latSum = validCampaigns.reduce((sum, c) => sum + c.locationLat, 0);
    const lonSum = validCampaigns.reduce((sum, c) => sum + c.locationLon, 0);

    // Calculate and return the average latitude and longitude
    return [latSum / validCampaigns.length, lonSum / validCampaigns.length];
};

export default function DynamicMap({ campaigns }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // The map will now center on the average location of all campaigns
    const mapCenter = calculateCenter(campaigns);

    // Use a unique key to force map re-render when campaigns change
    const mapKey = JSON.stringify(campaigns.map(c => c.id));

    if (!mounted) {
        return null;
    }
    const seaOfGalileeCenter = [32.83, 35.58];

    return (
        <div className="w-full h-[30rem] rounded-2xl overflow-hidden">
            <MapContainer
                center={seaOfGalileeCenter}
                zoom={11}
                scrollWheelZoom={true}
                className="w-full h-full"
            >
                <TileLayer
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {campaigns.map((c) => (
                    c.locationLat && c.locationLon && (
                        <Marker key={c.id} position={[c.locationLat, c.locationLon]}>
                            <Popup>
                                <div className="p-2">
                                    {c.imageUrl && (
                                        <img
                                            src={c.imageUrl}
                                            alt={c.campaignName}
                                            className="rounded-lg mb-2 max-h-32 object-cover"
                                        />
                                    )}
                                    <h4 className="font-extrabold text-lg mb-1 text-gray-900">
                                        {c.campaignName}
                                    </h4>
                                    <div className="flex flex-col space-y-0 text-gray-700 text-sm">
                                        <p className="flex items-center">
                                            <span className="font-bold mr-2 text-gray-900">👤 Organizer:</span> {c.organizer}
                                        </p>
                                        <p className="flex items-center">
                                            <span className="font-bold mr-2 text-gray-900">📅 Date & Time:</span> {c.date} at {c.time}
                                        </p>
                                        <p className="flex items-center">
                                            <span className="font-bold mr-2 text-gray-900">🧑‍🤝‍🧑 Volunteers:</span> {c.volunteersNeeded} needed
                                        </p>
                                        {c.materials && (
                                            <p className="flex items-center">
                                                <span className="font-bold mr-2 text-gray-900">🛠️ Materials:</span> {c.materials}
                                            </p>
                                        )}
                                    </div>
                                    {c.description && (
                                        <>
                                            <hr className="my-2 border-gray-300" />
                                            <p className="text-gray-600 italic text-xs">{c.description}</p>
                                        </>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    )
                ))}
            </MapContainer>
        </div>
    );
}