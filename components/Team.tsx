import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { TeamMember } from '../types';
import { PlusIcon, UsersIcon } from './Icons';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

const Team: React.FC = () => {
  const [members, setMembers] = useLocalStorage<TeamMember[]>('teamMembers', []);
  const [contact, setContact] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contact.trim()) {
      const newMember: TeamMember = {
        id: generateId(),
        contact: contact.trim(),
      };
      setMembers([...members, newMember]);
      setContact('');
    }
  };
  
  const removeMember = (id: string) => {
    setMembers(members.filter(member => member.id !== id));
  }

  return (
    <div className="p-4 pb-24">
      <h1 className="text-3xl font-bold text-yellow-500 dark:text-yellow-400 mb-6">Our Crew</h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-6 shadow-lg flex items-center gap-4">
        <input
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Add member by email or phone"
          className="flex-grow bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400"
          required
        />
        <button
          type="submit"
          className="bg-yellow-500 dark:bg-yellow-400 text-white dark:text-gray-900 rounded-full p-3 hover:bg-yellow-600 dark:hover:bg-yellow-500 transition-transform transform hover:scale-110"
          aria-label="Add team member"
        >
          <PlusIcon className="w-6 h-6" />
        </button>
      </form>

      <div>
        {members.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-12">
            <UsersIcon className="w-16 h-16 mx-auto mb-4" />
            <p>Your crew is empty.</p>
            <p>Add your fellow nomads to get started!</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {members.map(member => (
              <li key={member.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex justify-between items-center">
                <span className="text-gray-800 dark:text-gray-200">{member.contact}</span>
                <button 
                  onClick={() => removeMember(member.id)} 
                  className="text-red-500 hover:text-red-400 font-bold"
                  aria-label={`Remove ${member.contact}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Team;