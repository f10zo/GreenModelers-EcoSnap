'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';

// Hook to get current theme on client-side
const useClientTheme = () => {
    const [theme, setTheme] = useState('light');
    useEffect(() => {
        if (typeof document === 'undefined') return;

        const observer = new MutationObserver(() => {
            setTheme(document.documentElement.className.includes('dark') ? 'dark' : 'light');
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        setTheme(document.documentElement.className.includes('dark') ? 'dark' : 'light');
        return () => observer.disconnect();
    }, []);
    return theme;
};

// MapUpdater safely flies to center only when map is ready
function MapUpdater({ center }) {
    const map = useMap();

    useEffect(() => {
        if (!map || !center) return;

        map.whenReady(() => {
            map.flyTo(center, 11, {
                animate: true,
                duration: 1.5,
            });
        });
    }, [map, center]);

    return null;
}

// Calculate center of campaigns; fallback if none available
const calculateCenter = (campaigns) => {
    const valid = campaigns.filter(
        (c) => typeof c.locationLat === 'number' && typeof c.locationLon === 'number'
    );
    if (valid.length === 0) return [32.85, 35.55]; // Default center

    const latSum = valid.reduce((sum, c) => sum + c.locationLat, 0);
    const lonSum = valid.reduce((sum, c) => sum + c.locationLon, 0);
    return [latSum / valid.length, lonSum / valid.length];
};

export default function DynamicMap({ campaigns = [] }) {
    const theme = useClientTheme();
    const isDarkMode = theme === 'dark';
    const mapCenter = calculateCenter(campaigns);

    // Setup Leaflet default icon only once on client
    useEffect(() => {
        if (typeof window !== 'undefined' && L) {
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });
        }
    }, []);

    return (
        <div className="w-full h-[70vh] rounded-2xl overflow-hidden">
            {mapCenter && (
                <MapContainer
                    key={mapCenter.join(',')} // Prevent "container being reused" error
                    center={mapCenter}
                    zoom={11}
                    scrollWheelZoom={false}
                    className="w-full h-full"
                >
                    <MapUpdater center={mapCenter} />
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {campaigns.map(
                        (c) =>
                            typeof c.locationLat === 'number' &&
                            typeof c.locationLon === 'number' && (
                                <Marker key={c.id} position={[c.locationLat, c.locationLon]}>
                                    <Popup className={`max-w-xs ${isDarkMode ? 'dark-mode-popup' : ''}`}>
                                        <div className={`p-2 ${isDarkMode ? 'text-emerald-500' : 'text-gray-800'}`}>
                                            {c.imageUrl ? (
                                                <img
                                                    src={c.imageUrl}
                                                    alt={c.campaignName}
                                                    className="rounded-lg mb-2 w-full max-h-24 object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-24 flex items-center justify-center bg-gray-200 rounded-lg mb-2">
                                                    <p className="text-gray-500 text-sm">No Image</p>
                                                </div>
                                            )}
                                            <h4 className={`font-bold text-md mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {c.campaignName}
                                            </h4>
                                            <div className="text-sm leading-snug space-y-1">
                                                <p>
                                                    <span className={`font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>👤 Organizer:</span>{' '}
                                                    {c.organizer}
                                                </p>
                                                <p>
                                                    <span className={`font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>📅 Date & Time:</span>{' '}
                                                    {c.date} at {c.time}
                                                </p>
                                                <p>
                                                    <span className={`font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>🧑‍🤝‍🧑 Volunteers:</span>{' '}
                                                    {c.volunteersNeeded} needed
                                                </p>
                                                {c.materials && (
                                                    <p>
                                                        <span className={`font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>🛠️ Materials:</span>{' '}
                                                        {c.materials}
                                                    </p>
                                                )}
                                            </div>
                                            {c.description && (
                                                <>
                                                    <hr className={`my-1 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`} />
                                                    <p className={`italic text-xs leading-snug ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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
