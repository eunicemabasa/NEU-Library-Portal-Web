export type UserRole = 'admin' | 'user';
export type UserType = 'student' | 'faculty' | 'admin';

export interface User {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  user_type: UserType | null;
  college_office: string | null;
  is_blocked: boolean;
  createdAt?: string;
  visitCount?: number;
  history?: Visit[];
}

export interface Visit {
  id: number;
  user_email: string;
  reason: string;
  timestamp: string;
  user_name?: string;
  user_type?: string;
  college_office?: string;
}

export interface Stats {
  totalVisitsToday: number;
  studentVisits: number;
  facultyVisits: number;
  adminVisits: number;
}
