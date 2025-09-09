"use client";

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useSearchParams } from 'next/navigation';

// Fix for default marker icon issue with Leaflet and Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

// Define a custom blue icon for the specific location
const createPollutionIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const newLocationIcon = createPollutionIcon('blue');

export default function ClientMap() {
  const searchParams = useSearchParams();

  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const locationName = searchParams.get('locationName');

  const position = lat && lon ? [parseFloat(lat), parseFloat(lon)] : null;
  const initialCenter = position || [32.83, 35.58]; // Default to Sea of Galilee if no coords
  const initialZoom = position ? 14 : 11;

  if (!position) {
    return (
      <div className="flex items-center justify-center w-full h-full text-gray-500 bg-white/90">
        No location selected to display.
      </div>
    );
  }

  return (
    <MapContainer 
      key={position.toString()}
      center={initialCenter} 
      zoom={initialZoom} 
      scrollWheelZoom={true} 
      className="w-full h-full"
    >
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position} icon={newLocationIcon}>
        <Popup>
          <div className="text-sm font-semibold text-black">
            {locationName || "Selected Location"}
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}