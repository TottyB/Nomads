import React, { useState, useRef, useEffect } from 'react';
import type { Profile } from '../types';
import { UsersIcon, PencilIcon } from './Icons';
import Avatar from './Avatar';
import { useAuth } from '../contexts/AuthContext';

const Team: React.FC = () => {
  const { supabase, profile, setProfile, isOnline } = useAuth();
  const [members, setMembers] = useState<Profile[]>([]);
  
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) {
        console.error("Error fetching members", error);
      } else {
        setMembers(data);
      }
    };
    fetchMembers();
  }, [supabase]);


  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

      if (uploadError) {
        alert("Error uploading avatar: " + uploadError.message);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) {
        alert("Error updating profile: " + updateError.message);
      } else {
        setProfile({ ...profile, avatar_url: publicUrl });
      }
    }
  };

  return (
    <div className="p-4 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-yellow-500 dark:text-yellow-400">Our Crew</h1>
      </div>

      {/* --- User Profile Section --- */}
      {profile && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-6 shadow-lg flex items-center gap-4">
          <div className="relative group">
            <Avatar name={profile.name} src={profile.avatar_url} className="w-16 h-16" />
            <button
              onClick={() => isOnline && avatarInputRef.current?.click()}
              className={`absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 flex items-center justify-center rounded-full transition-opacity ${isOnline ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              aria-label="Change avatar"
              disabled={!isOnline}
            >
              <PencilIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
          <div>
            <h2 className="text-xl font-bold">{profile.name}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Welcome to the crew!</p>
          </div>
          <input
            type="file"
            ref={avatarInputRef}
            onChange={handleAvatarChange}
            className="hidden"
            accept="image/png, image/jpeg"
            disabled={!isOnline}
          />
        </div>
      )}

      {/* --- Member List --- */}
      <div>
        {members.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-12">
            <UsersIcon className="w-16 h-16 mx-auto mb-4" />
            <p>Loading crew members...</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {members.map(member => (
              <li key={member.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md flex items-center gap-4 transition-shadow hover:shadow-lg">
                <Avatar name={member.name} src={member.avatar_url} className="w-14 h-14" />
                <div className="flex-grow">
                    <p className="font-bold text-lg text-gray-800 dark:text-gray-200">{member.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.role === 'leader' ? 'Leader' : 'Member'}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Team;