import React, { useState } from 'react';
import type { User } from '../types';
import { LogoIcon } from './Icons';

interface WelcomeProps {
  onWelcomeComplete: (user: { name: string; age: number }) => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onWelcomeComplete }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && parseInt(age) > 0) {
      onWelcomeComplete({ name: name.trim(), age: parseInt(age) });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <LogoIcon className="w-32 h-32 mx-auto mb-4 text-yellow-500 dark:text-yellow-400" />
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Nomads <span className="text-yellow-500 dark:text-yellow-400">Bikers</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Your companion for the open road. Let's get you set up.</p>
        
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl">
          <div className="mb-6">
            <label htmlFor="name" className="block text-left text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Your Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g., John 'Roadster' Doe"
              className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded py-3 px-4 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400"
              required
            />
          </div>
          <div className="mb-8">
            <label htmlFor="age" className="block text-left text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Your Age</label>
            <input
              id="age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="How many years on the road?"
              className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded py-3 px-4 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400"
              required
              min="1"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-400 dark:hover:bg-yellow-500 text-white dark:text-gray-900 font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-transform transform hover:scale-105"
          >
            Join the Crew
          </button>
        </form>
      </div>
    </div>
  );
};

export default Welcome;