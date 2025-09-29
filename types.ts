
export interface User {
  name: string;
  age: number;
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
}

export interface TeamMember {
  id: string;
  contact: string; // email or phone
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
}
