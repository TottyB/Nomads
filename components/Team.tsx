import React, { useState, useRef } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { TeamMember, User } from '../types';
import { PlusIcon, UsersIcon, PencilIcon } from './Icons';
import Avatar from './Avatar';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

const Team: React.FC = () => {
  const [user, setUser] = useLocalStorage<User | null>('user', null);
  const [members, setMembers] = useLocalStorage<TeamMember[]>('teamMembers', []);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberContact, setNewMemberContact] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMemberName.trim() && newMemberContact.trim()) {
      const newMember: TeamMember = {
        id: generateId(),
        name: newMemberName.trim(),
        contact: newMemberContact.trim(),
      };
      setMembers([...members, newMember]);
      setNewMemberName('');
      setNewMemberContact('');
      setIsAddingMember(false);
    }
  };
  
  const removeMember = (id: string) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
        setMembers(members.filter(member => member.id !== id));
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 256;
          let { width, height } = img;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL(file.type, 0.9);

          if (user) {
            setUser({ ...user, avatar: dataUrl });
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-4 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-yellow-500 dark:text-yellow-400">Our Crew</h1>
         <button
          onClick={() => setIsAddingMember(!isAddingMember)}
          className="bg-yellow-500 dark:bg-yellow-400 text-white dark:text-gray-900 rounded-full p-2 hover:bg-yellow-600 dark:hover:bg-yellow-500 transition-transform transform hover:scale-110"
          aria-label="Add new member"
        >
          <PlusIcon className="w-6 h-6" />
        </button>
      </div>

      {/* --- User Profile Section --- */}
      {user && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-6 shadow-lg flex items-center gap-4">
          <div className="relative group">
            <Avatar name={user.name} src={user.avatar} className="w-16 h-16" />
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 flex items-center justify-center rounded-full transition-opacity cursor-pointer"
              aria-label="Change avatar"
            >
              <PencilIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
          <div>
            <h2 className="text-xl font-bold">{user.name}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Welcome to the crew!</p>
          </div>
          <input
            type="file"
            ref={avatarInputRef}
            onChange={handleAvatarChange}
            className="hidden"
            accept="image/png, image/jpeg"
          />
        </div>
      )}

      {/* --- Add Member Section --- */}
      {isAddingMember && (
        <form onSubmit={handleAddMember} className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-6 shadow-lg animate-fade-in-down">
          <h2 className="text-xl font-semibold mb-4">Add a New Member</h2>
          <div className="space-y-4">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Member's Name"
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400"
                required
              />
               <input
                type="text"
                value={newMemberContact}
                onChange={(e) => setNewMemberContact(e.target.value)}
                placeholder="Email or phone"
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400"
                required
              />
          </div>
          <button
            type="submit"
            className="w-full mt-4 bg-yellow-500 dark:bg-yellow-400 hover:bg-yellow-600 dark:hover:bg-yellow-500 text-white dark:text-gray-900 font-bold py-3 px-4 rounded-lg"
          >
            Add to Crew
          </button>
        </form>
      )}

      {/* --- Member List --- */}
      <div>
        {members.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-12">
            <UsersIcon className="w-16 h-16 mx-auto mb-4" />
            <p>Your crew is empty.</p>
            <p>Tap the '+' button to add your fellow nomads!</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {members.map(member => (
              <li key={member.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md flex items-center gap-4 transition-shadow hover:shadow-lg">
                <Avatar name={member.name || member.contact} className="w-14 h-14" />
                <div className="flex-grow">
                    <p className="font-bold text-lg text-gray-800 dark:text-gray-200">{member.name || member.contact}</p>
                    {member.name && <p className="text-sm text-gray-500 dark:text-gray-400">{member.contact}</p>}
                </div>
                <button 
                  onClick={() => removeMember(member.id)} 
                  className="text-gray-400 hover:text-red-500 font-semibold text-xs px-3 py-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50"
                  aria-label={`Remove ${member.name || member.contact}`}
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