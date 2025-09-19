'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// ✅ Fix for default marker icon not showing
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Function to calculate the center of all campaigns
const calculateCenter = (campaigns) => {
    if (!campaigns || campaigns.length === 0) {
        return [32.85, 35.55]; // Fallback (Sea of Galilee area)
    }
    const validCampaigns = campaigns.filter(
        (c) => c.locationLat != null && c.locationLon != null
    );
    if (validCampaigns.length === 0) {
        return [32.85, 35.55];
    }
    const latSum = validCampaigns.reduce((sum, c) => sum + c.locationLat, 0);
    const lonSum = validCampaigns.reduce((sum, c) => sum + c.locationLon, 0);
    return [latSum / validCampaigns.length, lonSum / validCampaigns.length];
};

export default function DynamicMap({ campaigns }) {
    const [mounted, setMounted] = useState(false);

    // ✅ Ensure map renders only on client
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null; // Prevents SSR crash

    const mapCenter = calculateCenter(campaigns);

    return (
        <div className="w-full h-[30rem] rounded-2xl overflow-hidden">
            <MapContainer
                center={mapCenter}
                zoom={11}
                scrollWheelZoom={true}
                className="w-full h-full"
            >
                <TileLayer
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {campaigns.map(
                    (c) =>
                        c.locationLat &&
                        c.locationLon && (
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

                                        <div className="text-gray-700 text-sm leading-tight space-y-1">
                                            <p>
                                                <span className="font-bold text-gray-900">👤 Organizer:</span> {c.organizer}
                                            </p>
                                            <p>
                                                <span className="font-bold text-gray-900">📅 Date & Time:</span> {c.date} at {c.time}
                                            </p>
                                            <p>
                                                <span className="font-bold text-gray-900">🧑‍🤝‍🧑 Volunteers:</span> {c.volunteersNeeded} needed
                                            </p>
                                            {c.materials && (
                                                <p>
                                                    <span className="font-bold text-gray-900">🛠️ Materials:</span> {c.materials}
                                                </p>
                                            )}
                                        </div>

                                        {c.description && (
                                            <>
                                                <hr className="my-2 border-gray-300" />
                                                <p className="text-gray-600 italic text-xs leading-snug">
                                                    {c.description}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        )
                )}
            </MapContainer>
        </div>
    );
}
