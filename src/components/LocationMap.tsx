import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;

// Custom marker icon
const customIcon = new L.Icon({
  iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function LocationMap() {
  const position: [number, number] = [47.2135, -1.5534]; // Nantes coordinates

  useEffect(() => {
    window.dispatchEvent(new Event('resize'));
  }, []);

  return (
    <div className="relative h-[400px] w-full">
      <div className="absolute inset-0 bg-amber-100 rounded-3xl border-4 border-black" style={{ boxShadow: '8px 8px 0 #000' }}></div>
      
      <div className="absolute inset-4 z-10">
        <MapContainer
          center={position}
          zoom={15}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
          className="map-container"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <Marker position={position} icon={customIcon}>
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-black mb-1">Mon P'tit Poulet</h3>
                <p className="text-gray-600">24 Rue des Olivettes<br />44000 Nantes</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-6 right-6 z-20 bg-white rounded-full p-3 border-4 border-black" style={{ boxShadow: '4px 4px 0 #000' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C7.6 2 4 5.6 4 10C4 15.4 12 22 12 22C12 22 20 15.4 20 10C20 5.6 16.4 2 12 2Z" fill="#FCD34D" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" fill="white" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      
      <div className="absolute bottom-6 left-6 z-20 bg-white rounded-xl p-4 border-4 border-black" style={{ boxShadow: '4px 4px 0 #000' }}>
        <h3 className="font-cartoon text-black mb-1">Nous trouver</h3>
        <p className="text-sm text-gray-600">24 Rue des Olivettes, 44000 Nantes</p>
        <div className="mt-2 text-xs bg-amber-100 p-2 rounded-lg border-2 border-black">
          <p>Ouvert 12h à 14h - 19h à 21h du Mardi au Samedi</p>
          <p>Dimanche 12h à 21h</p>
          <p className="mt-1">Tél: 07 64 35 86 46</p>
          <p>Parking à proximité</p>
        </div>
      </div>
      
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-black rounded-tl-3xl"></div>
      <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-black rounded-tr-3xl"></div>
      <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-black rounded-bl-3xl"></div>
      <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-black rounded-br-3xl"></div>
    </div>
  );
}