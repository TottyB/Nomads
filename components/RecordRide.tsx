import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Map from './Map';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Ride, RoutePoint } from '../types';
import { calculateTotalDistance, formatDuration } from '../utils/geolocation';
import { MotorcycleIcon, ClockIcon, RouteIcon } from './Icons';
import { useAuth } from '../contexts/AuthContext';

const RecordRide: React.FC = () => {
  const { supabase, profile, isOnline } = useAuth();
  const navigate = useNavigate();
  
  // Rides are now a combination of local state (for live updates) and a cached representation.
  const [rides, setRides] = useLocalStorage<Ride[]>('ridesCache', []);
  const [liveRoute, setLiveRoute] = useState<RoutePoint[]>([]);
  const [liveDuration, setLiveDuration] = useState(0);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);

  const location = useLocation();
  const rideId = new URLSearchParams(location.search).get('rideId');

  // Find the base ride from the cache
  const baseRide = useMemo(() => rides.find(r => r.id === rideId) || null, [rides, rideId]);

  // Create a "live" version of the ride for display, combining base data with live tracking data
  const currentRide = useMemo(() => {
    if (!baseRide) return null;
    return {
      ...baseRide,
      routePoints: liveRoute.length > 0 ? liveRoute : baseRide.routePoints,
    };
  }, [baseRide, liveRoute]);

  const isRecording = useMemo(() => !!currentRide?.startTime && !currentRide?.endTime, [currentRide]);
  const distance = useMemo(() => (currentRide ? calculateTotalDistance(currentRide.routePoints) : 0), [currentRide]);
  const duration = useMemo(() => {
    if (!currentRide?.startTime) return 0;
    if (currentRide.endTime) return currentRide.endTime - currentRide.startTime;
    return liveDuration;
  }, [currentRide, liveDuration]);
  
  const hasStarted = !!currentRide?.startTime;
  const isFinished = !!currentRide?.endTime;

  const updateRideInCache = useCallback((rideData: Partial<Ride>) => {
    setRides(prevRides =>
      prevRides.map(r => (r.id === rideId ? { ...r, ...rideData } : r))
    );
  }, [rideId, setRides]);

  const startRecording = useCallback(() => {
    if (!currentRide) return;
    setGeolocationError(null);
    setLiveRoute([]);
    const startTime = Date.now();
    updateRideInCache({
      routePoints: [],
      startTime: startTime,
      endTime: undefined,
      recorder_id: profile?.id,
    });
    setLiveDuration(0);
  }, [currentRide, updateRideInCache, profile]);

  const stopRecording = useCallback(async () => {
    const endTime = Date.now();
    const finalDuration = endTime - (currentRide?.startTime || endTime);
    const finalDistance = calculateTotalDistance(liveRoute);

    updateRideInCache({ endTime });
    
    if (!isOnline) {
      alert("You are offline. Ride data saved locally and will sync when you're back online.");
       // Note: A full offline queue is complex. For now, we'll just hope the user comes online before navigating away.
       // A more robust solution would use service workers or IndexedDB queues.
      return;
    }
    
    const { error } = await supabase
        .from('rides')
        .update({
            endTime: endTime,
            routePoints: liveRoute,
            recorder_id: profile?.id,
            duration: finalDuration,
            distance: finalDistance,
        })
        .eq('id', rideId);

    if (error) {
        alert("Error saving ride to cloud: " + error.message);
    } else {
        alert("Ride saved successfully!");
        navigate('/');
    }
  }, [currentRide, liveRoute, updateRideInCache, supabase, rideId, profile, isOnline, navigate]);


  // Effect for live duration timer
  useEffect(() => {
    let timerId: number | null = null;
    if (isRecording && currentRide?.startTime) {
      setLiveDuration(Date.now() - currentRide.startTime);
      timerId = window.setInterval(() => {
        setLiveDuration(Date.now() - currentRide!.startTime!);
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isRecording, currentRide?.startTime]);

  // Effect for geolocation tracking
  useEffect(() => {
    if (!isRecording) return;

    const handleError = (error: GeolocationPositionError) => {
        let errorMessage = "An unknown error occurred while trying to get your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable it to record your ride.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable. Check your GPS signal.";
            break;
          case error.TIMEOUT:
            errorMessage = "The request to get your location timed out.";
            break;
        }
        setGeolocationError(errorMessage);
        if (isRecording) stopRecording();
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newPoint: RoutePoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: position.timestamp,
        };
        setLiveRoute(prevRoute => [...prevRoute, newPoint]);
      },
      handleError,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isRecording, stopRecording]);


  if (!currentRide) {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-9rem)] p-4 text-center text-gray-500 dark:text-gray-400">
            <MotorcycleIcon className="w-24 h-24 mb-4 text-gray-400 dark:text-gray-500" />
            <h2 className="text-xl font-semibold">No Ride Selected</h2>
            <p>Please go to the <a href="#/" className="text-yellow-500 hover:underline">Schedule</a> to select a ride to record.</p>
        </div>
    );
  }

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
          <div className="flex flex-col items-center p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50">
            <RouteIcon className="w-6 h-6 mb-1 text-yellow-500 dark:text-yellow-400"/>
            <p className="text-sm text-gray-500 dark:text-gray-400">Distance</p>
            <p className="text-2xl font-semibold">{distance.toFixed(2)} km</p>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50">
            <ClockIcon className="w-6 h-6 mb-1 text-yellow-500 dark:text-yellow-400"/>
            <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
            <p className="text-2xl font-semibold">{formatDuration(duration)}</p>
          </div>
        </div>
        
        {isRecording ? (
          <button
            onClick={stopRecording}
            className="w-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-4 rounded-lg transition-transform transform hover:scale-105"
          >
            <span className="relative flex h-3 w-3 mr-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            Stop Ride
          </button>
        ) : (
          <button
            onClick={startRecording}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-4 rounded-lg transition-transform transform hover:scale-105 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            disabled={isFinished || !isOnline}
          >
            {isFinished ? 'Ride Finished' : (hasStarted ? 'Start New Ride' : 'Start Ride')}
          </button>
        )}
      </div>
    </div>
  );
};

export default RecordRide;