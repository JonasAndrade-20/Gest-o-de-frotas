
import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { VehicleList } from './components/VehicleList';
import { DriverList } from './components/DriverList';
import { MaintenanceList } from './components/MaintenanceList';
import { MaintenancePlanner } from './components/MaintenancePlanner';
import { FuelList } from './components/FuelList';
import { SettingsView } from './components/SettingsView';
import { ProfileView } from './components/ProfileView';
import { Login } from './components/Login';
import { ViewState, Vehicle, MaintenanceRecord, VehicleStatus, MaintenanceStatus, FuelRecord, UserProfile, AppSettings, Driver } from './types';
import { Menu, Moon, Sun, Loader2, User, Bell, X, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Jonas Andrade',
    email: 'engmecjonas20@gmail.com',
    role: 'Administrador',
    avatarUrl: ''
  });

  const [settings, setSettings] = useState<AppSettings>({
    fleetName: 'Minha Frota Fleet AI',
    currency: 'BRL',
    distanceUnit: 'km',
    notificationsEnabled: true
  });

  // Mapeadores de Dados
  const mapVehicle = (v: any): Vehicle => ({
    id: v.id,
    plate: v.plate,
    brand: v.brand,
    model: v.model,
    year: v.year,
    status: v.status as VehicleStatus,
    mileage: Number(v.mileage),
    photoUrl: v.photo_url || ''
  });

  const mapDriver = (d: any): Driver => ({
    id: d.id,
    name: d.name,
    licenseNumber: d.license_number,
    licenseCategory: d.license_category,
    phone: d.phone,
    status: d.status,
    photoUrl: d.photo_url || ''
  });

  const mapMaintenance = (m: any): MaintenanceRecord => ({
    id: m.id,
    vehicleId: m.vehicle_id,
    description: m.description,
    cost: Number(m.cost),
    date: m.date,
    status: m.status as MaintenanceStatus,
    type: m.type as MaintenanceRecord['type']
  });

  const mapFuel = (f: any): FuelRecord => ({
    id: f.id,
    vehicleId: f.vehicle_id,
    driverId: f.driver_id,
    date: f.date,
    odometer: Number(f.odometer),
    liters: Number(f.liters),
    totalCost: Number(f.total_cost),
    receiptUrl: f.receipt_url || '',
    location: f.location
  });

  // Lógica de Notificações/Alertas (CORRIGIDA PARA TIMEZONE)
  const maintenanceAlerts = useMemo(() => {
    if (!settings.notificationsEnabled) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    return maintenance
      .filter(m => m.status === MaintenanceStatus.PENDING || m.status === MaintenanceStatus.IN_PROGRESS)
      .map(m => {
        // CORREÇÃO: Parse manual dos componentes da data para evitar timezone shift
        const [year, month, day] = m.date.split('-').map(Number);
        const mDate = new Date(year, month - 1, day);
        
        const isOverdue = mDate < today;
        const isUpcoming = mDate >= today && mDate <= nextWeek;
        const vehicle = vehicles.find(v => v.id === m.vehicleId);
        
        return {
          ...m,
          isOverdue,
          isUpcoming,
          vehiclePlate: vehicle?.plate || '---'
        };
      })
      .filter(m => m.isOverdue || m.isUpcoming)
      .sort((a, b) => new Date(a.date + 'T12:00:00').getTime() - new Date(b.date + 'T12:00:00').getTime());
  }, [maintenance, vehicles, settings.notificationsEnabled]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        setUserProfile(prev => ({ ...prev, email: session.user.email || 'engmecjonas20@gmail.com' }));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        setUserProfile(prev => ({ ...prev, email: session.user.email || 'engmecjonas20@gmail.com' }));
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const fetchData = async () => {
    if (!isAuthenticated) return;
    setIsLoadingData(true);
    try {
      const [vRes, dRes, mRes, fRes] = await Promise.all([
        supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
        supabase.from('drivers').select('*').order('name'),
        supabase.from('maintenance_records').select('*').order('date', { ascending: false }),
        supabase.from('fuel_records').select('*').order('date', { ascending: false })
      ]);

      if (vRes.error) throw vRes.error;
      if (dRes.error) throw dRes.error;
      if (mRes.error) throw mRes.error;
      if (fRes.error) throw fRes.error;

      setVehicles((vRes.data || []).map(mapVehicle));
      setDrivers((dRes.data || []).map(mapDriver));
      setMaintenance((mRes.data || []).map(mapMaintenance));
      setFuelRecords((fRes.data || []).map(mapFuel));
    } catch (error: any) {
      console.error('Fetch error:', error.message);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setCurrentView('DASHBOARD');
  };

  // Operações de Veículo
  const handleAddVehicle = async (newVehicle: Omit<Vehicle, 'id'>) => {
    const payload = { 
      plate: newVehicle.plate,
      brand: newVehicle.brand,
      model: newVehicle.model,
      year: newVehicle.year,
      status: newVehicle.status,
      mileage: newVehicle.mileage,
      photo_url: newVehicle.photoUrl?.trim() ? newVehicle.photoUrl : null 
    };
    const { data, error } = await supabase.from('vehicles').insert([payload]).select();
    if (error) {
      alert(`Erro ao cadastrar veículo: ${error.message}`);
    } else if (data) {
      setVehicles(prev => [mapVehicle(data[0]), ...prev]);
    }
  };

  const handleUpdateVehicle = async (updatedVehicle: Vehicle) => {
    const { id, ...v } = updatedVehicle;
    const payload = {
      plate: v.plate,
      brand: v.brand,
      model: v.model,
      year: v.year,
      status: v.status,
      mileage: v.mileage,
      photo_url: v.photoUrl?.trim() ? v.photoUrl : null
    };
    const { error } = await supabase.from('vehicles').update(payload).eq('id', id);
    if (error) alert(`Erro ao atualizar veículo: ${error.message}`);
    else setVehicles(prev => prev.map(v => v.id === id ? updatedVehicle : v));
  };

  const handleDeleteVehicle = async (id: string) => {
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) alert(`Erro ao excluir veículo: ${error.message}`);
    else setVehicles(prev => prev.filter(v => v.id !== id));
  };

  // Operações de Motorista
  const handleAddDriver = async (newDriver: Omit<Driver, 'id'>) => {
    const payload = {
      name: newDriver.name,
      license_number: newDriver.licenseNumber,
      license_category: newDriver.licenseCategory,
      phone: newDriver.phone,
      status: newDriver.status,
      photo_url: newDriver.photoUrl?.trim() ? newDriver.photoUrl : null
    };
    const { data, error } = await supabase.from('drivers').insert([payload]).select();
    if (error) {
      alert(`Erro ao cadastrar motorista: ${error.message}`);
    } else if (data) {
      setDrivers(prev => [mapDriver(data[0]), ...prev]);
    }
  };

  const handleUpdateDriver = async (updatedDriver: Driver) => {
    const { id, ...d } = updatedDriver;
    const payload = {
      name: d.name,
      license_number: d.licenseNumber,
      license_category: d.licenseCategory,
      phone: d.phone,
      status: d.status,
      photo_url: d.photoUrl?.trim() ? d.photoUrl : null
    };
    const { error } = await supabase.from('drivers').update(payload).eq('id', id);
    if (error) alert(`Erro ao atualizar motorista: ${error.message}`);
    else setDrivers(prev => prev.map(d => d.id === id ? updatedDriver : d));
  };

  const handleDeleteDriver = async (id: string) => {
    const { error } = await supabase.from('drivers').delete().eq('id', id);
    if (error) alert(`Erro ao excluir motorista: ${error.message}`);
    else setDrivers(prev => prev.filter(d => d.id !== id));
  };

  const handleAddMaintenance = async (newOrder: Omit<MaintenanceRecord, 'id'>) => {
    const payload = {
      vehicle_id: newOrder.vehicleId,
      description: newOrder.description,
      cost: newOrder.cost,
      date: newOrder.date,
      status: newOrder.status,
      type: newOrder.type
    };
    const { data, error } = await supabase.from('maintenance_records').insert([payload]).select();
    if (error) alert(`Erro ao salvar manutenção: ${error.message}`);
    else if (data) setMaintenance(prev => [mapMaintenance(data[0]), ...prev]);
  };

  const handleScheduleBatchMaintenance = async (batch: Omit<MaintenanceRecord, 'id'>[]) => {
    const payloads = batch.map(b => ({
      vehicle_id: b.vehicleId,
      description: b.description,
      cost: b.cost,
      date: b.date,
      status: b.status,
      type: b.type
    }));
    const { data, error } = await supabase.from('maintenance_records').insert(payloads).select();
    if (error) alert(`Erro no agendamento em lote: ${error.message}`);
    else if (data) setMaintenance(prev => [...data.map(mapMaintenance), ...prev]);
  };

  const handleUpdateMaintenance = async (updatedOrder: MaintenanceRecord) => {
    const { id, ...m } = updatedOrder;
    const payload = {
      vehicle_id: m.vehicleId,
      description: m.description,
      cost: m.cost,
      date: m.date,
      status: m.status,
      type: m.type
    };
    const { error } = await supabase.from('maintenance_records').update(payload).eq('id', id);
    if (error) alert(`Erro ao atualizar manutenção: ${error.message}`);
    else setMaintenance(prev => prev.map(rec => rec.id === id ? updatedOrder : rec));
  };

  const handleAddFuel = async (newFuel: Omit<FuelRecord, 'id'>) => {
    const payload = {
      vehicle_id: newFuel.vehicleId,
      driver_id: newFuel.driverId,
      date: newFuel.date,
      odometer: newFuel.odometer,
      liters: newFuel.liters,
      total_cost: newFuel.totalCost,
      receipt_url: newFuel.receiptUrl?.trim() ? newFuel.receiptUrl : null,
      location: newFuel.location
    };
    const { data, error } = await supabase.from('fuel_records').insert([payload]).select();
    if (error) {
      alert(`Erro ao salvar abastecimento: ${error.message}`);
    } else if (data) {
      setFuelRecords(prev => [mapFuel(data[0]), ...prev]);
      const vehicle = vehicles.find(v => v.id === newFuel.vehicleId);
      if (vehicle && newFuel.odometer > vehicle.mileage) handleUpdateVehicle({ ...vehicle, mileage: newFuel.odometer });
    }
  };

  const handleUpdateFuel = async (updatedFuel: FuelRecord) => {
    const { id, ...f } = updatedFuel;
    const payload = {
      vehicle_id: f.vehicleId,
      driver_id: f.driverId,
      date: f.date,
      odometer: f.odometer,
      liters: f.liters,
      total_cost: f.totalCost,
      receipt_url: f.receiptUrl?.trim() ? f.receiptUrl : null,
      location: f.location
    };
    const { error } = await supabase.from('fuel_records').update(payload).eq('id', id);
    if (error) alert(`Erro ao atualizar abastecimento: ${error.message}`);
    else setFuelRecords(prev => prev.map(rec => rec.id === id ? updatedFuel : rec));
  };

  const renderContent = () => {
    if (isLoadingData && isAuthenticated) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Sincronizando dados...</p>
        </div>
      );
    }

    switch (currentView) {
      case 'DASHBOARD': return <Dashboard vehicles={vehicles} maintenance={maintenance} fuelRecords={fuelRecords} onNavigate={setCurrentView} />;
      case 'VEHICLES': return <VehicleList vehicles={vehicles} onAddVehicle={handleAddVehicle} onUpdateVehicle={handleUpdateVehicle} onDeleteVehicle={handleDeleteVehicle} />;
      case 'DRIVERS': return <DriverList drivers={drivers} fuelRecords={fuelRecords} vehicles={vehicles} onAddDriver={handleAddDriver} onUpdateDriver={handleUpdateDriver} onDeleteDriver={handleDeleteDriver} />;
      case 'MAINTENANCE': return <MaintenanceList maintenance={maintenance} vehicles={vehicles} onAddMaintenance={handleAddMaintenance} onUpdateMaintenance={handleUpdateMaintenance} />;
      case 'PLANNER': return <MaintenancePlanner vehicles={vehicles} onScheduleMaintenance={handleScheduleBatchMaintenance} />;
      case 'FUEL': return <FuelList fuelRecords={fuelRecords} vehicles={vehicles} drivers={drivers} onAddFuel={handleAddFuel} onUpdateFuel={handleUpdateFuel} />;
      case 'SETTINGS': return <SettingsView settings={settings} onUpdateSettings={setSettings} />;
      case 'PROFILE': return <ProfileView user={userProfile} onUpdateUser={setUserProfile} vehicles={vehicles} maintenance={maintenance} fuelRecords={fuelRecords} />;
      default: return <Dashboard vehicles={vehicles} maintenance={maintenance} fuelRecords={fuelRecords} onNavigate={setCurrentView} />;
    }
  };

  if (!isAuthenticated) return <Login onLogin={(email) => { setIsAuthenticated(true); setUserProfile(p => ({...p, email})); }} />;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans">
      <Sidebar 
        currentView={currentView} setView={setCurrentView} 
        isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} 
        onLogout={handleLogout} 
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ml-64">
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600 lg:hidden rounded-lg hover:bg-slate-100">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-4 ml-auto">
            {/* Sistema de Notificações */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative ${maintenanceAlerts.length > 0 && settings.notificationsEnabled ? 'text-indigo-600 dark:text-indigo-400' : ''}`}
              >
                <Bell size={20} />
                {maintenanceAlerts.length > 0 && settings.notificationsEnabled && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-bounce">
                    {maintenanceAlerts.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                  <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-in">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center">
                       <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Alertas de Frota</h4>
                       <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                    </div>
                    <div className="max-h-96 overflow-y-auto p-2 space-y-1">
                      {maintenanceAlerts.length > 0 ? (
                        maintenanceAlerts.map((alert) => (
                          <div 
                            key={alert.id} 
                            onClick={() => { setCurrentView('MAINTENANCE'); setShowNotifications(false); }}
                            className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all hover:scale-[1.02] ${
                              alert.isOverdue 
                                ? 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30' 
                                : 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30'
                            }`}
                          >
                            <div className={`p-2 rounded-lg shrink-0 ${alert.isOverdue ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                              {alert.isOverdue ? <AlertCircle size={16} /> : <Clock size={16} />}
                            </div>
                            <div className="min-w-0">
                               <p className={`text-xs font-black uppercase tracking-tighter ${alert.isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                                 {alert.isOverdue ? 'Atrasada' : 'Próxima'}
                               </p>
                               <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{alert.description}</p>
                               <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Veículo: {alert.vehiclePlate} • {new Date(alert.date + 'T12:00:00').toLocaleDateString()}</p>
                            </div>
                            <ChevronRight size={14} className="ml-auto mt-1 text-slate-400" />
                          </div>
                        ))
                      ) : (
                        <div className="py-10 text-center space-y-2">
                           <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                              <Bell size={24} className="opacity-40" />
                           </div>
                           <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Frota em dia! Sem alertas pendentes.</p>
                        </div>
                      )}
                    </div>
                    {maintenanceAlerts.length > 0 && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 text-center">
                        <button 
                          onClick={() => { setCurrentView('MAINTENANCE'); setShowNotifications(false); }}
                          className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline"
                        >
                          Gerenciar todas as manutenções
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div onClick={() => setCurrentView('PROFILE')} className="flex items-center gap-3 cursor-pointer pl-4 border-l border-slate-200 dark:border-slate-800">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{userProfile.name}</p>
                <p className="text-[10px] text-slate-500 font-medium">{userProfile.email}</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center overflow-hidden shadow-sm">
                {userProfile.avatarUrl ? <img src={userProfile.avatarUrl} className="w-full h-full object-cover" /> : <User size={20} className="text-indigo-600" />}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
};

export default App;
