export interface JantriCell {
  id: string;
  label: string;
  column: number;
  row: number;
  type: 'number' | 'haruf-b' | 'haruf-a';
}

export type GridMode = '1-100' | '00-99' | '0-99';

export interface ParchiHouse {
  number: string;
  amount: number;
}

export interface ParchiItem {
  id: number;
  parchiNumber: number;
  houses: ParchiHouse[];
  totalAmount: number;
}

export interface UserPlan {
  status: 'active' | 'expired';
  startDate: string;
  expiryDate: string;
  planName?: string;
}

export interface UserProfile {
  phoneNumber: string;
  password: string;
  role: 'admin' | 'user';
  currentSessionToken: string;
  lastLoginAt: string;
  isActive: boolean;
  createdAt: string;
  plan?: UserPlan;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

