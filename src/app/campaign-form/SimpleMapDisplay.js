'use client'; 

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Function to fix the Leaflet default icon issue, runs only on the client
const fixLeafletIcons = () => {
    if (typeof window !== 'undefined' && L) {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
    }
};

export default function SimpleMapDisplay({ lat, lon, onClose }) {
    
    useEffect(() => {
        fixLeafletIcons();
    }, []);

    if (lat === null || lon === null) {
        return null;
    }

    return (
        <div className="relative mt-2 w-full h-64 rounded-lg overflow-hidden shadow-lg">
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-2 right-2 z-[1000] bg-white text-red-600 font-bold rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-100"
                title="Close map"
            >
                ❌
            </button>

            <MapContainer center={[lat, lon]} zoom={15} style={{ width: '100%', height: '100%' }} key={`${lat}-${lon}`}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={[lat, lon]} />
            </MapContainer>
        </div>
    );
}