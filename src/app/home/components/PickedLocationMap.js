'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from "react";

// Fix for default marker icon issue with Leaflet and Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

// A component to re-center the map when the position changes
function ChangeView({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, map.getZoom());
        }
    }, [center, map]);
    return null;
}

export default function PickedLocationMap({ lat, lon, locationName }) {
    if (!lat || !lon) {
        return <div className="text-center py-4 text-red-500">Invalid coordinates.</div>;
    }

    const position = [parseFloat(lat), parseFloat(lon)];

    return (
        <div className="w-full h-full rounded-2xl overflow-hidden">
            <MapContainer
                center={position}
                zoom={14}
                scrollWheelZoom={true}
                className="w-full h-full"
            >
                <ChangeView center={position} />
                <TileLayer
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={position}>
                    <Popup>
                        <p className="font-semibold text-black">{locationName || "Picked Location"}</p>
                        <p className="text-sm text-gray-700">Lat: {lat}, Lon: {lon}</p>
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
}