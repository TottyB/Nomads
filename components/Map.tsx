import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMapEvents } from 'react-leaflet';
import type { RoutePoint } from '../types';

interface MapProps {
  routePoints: RoutePoint[];
  onMapClick?: (latlng: { lat: number; lng: number }) => void;
  markerPosition?: [number, number];
  interactive?: boolean;
}

const NYERI_COUNTY: [number, number] = [-0.4201, 36.9476];

const MapClickHandler: React.FC<{ onMapClick: (latlng: { lat: number; lng: number }) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
};

const Map: React.FC<MapProps> = ({ routePoints, onMapClick, markerPosition, interactive = false }) => {
  const [center, setCenter] = useState<[number, number]>(NYERI_COUNTY);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [zoom, setZoom] = useState(12);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Only fetch location if no route/markers are provided, to set an initial view.
    if (routePoints.length === 0 && !markerPosition) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userLocation: [number, number] = [latitude, longitude];
          setCenter(userLocation);
          setUserPosition(userLocation);
          setZoom(15);
          setLocationError(null); // Clear error on success
        },
        (error) => {
          console.error("Geolocation error:", error.message);
          let errorMessage = "Could not get your location. Displaying default map area.";
          if (error.code === error.PERMISSION_DENIED) {
             errorMessage = "Location access denied. Please enable permissions in your browser settings.";
             if(error.message && error.message.toLowerCase().includes('permissions policy')) {
                errorMessage = "Geolocation is disabled by a permissions policy. Please check browser/site settings.";
             }
          }
          setLocationError(errorMessage);
          setCenter(NYERI_COUNTY);
          setZoom(12);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, [routePoints.length, markerPosition]);

  const positions = routePoints.map(p => [p.lat, p.lng] as [number, number]);
  
  let mapCenter: [number, number] = center;
  if(positions.length > 0) {
      mapCenter = positions[positions.length - 1]; // Center on the latest point
  } else if (markerPosition) {
      mapCenter = markerPosition;
  }

  let mapZoom = zoom;
  if(positions.length > 0 || markerPosition) {
      mapZoom = 15;
  }

  return (
    <div className="relative h-full w-full">
      {isOffline && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-yellow-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
          You are offline. Only cached map areas will be shown.
        </div>
      )}
      {locationError && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[1000] bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-lg max-w-[90%] text-center">
          {locationError}
        </div>
      )}
      <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }} key={mapCenter.join(',')}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}

        {userPosition && positions.length === 0 && !markerPosition && (
          <Marker position={userPosition}>
            <Popup>Your Location</Popup>
          </Marker>
        )}

        {markerPosition && (
          <Marker position={markerPosition}>
            <Popup>{interactive ? "Selected Point" : "Location"}</Popup>
          </Marker>
        )}

        {positions.length > 0 && (
          <>
            <Marker position={positions[0]}>
              <Popup>Starting Point</Popup>
            </Marker>
            <Polyline pathOptions={{ color: '#facc15', weight: 5 }} positions={positions} />
            <Marker position={positions[positions.length - 1]}>
              <Popup>Current Location</Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default Map;