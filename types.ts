
export interface Profile {
  id: string; // Corresponds to Supabase auth user.id
  name: string;
  age: number;
  avatar_url?: string;
  role?: 'leader' | 'member';
}

export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface Ride {
  id: string; // UUID from Supabase
  date: string;
  meetingPoint: string;
  destination: string;
  routePoints: RoutePoint[];
  startTime?: number;
  endTime?: number;
  isFavorite?: boolean;
  recorder_id?: string; // User ID of the person who recorded the ride
  distance?: number; // in km
  duration?: number; // in milliseconds
}

export interface ChatMessage {
  id: string;
  text?: string;
  imageUrl?: string;
  user_id: string;
  timestamp: string; // ISO 8601 string from Supabase
  profiles?: Profile; // Populated by a JOIN query
}