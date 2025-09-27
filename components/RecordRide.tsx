import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Map from './Map';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Ride, RoutePoint } from '../types';
import { calculateTotalDistance, formatDuration } from '../utils/geolocation';
// Fix: Import `MotorcycleIcon` to resolve 'Cannot find name' error.
import { MotorcycleIcon } from './Icons';

const RecordRide: React.FC = () => {
  const [rides, setRides] = useLocalStorage<Ride[]>('rides', []);
  const [duration, setDuration] = useState(0);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);

  const watchId = useRef<number | null>(null);
  const timerId = useRef<number | null>(null);

  const location = useLocation();
  const rideId = new URLSearchParams(location.search).get('rideId');

  // --- Derived State ---
  const currentRide = rides.find(r => r.id === rideId) || null;
  const isRecording = !!currentRide?.startTime && !currentRide?.endTime;
  const distance = currentRide ? calculateTotalDistance(currentRide.routePoints) : 0;

  // --- Actions ---
  const updateRide = useCallback((rideData: Partial<Ride>) => {
    setRides(prevRides =>
      prevRides.map(r => r.id === rideId ? { ...r, ...rideData } : r)
    );
  }, [rideId, setRides]);

  const startRecording = () => {
    if (!currentRide) return;
    setGeolocationError(null);
    updateRide({
      routePoints: [],
      startTime: Date.now(),
      endTime: undefined
    });
    setDuration(0);
  };

  const stopRecording = useCallback(() => {
    updateRide({ endTime: Date.now() });
  }, [updateRide]);

  // --- Effects ---
  useEffect(() => {
    if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    if (timerId.current) clearInterval(timerId.current);
    watchId.current = null;
    timerId.current = null;

    if (isRecording && currentRide?.startTime) {
      setDuration(Date.now() - currentRide.startTime);

      timerId.current = window.setInterval(() => {
        setDuration(Date.now() - currentRide.startTime!);
      }, 1000);

      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const newPoint: RoutePoint = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: position.timestamp,
          };
          setRides(prevRides =>
            prevRides.map(r =>
              r.id === rideId
                ? { ...r, routePoints: [...r.routePoints, newPoint] }
                : r
            )
          );
        },
        (error) => {
          console.error(`Geolocation error: code ${error.code}, message: ${error.message}`);
          let errorMessage = "An unknown error occurred while trying to get your location.";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied. Please enable it in your browser settings to record your ride.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable. Please check your GPS signal and try again.";
              break;
            case error.TIMEOUT:
              errorMessage = "The request to get your location timed out. Please try again.";
              break;
          }
          setGeolocationError(errorMessage);
          stopRecording();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else if (currentRide?.startTime && currentRide?.endTime) {
      setDuration(currentRide.endTime - currentRide.startTime);
    } else {
      setDuration(0);
    }

    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
      if (timerId.current) clearInterval(timerId.current);
    };
  }, [isRecording, rideId, setRides, stopRecording, currentRide?.startTime, currentRide?.endTime]);


  if (!currentRide) {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-9rem)] p-4 text-center text-gray-500 dark:text-gray-400">
            <MotorcycleIcon className="w-24 h-24 mb-4 text-gray-400 dark:text-gray-500" />
            <h2 className="text-xl font-semibold">No Ride Selected</h2>
            <p>Please go to the <a href="#/" className="text-yellow-500 hover:underline">Schedule</a> to select a ride to record.</p>
        </div>
    );
  }
  
  const hasStarted = !!currentRide.startTime;
  const isFinished = !!currentRide.endTime;

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)]">
      <div className="flex-grow relative">
        <Map routePoints={currentRide.routePoints} />
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
        {geolocationError && (
          <div className="bg-red-100 border border-red-400 text-red-700 dark:bg-red-900 dark:border-red-600 dark:text-red-200 px-4 py-3 rounded-lg relative mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{geolocationError}</span>
          </div>
        )}
        <h2 className="text-xl font-bold truncate text-yellow-500 dark:text-yellow-400">{currentRide.destination}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">From: {currentRide.meetingPoint}</p>
        <div className="grid grid-cols-2 gap-4 text-center mb-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Distance</p>
            <p className="text-2xl font-semibold">{distance.toFixed(2)} km</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
            <p className="text-2xl font-semibold">{formatDuration(duration)}</p>
          </div>
        </div>
        {isRecording ? (
          <button
            onClick={stopRecording}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-4 rounded-lg transition-transform transform hover:scale-105"
          >
            Stop Ride
          </button>
        ) : (
          <button
            onClick={startRecording}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-4 rounded-lg transition-transform transform hover:scale-105 disabled:bg-gray-400 dark:disabled:bg-gray-600"
            disabled={isFinished}
          >
            {isFinished ? 'Ride Finished' : (hasStarted ? 'Start New Ride' : 'Start Ride')}
          </button>
        )}
      </div>
    </div>
  );
};

export default RecordRide;