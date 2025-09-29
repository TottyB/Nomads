import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Ride, Profile } from '../types';
import Avatar from './Avatar';
import { TrophyIcon, RouteIcon, MotorcycleIcon } from './Icons';

interface LeaderboardStat {
  profile: Profile;
  totalDistance: number;
  rideCount: number;
}

const Leaderboard: React.FC = () => {
  const { supabase } = useAuth();
  const [stats, setStats] = useState<LeaderboardStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setLoading(true);
      // Fetch all completed rides that have a recorder and distance
      const { data: rides, error: ridesError } = await supabase
        .from('rides')
        .select('recorder_id, distance')
        .not('recorder_id', 'is', null)
        .not('distance', 'is', null);

      if (ridesError) {
        console.error("Error fetching rides for leaderboard:", ridesError);
        setLoading(false);
        return;
      }

      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        console.error("Error fetching profiles for leaderboard:", profilesError);
        setLoading(false);
        return;
      }

      // Process data
      const statsMap = new Map<string, LeaderboardStat>();

      profiles.forEach(p => {
        statsMap.set(p.id, {
          profile: p,
          totalDistance: 0,
          rideCount: 0,
        });
      });

      rides.forEach(ride => {
        if (ride.recorder_id && statsMap.has(ride.recorder_id)) {
          const userStat = statsMap.get(ride.recorder_id)!;
          userStat.totalDistance += ride.distance || 0;
          userStat.rideCount += 1;
        }
      });
      
      const sortedStats = Array.from(statsMap.values()).sort((a, b) => b.totalDistance - a.totalDistance);
      setStats(sortedStats);
      setLoading(false);
    };

    fetchLeaderboardData();
  }, [supabase]);
  
  const getRankColor = (rank: number) => {
      if (rank === 0) return 'text-yellow-400';
      if (rank === 1) return 'text-gray-400';
      if (rank === 2) return 'text-yellow-600';
      return 'text-gray-500 dark:text-gray-400';
  }

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <TrophyIcon className="w-10 h-10 text-yellow-500 dark:text-yellow-400" />
        <h1 className="text-3xl font-bold text-yellow-500 dark:text-yellow-400">Crew Ranks</h1>
      </div>

      {loading ? (
        <p>Calculating rankings...</p>
      ) : stats.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 mt-12">
            <p>No recorded rides yet.</p>
            <p>Complete a ride to appear on the leaderboard!</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {stats.map((stat, index) => (
            <li key={stat.profile.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex items-center gap-4">
              <div className={`w-10 text-2xl font-bold text-center ${getRankColor(index)}`}>
                {index + 1}
              </div>
              <Avatar name={stat.profile.name} src={stat.profile.avatar_url} className="w-14 h-14" />
              <div className="flex-grow">
                <p className="font-bold text-lg">{stat.profile.name}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <div className="flex items-center gap-1">
                        <RouteIcon className="w-4 h-4"/>
                        <span>{stat.totalDistance.toFixed(2)} km</span>
                    </div>
                     <div className="flex items-center gap-1">
                        <MotorcycleIcon className="w-4 h-4"/>
                        <span>{stat.rideCount} {stat.rideCount === 1 ? 'ride' : 'rides'}</span>
                    </div>
                </div>
              </div>
              {index === 0 && <TrophyIcon className="w-8 h-8 text-yellow-400" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Leaderboard;
