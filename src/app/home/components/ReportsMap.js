'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import L from '../../../lib/utils/leaflet-heat'; // adjust path if needed
import Image from 'next/image';

// Dynamic imports for React-Leaflet
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

export default function ReportsMap({ reports }) {
    const seaOfGalileeCenter = [32.83, 35.58];
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [currentTheme, setCurrentTheme] = useState('light');

    const mapRef = useRef(null);

    // Fix Leaflet default icons
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
    });

    // Observe theme changes
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setCurrentTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        setCurrentTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        return () => observer.disconnect();
    }, []);

    // Parse coordinates from Firestore
    const getCoords = (coord) => {
        if (!coord) return null;
        if (typeof coord === 'string') {
            const match = coord.match(/Lat:\s*([\d.]+),\s*Lon:\s*([\d.]+)/);
            if (!match) return null;
            return [parseFloat(match[1]), parseFloat(match[2])];
        }
        if (coord.lat !== undefined && coord.lon !== undefined) {
            return [coord.lat, coord.lon];
        }
        return null;
    };

    // Create colored marker
    const createPollutionIcon = (color) => new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const getIcon = (level) => {
        switch (level) {
            case 'High': return createPollutionIcon('red');
            case 'Medium': return createPollutionIcon('yellow');
            case 'Low': return createPollutionIcon('green');
            default: return createPollutionIcon('green');
        }
    };

    // Heatmap effect
    useEffect(() => {
        if (!mapRef.current) return;

        // Remove all previous heat layers
        mapRef.current.eachLayer(layer => {
            if (layer?.setLatLngs) mapRef.current.removeLayer(layer);
        });

        if (showHeatmap && reports && reports.length > 0) {
            const points = reports.map(r => {
                const coords = getCoords(r.coordinates);
                if (!coords) return null;
                let intensity = 0.8;
                switch (r.pollution_level) {
                    case 'High': intensity = 1; break;
                    case 'Medium': intensity = 0.6; break;
                    case 'Low': intensity = 0.3; break;
                }
                return [...coords, intensity];
            }).filter(Boolean);

            if (points.length > 0) {
                const heatLayer = L.heatLayer(points, {
                    radius: 35,
                    blur: 25,
                    maxZoom: 17,
                    gradient: currentTheme === 'dark'
                        ? { 0.3: '#00ff00', 0.6: '#ff9900', 1: '#ff3300' }
                        : { 0.3: 'lime', 0.6: 'orange', 1: 'red' }
                });
                heatLayer.addTo(mapRef.current);
            }
        }

    }, [showHeatmap, reports, currentTheme]);

    return (
        <div className="w-full shadow-xl rounded-3xl p-6 overflow-hidden border-2"
            style={{
                backdropFilter: 'blur(12px)',
                backgroundColor: currentTheme === 'dark' ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.4)',
                borderColor: currentTheme === 'dark' ? '#22c55e' : '#4ade80',
            }}>
            <div className="flex justify-between items-center mb-4">
                <h3 className={`text-3xl font-extrabold ${currentTheme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'}`}>
                    🗺️ Reports Map
                </h3>
                <button
                    className="px-4 py-2 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition"
                    onClick={() => setShowHeatmap(!showHeatmap)}>
                    {showHeatmap ? 'Show Pins' : 'Show Heatmap'}
                </button>
            </div>

            <div className="w-full h-[30rem] rounded-2xl overflow-hidden">
                <MapContainer
                    center={seaOfGalileeCenter}
                    zoom={11}
                    scrollWheelZoom
                    className="w-full h-full"
                    whenCreated={map => { mapRef.current = map; }}
                >
                    <TileLayer
                        attribution='© OpenStreetMap'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {!showHeatmap && reports.map(r => {
                        const coords = getCoords(r.coordinates);
                        if (!coords) return null;
                        return (
                            <Marker key={r.id} position={coords} icon={getIcon(r.pollution_level)}>
                                <Popup>
                                    <div className="space-y-2 text-sm"
                                        style={{
                                            backdropFilter: 'blur(8px)',
                                            backgroundColor: currentTheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.6)',
                                            borderRadius: '12px',
                                            padding: '8px'
                                        }}>
                                        <p className="font-bold">{r.description}</p>
                                        <p>📍 {r.location}</p>
                                        <p>Urgency: <span className="font-semibold">{r.pollution_level}</span></p>
                                        <p>Date: {r.date}</p>
                                        {r.imageUrl && (
                                            <Image src={r.imageUrl} alt="Report" width={200} height={200}
                                                className="w-full h-32 object-cover mt-2 rounded" />
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        )
                    })}
                </MapContainer>
            </div>
        </div>
    );
}
