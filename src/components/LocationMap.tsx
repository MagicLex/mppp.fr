import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function LocationMap() {
  const position: [number, number] = [47.2135, -1.5534]; // Nantes coordinates

  useEffect(() => {
    window.dispatchEvent(new Event('resize'));
  }, []);

  return (
    <div className="relative h-[400px] w-full">
      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-black mb-1">Mon P'tit Poulet</h3>
              <p className="text-gray-600">24 Rue des Olivettes<br />44000 Nantes</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
      <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg p-4 border-4 border-black" style={{ boxShadow: '4px 4px 0 #000' }}>
        <h3 className="font-cartoon text-black mb-1">Nous trouver</h3>
        <p className="text-sm text-gray-600">24 Rue des Olivettes, 44000 Nantes</p>
      </div>
    </div>
  );
}