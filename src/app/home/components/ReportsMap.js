'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Image from 'next/image';
import { useState, useEffect } from "react";

// Fix for default marker icon issue with Leaflet and Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

// Custom icons for pollution levels
const createPollutionIcon = (color) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const redIcon = createPollutionIcon('red');
const yellowIcon = createPollutionIcon('yellow');
const greenIcon = createPollutionIcon('green');

export default function ReportsMap({ reports }) {
    const seaOfGalileeCenter = [32.83, 35.58];
    const [currentTheme, setCurrentTheme] = useState("light");

    useEffect(() => {
        const observer = new MutationObserver(() => {
            const theme = document.documentElement.classList.contains("dark")
                ? "dark"
                : "light";
            setCurrentTheme(theme);
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        setCurrentTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
        return () => observer.disconnect();
    }, []);

    const getCoords = (coordString) => {
        if (!coordString || !coordString.includes("Lat:") || !coordString.includes("Lon:")) return null;
        try {
            const parts = coordString.split(',');
            const lat = parseFloat(parts[0].split(':')[1].trim());
            const lon = parseFloat(parts[1].split(':')[1].trim());
            return [lat, lon];
        } catch (e) {
            console.error("Error parsing coordinates:", coordString, e);
            return null;
        }
    };

    return (
        <div
            className={`w-full shadow-xl rounded-3xl p-6 overflow-hidden border-2 transition-colors duration-500`}
            style={{
                backdropFilter: 'blur(12px)',
                backgroundColor: currentTheme === "dark" ? "rgba(15, 23, 42, 0.7)" : "rgba(255, 255, 255, 0.4)",
                borderColor: currentTheme === "dark" ? "#22c55e" : "#4ade80",
                color: currentTheme === "dark" ? "#fff" : "#000"
            }}
        >
            <h3
                className={`text-3xl font-extrabold mb-6 text-center transition-colors duration-500 ${currentTheme === "dark" ? "text-emerald-300" : "text-emerald-700"}`}
            >
                🗺️ Reports Map
            </h3>

            <div className="w-full h-[30rem] rounded-2xl overflow-hidden">
                <MapContainer
                    center={seaOfGalileeCenter}
                    zoom={11}
                    scrollWheelZoom={true}
                    className="w-full h-full rounded-2xl"
                    style={{ backdropFilter: 'blur(8px)' }}
                >
                    <TileLayer
                        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {reports.map((report) => {
                        const coords = getCoords(report.coordinates);
                        if (!coords) return null;

                        let iconToUse;
                        switch (report.pollution_level) {
                            case "High": iconToUse = redIcon; break;
                            case "Medium": iconToUse = yellowIcon; break;
                            case "Low": iconToUse = greenIcon; break;
                            default: iconToUse = greenIcon;
                        }

                        return (
                            <Marker key={report.id} position={coords} icon={iconToUse}>
                                <Popup>
                                    <div
                                        className="space-y-2 text-sm"
                                        style={{
                                            backdropFilter: 'blur(8px)',
                                            backgroundColor: currentTheme === "dark" ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.6)",
                                            borderRadius: "12px",
                                            padding: "8px"
                                        }}
                                    >
                                        <p className="font-bold">{report.description}</p>
                                        <p>📍 {report.location}</p>
                                        <p>Urgency: <span className="font-semibold">{report.pollution_level}</span></p>
                                        <p>Date: {report.date}</p>
                                        <Image
                                            src={report.imageUrl}
                                            alt="Report"
                                            width={200}
                                            height={200}
                                            className="w-full h-32 object-cover rounded-md mt-2"
                                        />
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>
            </div>
        </div>
    );
}