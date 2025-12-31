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
  date: string;
  odometer: number;
  liters: number;
  totalCost: number;
  receiptUrl?: string;
}

export interface AIInsight {
  summary: string;
  savings_opportunity: string;
  urgent_attention: string;
  fleet_health_score: number;
}

export type ViewState = 'DASHBOARD' | 'VEHICLES' | 'MAINTENANCE' | 'FUEL';