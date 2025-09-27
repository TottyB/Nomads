import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Ride } from '../types';
import { PlusIcon, MotorcycleIcon, MapPinIcon } from './Icons';
import { Link } from 'react-router-dom';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

const Schedule: React.FC = () => {
  const [rides, setRides] = useLocalStorage<Ride[]>('rides', []);
  const [date, setDate] = useState('');
  const [meetingPoint, setMeetingPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (date && meetingPoint && destination) {
      const newRide: Ride = {
        id: generateId(),
        date,
        meetingPoint,
        destination,
        routePoints: [],
      };
      setRides([...rides, newRide]);
      setDate('');
      setMeetingPoint('');
      setDestination('');
      setIsFormVisible(false);
    }
  };

  return (
    <div className="p-4 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-yellow-500 dark:text-yellow-400">Ride Schedule</h1>
        <button
          onClick={() => setIsFormVisible(!isFormVisible)}
          className="bg-yellow-500 dark:bg-yellow-400 text-white dark:text-gray-900 rounded-full p-2 hover:bg-yellow-600 dark:hover:bg-yellow-500 transition-transform transform hover:scale-110"
          aria-label="Add new ride"
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
          <div className="mb-4">
            <input
              type="text"
              value={meetingPoint}
              onChange={(e) => setMeetingPoint(e.target.value)}
              placeholder="Meeting Point"
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400"
              required
            />
          </div>
          <div className="mb-4">
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Destination"
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400"
              required
            />
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
        {rides.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-12">
            <MotorcycleIcon className="w-16 h-16 mx-auto mb-4" />
            <p>No rides scheduled yet.</p>
            <p>Tap the '+' button to plan your next adventure!</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {rides.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(ride => (
              <li key={ride.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Link to={`/record?rideId=${ride.id}`} className="block">
                  <p className="font-bold text-lg text-yellow-500 dark:text-yellow-400">{new Date(ride.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <div className="flex items-center mt-2 text-gray-600 dark:text-gray-300">
                      <MapPinIcon className="w-5 h-5 mr-2 text-yellow-500"/>
                      <span>From: {ride.meetingPoint}</span>
                  </div>
                   <div className="flex items-center mt-1 text-gray-600 dark:text-gray-300">
                      <MotorcycleIcon className="w-5 h-5 mr-2 text-yellow-500"/>
                      <span>To: {ride.destination}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Schedule;