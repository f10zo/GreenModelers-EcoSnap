'use client';

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase"; // adjust if your Firestore config path differs

// ✅ Dynamically import React-Leaflet components (no SSR)
const MapContainer = dynamic(
    () => import("react-leaflet").then((m) => m.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import("react-leaflet").then((m) => m.TileLayer),
    { ssr: false }
);
const useMap = dynamic(
    () => import("react-leaflet").then((m) => m.useMap),
    { ssr: false }
);

function HeatmapLayer({ points }) {
    const map = useMap();

    useEffect(() => {
        if (!map || !points.length) return;

        let heatLayer;

        const loadHeatmap = async () => {
            // Always use the same Leaflet instance
            const L = (await import("leaflet")).default;
            const heat = await import("leaflet.heat");

            // Attach the plugin properly to L
            if (heat && heat.default) {
                heat.default(L);
            }

            if (typeof L.heatLayer !== "function") {
                console.error("leaflet.heat did not load correctly");
                return;
            }

            heatLayer = L.heatLayer(points, {
                radius: 25,
                blur: 15,
                maxZoom: 17,
                gradient: {
                    0.4: "blue",
                    0.6: "lime",
                    0.8: "orange",
                    1.0: "red",
                },
            });

            heatLayer.addTo(map);
        };

        loadHeatmap();

        return () => {
            if (map && heatLayer) map.removeLayer(heatLayer);
        };
    }, [map, points]);

    return null;
}

export default function ReportsHeatmap() {
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const seaOfGalileeCenter = [32.83, 35.58];

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const reportsRef = collection(db, "reports");
                const snapshot = await getDocs(reportsRef);
                const reportsData = snapshot.docs.map((doc) => doc.data());

                const heatPoints = reportsData
                    .map((r) => {
                        if (!r.coordinates) return null;
                        const parts = r.coordinates.split(",");
                        const lat = parseFloat(parts[0]?.split(":")[1]);
                        const lon = parseFloat(parts[1]?.split(":")[1]);
                        if (isNaN(lat) || isNaN(lon)) return null;

                        // optional intensity by pollution level
                        let intensity = 0.5;
                        if (r.pollution_level === "High") intensity = 1;
                        else if (r.pollution_level === "Medium") intensity = 0.6;
                        else if (r.pollution_level === "Low") intensity = 0.3;

                        return [lat, lon, intensity];
                    })
                    .filter(Boolean);

                setPoints(heatPoints);
            } catch (error) {
                console.error("Error fetching reports:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    return (
        <div
            className="w-full shadow-xl rounded-3xl p-6 overflow-hidden border-2 transition-colors duration-500"
            style={{
                backdropFilter: "blur(12px)",
                backgroundColor: "rgba(255,255,255,0.4)",
                borderColor: "#4ade80",
            }}
        >
            <h3 className="text-3xl font-extrabold mb-6 text-center text-emerald-700">
                🌡️ Pollution Heatmap
            </h3>

            <div className="w-full h-[30rem] rounded-2xl overflow-hidden">
                {loading ? (
                    <p className="text-center text-lg text-gray-500 mt-4">Loading data...</p>
                ) : (
                    <MapContainer
                        center={seaOfGalileeCenter}
                        zoom={11}
                        scrollWheelZoom={true}
                        className="w-full h-full rounded-2xl"
                    >
                        <TileLayer
                            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <HeatmapLayer points={points} />
                    </MapContainer>
                )}
            </div>
        </div>
    );
}
