import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import type { RoutePoint } from '../types';

interface MapProps {
  routePoints: RoutePoint[];
}

const NYERI_COUNTY: [number, number] = [-0.4201, 36.9476];

const Map: React.FC<MapProps> = ({ routePoints }) => {
  const [center, setCenter] = useState<[number, number]>(NYERI_COUNTY);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [zoom, setZoom] = useState(12);

  useEffect(() => {
    // Only fetch location if there's no ride in progress to set an initial view.
    if (routePoints.length === 0) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userLocation: [number, number] = [latitude, longitude];
          setCenter(userLocation);
          setUserPosition(userLocation);
          setZoom(15);
        },
        (error) => {
          console.error("Geolocation error:", error.message);
          if (error.code === error.PERMISSION_DENIED) {
            alert("Location permission was denied. The map will default to Nyeri County.");
          }
          // Default to Nyeri County if permission is denied or location is unavailable
          setCenter(NYERI_COUNTY);
          setZoom(12);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, []); // Empty dependency array means this runs once on mount.

  const positions = routePoints.map(p => [p.lat, p.lng] as [number, number]);
  // If there are route points, center on the first point of the route. Otherwise, use the state 'center'.
  const mapCenter: [number, number] = positions.length > 0 ? positions[0] : center;
  
  return (
    <MapContainer center={mapCenter} zoom={positions.length > 0 ? 15 : zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }} key={mapCenter.join(',')}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* Marker for initial user location if no ride has started */}
      {userPosition && positions.length === 0 && (
          <Marker position={userPosition}>
              <Popup>Your Location</Popup>
          </Marker>
      )}

      {positions.length > 0 && (
        <>
            <Marker position={positions[0]}>
                <Popup>Starting Point</Popup>
            </Marker>
            <Polyline pathOptions={{ color: '#facc15' }} positions={positions} />
            <Marker position={positions[positions.length - 1]}>
                <Popup>Current Location</Popup>
            </Marker>
        </>
      )}
    </MapContainer>
  );
};

export default Map;