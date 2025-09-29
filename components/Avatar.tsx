import React from 'react';

// Function to generate a consistent color from a string
const stringToColor = (str: string): string => {
  if (!str) return '#cccccc';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};

// Function to get initials from a name
const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length > 1) {
    return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Determines if text should be light or dark based on background color
const getTextColor = (hexcolor: string): string => {
    hexcolor = hexcolor.replace("#", "");
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'text-gray-800' : 'text-white';
}

interface AvatarProps {
  name: string;
  src?: string | null;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ name, src, className = 'w-10 h-10' }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  const bgColor = stringToColor(name);
  const initials = getInitials(name);
  const textColor = getTextColor(bgColor);

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold flex-shrink-0 select-none ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      <span className={`${textColor} text-sm`}>{initials}</span>
    </div>
  );
};

export default Avatar;
