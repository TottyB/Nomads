import React from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarIcon, MapPinIcon, UsersIcon } from './Icons';

const Navbar: React.FC = () => {
  const linkClasses = "flex flex-col items-center justify-center w-full h-full transition-colors duration-200";
  const activeLinkClasses = "text-yellow-500 dark:text-yellow-400";
  const inactiveLinkClasses = "text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-300";

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
      <div className="flex justify-around items-center h-full max-w-4xl mx-auto">
        <NavLink to="/" className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>
          <CalendarIcon className="w-7 h-7 mb-1" />
          <span className="text-xs font-medium">Schedule</span>
        </NavLink>
        <NavLink to="/record" className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>
          <MapPinIcon className="w-7 h-7 mb-1" />
          <span className="text-xs font-medium">Record Ride</span>
        </NavLink>
        <NavLink to="/team" className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>
          <UsersIcon className="w-7 h-7 mb-1" />
          <span className="text-xs font-medium">Team</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;