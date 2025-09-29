
export interface User {
  name: string;
  age: number;
  avatar?: string;
  role?: 'leader' | 'member';
}

export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface Ride {
  id: string;
  date: string;
  meetingPoint: string;
  destination: string;
  routePoints: RoutePoint[];
  startTime?: number;
  endTime?: number;
  isFavorite?: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  contact: string; // email or phone
}

export interface ChatMessage {
  id: string;
  text?: string;
  imageUrl?: string;
  sender: string;
  timestamp: number;
}