import React from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarIcon, MapPinIcon, UsersIcon, ChatBubbleIcon, TrophyIcon } from './Icons';

const Navbar: React.FC = () => {
  const linkClasses = "flex flex-col items-center justify-center w-full h-full transition-colors duration-200";
  const activeLinkClasses = "text-yellow-500 dark:text-yellow-400";
  const inactiveLinkClasses = "text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-300";

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
      <div className="grid grid-cols-5 h-full max-w-4xl mx-auto">
        <NavLink to="/" className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>
          <CalendarIcon className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Schedule</span>
        </NavLink>
        <NavLink to="/record" className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>
          <MapPinIcon className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Record</span>
        </NavLink>
        <NavLink to="/team" className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>
          <UsersIcon className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Crew</span>
        </NavLink>
        <NavLink to="/chat" className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>
          <ChatBubbleIcon className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Chat</span>
        </NavLink>
        <NavLink to="/leaderboard" className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>
          <TrophyIcon className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Ranks</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;