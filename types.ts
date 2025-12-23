
export enum UserRole {
  CLIENT = 'CLIENT',
  ADMIN = 'ADMIN'
}

export enum AppStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED'
}

export interface Pet {
  id: string;
  name: string;
  breed: string;
  age?: string;
  type: 'dog' | 'cat' | 'other';
  image: string;
  status?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  image: string;
  rating: number;
}

export interface Appointment {
  id: string;
  petId: string;
  serviceId: string;
  date: string;
  time: string;
  status: AppStatus;
  ownerName: string;
  price: number;
}

export type Screen =
  | 'LOGIN'
  | 'HOME'
  | 'BOOKING'
  | 'MY_APPOINTMENTS'
  | 'PROFILE'
  | 'ADMIN_DASHBOARD'
  | 'ADMIN_AGENDA'
  | 'ADMIN_SERVICES'
  | 'ADMIN_SETTINGS'
  | 'PET_REGISTRATION';
