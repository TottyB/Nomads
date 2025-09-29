import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from '../contexts/AuthContext';
import type { Ride } from '../types';
import { PlusIcon, MotorcycleIcon, MapPinIcon, TrashIcon, ClockIcon, RouteIcon, StarIcon, StarOutlineIcon } from './Icons';
import Map from './Map';
import { calculateTotalDistance, formatDuration } from '../utils/geolocation';

const Schedule: React.FC = () => {
  const { supabase, isOnline } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [cachedRides, setCachedRides] = useLocalStorage<Ride[]>('ridesCache', []);
  
  const [date, setDate] = useState('');
  const [meetingPoint, setMeetingPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isMapModalOpen, setMapModalOpen] = useState(false);
  const [pointToSet, setPointToSet] = useState<'meeting' | 'destination' | null>(null);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from cache instantly for better UX
    setRides(cachedRides);
    setLoading(cachedRides.length === 0);

    const fetchRides = async () => {
      const { data, error } = await supabase.from('rides').select('*').order('date', { ascending: false });
      if (error) {
        console.error('Error fetching rides:', error);
      } else {
        setRides(data as Ride[]);
        setCachedRides(data as Ride[]);
      }
      setLoading(false);
    };
    
    fetchRides();

    const channel = supabase.channel('realtime:rides');
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, (payload) => {
        console.log('Change received!', payload);
        fetchRides();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, setCachedRides]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (date && meetingPoint && destination) {
      const { data, error } = await supabase.from('rides').insert([{ date, meetingPoint, destination }]).select();
      if (error) {
        alert('Could not add ride: ' + error.message);
      } else {
        setDate('');
        setMeetingPoint('');
        setDestination('');
        setIsFormVisible(false);
      }
    }
  };

  const deleteRide = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this ride? This action cannot be undone.')) {
        const { error } = await supabase.from('rides').delete().eq('id', id);
        if (error) {
            alert('Could not delete ride: ' + error.message);
        }
    }
  }

  const toggleFavorite = async (id: string) => {
    const rideToUpdate = rides.find(r => r.id === id);
    if (!rideToUpdate) return;
    const { error } = await supabase.from('rides').update({ isFavorite: !rideToUpdate.isFavorite }).eq('id', id);
    if (error) {
      alert('Could not update favorite status: ' + error.message);
    }
  };

  const openMapModal = (type: 'meeting' | 'destination') => {
    setPointToSet(type);
    const pointValue = type === 'meeting' ? meetingPoint : destination;
    if(pointValue.includes('Lat:')) {
        const parts = pointValue.replace(/Lat: |Lng: /g, '').split(', ');
        setMarkerPosition([parseFloat(parts[0]), parseFloat(parts[1])]);
    } else {
        setMarkerPosition(undefined);
    }
    setMapModalOpen(true);
  }

  const handleMapClick = (latlng: { lat: number, lng: number }) => {
    const { lat, lng } = latlng;
    const locationString = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
    if(pointToSet === 'meeting') {
        setMeetingPoint(locationString);
    } else {
        setDestination(locationString);
    }
    setMapModalOpen(false);
    setPointToSet(null);
  }

  const renderRideDetails = (ride: Ride) => {
      if (!ride.endTime || !ride.startTime) return null;
      
      const duration = ride.duration || ride.endTime - ride.startTime;
      const distance = ride.distance || calculateTotalDistance(ride.routePoints);

      return (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-around text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                  <ClockIcon className="w-4 h-4" />
                  <span>{formatDuration(duration)}</span>
              </div>
              <div className="flex items-center gap-1">
                  <RouteIcon className="w-4 h-4" />
                  <span>{distance.toFixed(2)} km</span>
              </div>
          </div>
      )
  }
  
  const RideContent = ({ ride }: { ride: Ride }) => (
    <>
      <p className="font-bold text-lg text-yellow-500 dark:text-yellow-400">{new Date(ride.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <div className="flex items-center mt-2 text-gray-600 dark:text-gray-300">
          <MapPinIcon className="w-5 h-5 mr-2 text-yellow-500 flex-shrink-0"/>
          <span className="truncate">From: {ride.meetingPoint}</span>
      </div>
       <div className="flex items-center mt-1 text-gray-600 dark:text-gray-300">
          <MotorcycleIcon className="w-5 h-5 mr-2 text-yellow-500 flex-shrink-0"/>
          <span className="truncate">To: {ride.destination}</span>
      </div>
    </>
  );

  return (
    <div className="p-4 pb-24">
      {isMapModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex flex-col animate-fade-in-down">
            <div className="bg-gray-800 p-2 flex justify-between items-center text-white">
                <h3 className="font-semibold">Select {pointToSet === 'meeting' ? 'Meeting Point' : 'Destination'}</h3>
                <button onClick={() => setMapModalOpen(false)} className="text-2xl font-bold leading-none px-2">&times;</button>
            </div>
            <div className="flex-grow">
              <Map routePoints={[]} onMapClick={handleMapClick} interactive={true} markerPosition={markerPosition} />
            </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-yellow-500 dark:text-yellow-400">Ride Schedule</h1>
        <button
          onClick={() => setIsFormVisible(!isFormVisible)}
          className="bg-yellow-500 dark:bg-yellow-400 text-white dark:text-gray-900 rounded-full p-2 hover:bg-yellow-600 dark:hover:bg-yellow-500 transition-transform transform hover:scale-110 disabled:bg-gray-400 disabled:cursor-not-allowed"
          aria-label="Add new ride"
          disabled={!isOnline}
        >
          <PlusIcon className="w-6 h-6" />
        </button>
      </div>

      {isFormVisible && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg mb-6 shadow-lg animate-fade-in-down">
          <h2 className="text-xl font-semibold mb-4">Add a New Ride</h2>
          <div className="mb-4">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400"
              required
            />
          </div>
          <div className="mb-4 relative">
            <input
              type="text"
              value={meetingPoint}
              onClick={() => openMapModal('meeting')}
              readOnly
              placeholder="Meeting Point (Select on map)"
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded p-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400"
              required
            />
            <button type="button" onClick={() => openMapModal('meeting')} className="absolute right-1 top-1 bottom-1 bg-yellow-500 text-white text-xs font-bold px-2 rounded hover:bg-yellow-600">Select...</button>
          </div>
          <div className="mb-4 relative">
            <input
              type="text"
              value={destination}
              onClick={() => openMapModal('destination')}
              readOnly
              placeholder="Destination (Select on map)"
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded p-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400"
              required
            />
             <button type="button" onClick={() => openMapModal('destination')} className="absolute right-1 top-1 bottom-1 bg-yellow-500 text-white text-xs font-bold px-2 rounded hover:bg-yellow-600">Select...</button>
          </div>
          <button
            type="submit"
            className="w-full bg-yellow-500 dark:bg-yellow-400 hover:bg-yellow-600 dark:hover:bg-yellow-500 text-white dark:text-gray-900 font-bold py-3 px-4 rounded-lg focus:outline-none"
          >
            Add Ride
          </button>
        </form>
      )}

      <div>
        {loading ? <p>Loading schedule...</p> : rides.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-12">
            <MotorcycleIcon className="w-16 h-16 mx-auto mb-4" />
            <p>No rides scheduled yet.</p>
            <p>Tap the '+' button to plan your next adventure!</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {rides.sort((a,b) => {
                if (a.isFavorite && !b.isFavorite) return -1;
                if (!a.isFavorite && b.isFavorite) return 1;
                return new Date(b.date).getTime() - new Date(a.date).getTime();
              }).map(ride => (
              <li 
                key={ride.id} 
                className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow ${ride.isFavorite ? 'border-l-4 border-yellow-500 dark:border-yellow-400' : ''}`}
              >
                <div className="flex justify-between items-start gap-3">
                    <div className="flex-grow">
                         {ride.endTime ? (
                            <div className="block cursor-default"><RideContent ride={ride} /></div>
                        ) : (
                            <Link to={`/record?rideId=${ride.id}`} className="block"><RideContent ride={ride} /></Link>
                        )}
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                        <button onClick={() => toggleFavorite(ride.id)} className="p-1 text-gray-400 hover:text-yellow-500 disabled:opacity-50" aria-label={ride.isFavorite ? "Unmark as favorite" : "Mark as favorite"} disabled={!isOnline}>
                            {ride.isFavorite ? <StarIcon className="w-6 h-6 text-yellow-500" /> : <StarOutlineIcon className="w-6 h-6" />}
                        </button>
                        <button onClick={() => deleteRide(ride.id)} className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0 disabled:opacity-50" aria-label="Delete ride" disabled={!isOnline}>
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                {renderRideDetails(ride)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Schedule;