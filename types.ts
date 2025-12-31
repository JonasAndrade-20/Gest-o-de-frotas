export enum VehicleStatus {
  ACTIVE = 'Ativo',
  MAINTENANCE = 'Em Manutenção',
  RETIRED = 'Aposentado'
}

export enum MaintenanceStatus {
  PENDING = 'Pendente',
  IN_PROGRESS = 'Em Andamento',
  COMPLETED = 'Concluído'
}

export enum Periodicity {
  DAYS_30 = 'Mensal (30 dias)',
  DAYS_60 = 'Bimestral (60 dias)',
  DAYS_90 = 'Trimestral (90 dias)',
  DAYS_180 = 'Semestral (180 dias)',
  DAYS_365 = 'Anual (365 dias)',
  CUSTOM = 'Personalizado'
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export interface AppSettings {
  fleetName: string;
  currency: string;
  distanceUnit: 'km' | 'mi';
  notificationsEnabled: boolean;
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  phone: string;
  status: 'Ativo' | 'Inativo';
  photoUrl?: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  status: VehicleStatus;
  mileage: number;
  photoUrl?: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  description: string;
  cost: number;
  date: string;
  status: MaintenanceStatus;
  type: 'Preventiva' | 'Corretiva' | 'Emergencial';
}

export interface FuelRecord {
  id: string;
  vehicleId: string;
  driverId: string;
  date: string;
  odometer: number;
  liters: number;
  totalCost: number;
  receiptUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface AIInsight {
  summary: string;
  savings_opportunity: string;
  urgent_attention: string;
  fleet_health_score: number;
}

export type ViewState = 'DASHBOARD' | 'VEHICLES' | 'DRIVERS' | 'MAINTENANCE' | 'FUEL' | 'SETTINGS' | 'PROFILE' | 'PLANNER';