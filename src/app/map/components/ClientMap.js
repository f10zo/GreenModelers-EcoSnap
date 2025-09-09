"use client";

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Fix for default marker icon issue with Leaflet and Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

// Define custom icons for each pollution level
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

export default function ClientMap() {
  const [reports, setReports] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchReports = async () => {
      const reportsCollection = collection(db, 'reports');
      const reportsSnapshot = await getDocs(reportsCollection);
      const reportsList = reportsSnapshot.docs.map(doc => {
        const data = doc.data();
        const coords = data.coordinates;
        if (coords) {
          const lat = parseFloat(coords.split(',')[0].split(':')[1].trim());
          const lon = parseFloat(coords.split(',')[1].split(':')[1].trim());
          return { id: doc.id, ...data, lat, lon };
        }
        return null;
      }).filter(Boolean);
      setReports(reportsList);
    };

    fetchReports();
  }, []);

  const handleClose = () => {
    router.back();
  };

  const seaOfGalileeCenter = [32.83, 35.58];

  return (
    <div className="fixed inset-0 z-[999] bg-black/70 flex items-center justify-center p-4" onClick={handleClose}>
      <div 
        className="w-full max-w-4xl h-[70vh] rounded-2xl overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
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

          {reports.map((report) => {
              let iconToUse;
              switch (report.pollution_level) {
                  case 'High':
                      iconToUse = redIcon;
                      break;
                  case 'Medium':
                      iconToUse = yellowIcon;
                      break;
                  case 'Low':
                      iconToUse = greenIcon;
                      break;
                  default:
                      iconToUse = greenIcon;
              }
              return (
                  <Marker key={report.id} position={[report.lat, report.lon]} icon={iconToUse}>
                      <Popup>
                          <div className="space-y-2 text-sm text-black">
                              <p className="font-bold">{report.description}</p>
                              <p>📍 {report.location}</p>
                              <p>Urgency: <span className="font-semibold">{report.pollution_level}</span></p>
                              <p>Date: {report.date}</p>
                              <Image src={report.imageUrl} alt="Report" width={200} height={200} className="w-full h-32 object-cover rounded-md mt-2"/>
                          </div>
                      </Popup>
                  </Marker>
              );
          })}
        </MapContainer>
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-[1000] p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}