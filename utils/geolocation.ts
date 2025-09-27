
import { RoutePoint } from '../types';

// Haversine formula to calculate distance between two lat/lng points
export function calculateDistance(point1: {lat: number, lng: number}, point2: {lat: number, lng: number}): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (point2.lat - point1.lat) * (Math.PI / 180);
  const dLon = (point2.lng - point1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * (Math.PI / 180)) *
      Math.cos(point2.lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export function formatDuration(milliseconds: number): string {
    if(milliseconds < 0) milliseconds = 0;
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes % 60).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    
    return `${hh}:${mm}:${ss}`;
}

export function calculateTotalDistance(routePoints: RoutePoint[]): number {
  let totalDistance = 0;
  for (let i = 0; i < routePoints.length - 1; i++) {
    totalDistance += calculateDistance(routePoints[i], routePoints[i+1]);
  }
  return totalDistance;
}
