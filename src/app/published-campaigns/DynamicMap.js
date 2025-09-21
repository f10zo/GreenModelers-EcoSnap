'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Dynamically import MapContainer to avoid SSR issues
const MapContainer = dynamic(
    () => import('react-leaflet').then(mod => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import('react-leaflet').then(mod => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import('react-leaflet').then(mod => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import('react-leaflet').then(mod => mod.Popup),
    { ssr: false }
);

const calculateCenter = (campaigns) => {
    if (!campaigns || campaigns.length === 0) return [32.85, 35.55];
    const valid = campaigns.filter(
        (c) => typeof c.locationLat === 'number' && typeof c.locationLon === 'number'
    );
    if (valid.length === 0) return [32.85, 35.55];
    const latSum = valid.reduce((sum, c) => sum + c.locationLat, 0);
    const lonSum = valid.reduce((sum, c) => sum + c.locationLon, 0);
    return [latSum / valid.length, lonSum / valid.length];
};

export default function DynamicMap({ campaigns = [] }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    const mapCenter = calculateCenter(campaigns);

    return (
        <div className="w-full h-[70vh] rounded-2xl overflow-hidden">
            {mapCenter && (
                <MapContainer center={mapCenter} zoom={11} scrollWheelZoom className="w-full h-full">
                    <TileLayer
                        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {campaigns.map(
                        (c) =>
                            typeof c.locationLat === 'number' &&
                            typeof c.locationLon === 'number' && (
                                <Marker key={c.id} position={[c.locationLat, c.locationLon]}>
                                    <Popup className="max-w-xs">
                                        <div className="p-2">
                                            {c.imageUrl && (
                                                <image
                                                    src={c.imageUrl}
                                                    alt={c.campaignName}
                                                    className="rounded-lg mb-2 max-h-24 object-cover"
                                                />
                                            )}
                                            <h4 className="font-bold text-md mb-1 text-gray-800">
                                                {c.campaignName}
                                            </h4>
                                            <div className="text-gray-700 text-sm leading-snug space-y-1">
                                                <p>
                                                    <span className="font-bold text-gray-900">👤 Organizer:</span>{' '}
                                                    {c.organizer}
                                                </p>
                                                <p>
                                                    <span className="font-bold text-gray-900">📅 Date & Time:</span>{' '}
                                                    {c.date} at {c.time}
                                                </p>
                                                <p>
                                                    <span className="font-bold text-gray-900">🧑‍🤝‍🧑 Volunteers:</span>{' '}
                                                    {c.volunteersNeeded} needed
                                                </p>
                                                {c.materials && (
                                                    <p>
                                                        <span className="font-bold text-gray-900">🛠️ Materials:</span>{' '}
                                                        {c.materials}
                                                    </p>
                                                )}
                                            </div>
                                            {c.description && (
                                                <>
                                                    <hr className="my-1 border-gray-300" />
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
            )}
        </div>
    );
}
