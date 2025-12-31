import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { VehicleList } from './components/VehicleList';
import { MaintenanceList } from './components/MaintenanceList';
import { FuelList } from './components/FuelList';
import { ViewState, Vehicle, MaintenanceRecord, VehicleStatus, MaintenanceStatus, FuelRecord } from './types';
import { Menu, Moon, Sun } from 'lucide-react';

// Mock Data
const INITIAL_VEHICLES: Vehicle[] = [
  { id: '1', plate: 'ABC-1234', brand: 'Toyota', model: 'Corolla XEi', year: 2021, status: VehicleStatus.ACTIVE, mileage: 45000 },
  { id: '2', plate: 'XYZ-9876', brand: 'Fiat', model: 'Fiorino', year: 2020, status: VehicleStatus.MAINTENANCE, mileage: 82000 },
  { id: '3', plate: 'DEF-5678', brand: 'Volkswagen', model: 'Saveiro', year: 2022, status: VehicleStatus.ACTIVE, mileage: 25000 },
  { id: '4', plate: 'GHI-9012', brand: 'Renault', model: 'Master', year: 2019, status: VehicleStatus.ACTIVE, mileage: 120000 },
  { id: '5', plate: 'JKL-3456', brand: 'Ford', model: 'Ranger', year: 2023, status: VehicleStatus.ACTIVE, mileage: 15000 },
];

const INITIAL_MAINTENANCE: MaintenanceRecord[] = [
  { id: '101', vehicleId: '2', description: 'Troca de Embreagem', cost: 1200, date: '2023-10-15', status: MaintenanceStatus.IN_PROGRESS, type: 'Corretiva' },
  { id: '102', vehicleId: '1', description: 'Revisão 40.000km', cost: 850, date: '2023-09-20', status: MaintenanceStatus.COMPLETED, type: 'Preventiva' },
  { id: '103', vehicleId: '4', description: 'Troca de Pneus', cost: 3200, date: '2023-08-10', status: MaintenanceStatus.COMPLETED, type: 'Preventiva' },
  { id: '104', vehicleId: '2', description: 'Troca de Óleo', cost: 350, date: '2023-07-05', status: MaintenanceStatus.COMPLETED, type: 'Preventiva' },
  { id: '105', vehicleId: '3', description: 'Alinhamento e Balanceamento', cost: 180, date: '2023-10-25', status: MaintenanceStatus.PENDING, type: 'Preventiva' },
];

const INITIAL_FUEL: FuelRecord[] = [
  { id: '201', vehicleId: '1', date: '2023-10-20', odometer: 44800, liters: 45, totalCost: 250.00 },
  { id: '202', vehicleId: '4', date: '2023-10-18', odometer: 119500, liters: 60, totalCost: 340.00 },
  { id: '203', vehicleId: '1', date: '2023-09-15', odometer: 44200, liters: 40, totalCost: 220.00 },
  { id: '204', vehicleId: '4', date: '2023-09-10', odometer: 118800, liters: 55, totalCost: 310.00 }
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // App State
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>(INITIAL_MAINTENANCE);
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>(INITIAL_FUEL);

  // Effect to handle dark mode class on HTML element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleAddVehicle = (newVehicle: Omit<Vehicle, 'id'>) => {
    const v: Vehicle = { ...newVehicle, id: Math.random().toString(36).substr(2, 9) };
    setVehicles([...vehicles, v]);
  };

  const handleUpdateVehicle = (updatedVehicle: Vehicle) => {
    setVehicles(vehicles.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
  };

  const handleAddMaintenance = (newOrder: Omit<MaintenanceRecord, 'id'>) => {
    const m: MaintenanceRecord = { ...newOrder, id: Math.random().toString(36).substr(2, 9) };
    setMaintenance([m, ...maintenance]);
  };

  const handleUpdateMaintenance = (updatedOrder: MaintenanceRecord) => {
    setMaintenance(maintenance.map(m => m.id === updatedOrder.id ? updatedOrder : m));
  };

  const handleAddFuel = (newFuel: Omit<FuelRecord, 'id'>) => {
    const f: FuelRecord = { ...newFuel, id: Math.random().toString(36).substr(2, 9) };
    setFuelRecords([f, ...fuelRecords]);
    
    // Opcional: Atualizar quilometragem do veículo se for maior
    const vehicle = vehicles.find(v => v.id === newFuel.vehicleId);
    if (vehicle && newFuel.odometer > vehicle.mileage) {
        handleUpdateVehicle({ ...vehicle, mileage: newFuel.odometer });
    }
  };

  const handleUpdateFuel = (updatedFuel: FuelRecord) => {
    setFuelRecords(fuelRecords.map(f => f.id === updatedFuel.id ? updatedFuel : f));
     // Opcional: Atualizar quilometragem do veículo se for maior
     const vehicle = vehicles.find(v => v.id === updatedFuel.vehicleId);
     if (vehicle && updatedFuel.odometer > vehicle.mileage) {
         handleUpdateVehicle({ ...vehicle, mileage: updatedFuel.odometer });
     }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard 
          vehicles={vehicles} 
          maintenance={maintenance} 
          fuelRecords={fuelRecords}
          onNavigate={setCurrentView}
        />;
      case 'VEHICLES':
        return <VehicleList 
          vehicles={vehicles} 
          onAddVehicle={handleAddVehicle} 
          onUpdateVehicle={handleUpdateVehicle}
        />;
      case 'MAINTENANCE':
        return <MaintenanceList 
          maintenance={maintenance} 
          vehicles={vehicles} 
          onAddMaintenance={handleAddMaintenance} 
          onUpdateMaintenance={handleUpdateMaintenance}
        />;
      case 'FUEL':
        return <FuelList 
          fuelRecords={fuelRecords}
          vehicles={vehicles}
          onAddFuel={handleAddFuel}
          onUpdateFuel={handleUpdateFuel}
        />;
      default:
        return <Dashboard vehicles={vehicles} maintenance={maintenance} fuelRecords={fuelRecords} onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-300">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ml-64">
        {/* Universal Header (Mobile & Desktop) */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between p-4 transition-colors duration-300">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 lg:hidden mr-4">
              <Menu size={24} />
            </button>
            <span className="lg:hidden font-bold text-slate-800 dark:text-white">Fleet AI</span>
            {/* Desktop breadcrumb or title could go here if needed, keeping it clean for now */}
          </div>
          
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setIsDarkMode(!isDarkMode)}
               className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
               title={isDarkMode ? "Modo Claro" : "Modo Escuro"}
             >
               {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button>
             <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
               AD
             </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;