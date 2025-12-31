import React, { useState } from 'react';
import { Driver, FuelRecord, Vehicle } from '../types';
import { Plus, Search, User, Phone, CreditCard, X, Camera, MoreVertical, Pencil, Trash2, History, Fuel, Calendar, MapPin } from 'lucide-react';

interface DriverListProps {
  drivers: Driver[];
  fuelRecords: FuelRecord[];
  vehicles: Vehicle[];
  onAddDriver: (d: Omit<Driver, 'id'>) => void;
  onUpdateDriver: (d: Driver) => void;
  onDeleteDriver: (id: string) => void;
}

export const DriverList: React.FC<DriverListProps> = ({ drivers, fuelRecords, vehicles, onAddDriver, onUpdateDriver, onDeleteDriver }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedDriverHistory, setSelectedDriverHistory] = useState<Driver | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Driver, 'id'>>({
    name: '', licenseNumber: '', licenseCategory: 'B', phone: '', status: 'Ativo', photoUrl: ''
  });

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.licenseNumber.includes(searchTerm)
  );

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ name: '', licenseNumber: '', licenseCategory: 'B', phone: '', status: 'Ativo', photoUrl: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (driver: Driver) => {
    setEditingId(driver.id);
    setFormData({ ...driver });
    setIsModalOpen(true);
  };

  const handleOpenHistory = (driver: Driver) => {
    setSelectedDriverHistory(driver);
    setIsHistoryOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdateDriver({ ...formData, id: editingId } as Driver);
    } else {
      onAddDriver(formData);
    }
    setIsModalOpen(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const getVehiclePlate = (id: string) => vehicles.find(v => v.id === id)?.plate || 'N/A';
  const getVehicleName = (id: string) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `${v.brand} ${v.model}` : 'Veículo Desconhecido';
  };

  const driverActivities = selectedDriverHistory 
    ? fuelRecords.filter(r => r.driverId === selectedDriverHistory.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Motoristas</h2>
          <p className="text-slate-500 dark:text-slate-400">Gerencie a equipe de condutores da frota.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-600/20"
        >
          <Plus size={20} />
          Cadastrar Motorista
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar motorista por nome ou CNH..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDrivers.map((driver) => (
          <div key={driver.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-all group">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 overflow-hidden border border-slate-200 dark:border-slate-600">
                    {driver.photoUrl ? (
                      <img src={driver.photoUrl} alt={driver.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl">
                        {driver.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">{driver.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${driver.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500'}`}>
                      {driver.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleOpenEdit(driver)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                    <Pencil size={18} />
                  </button>
                  <button onClick={() => onDeleteDriver(driver.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <CreditCard size={16} className="text-indigo-500" />
                  <span>CNH: <b>{driver.licenseNumber}</b> ({driver.licenseCategory})</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <Phone size={16} className="text-indigo-500" />
                  <span>{driver.phone}</span>
                </div>
              </div>
            </div>
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
               <span className="text-xs text-slate-400">ID: {driver.id.slice(0, 8)}</span>
               <button 
                onClick={() => handleOpenHistory(driver)}
                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
               >
                 <History size={12} /> Ver Histórico
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Cadastro Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {editingId ? 'Editar Motorista' : 'Novo Motorista'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="flex justify-center mb-4">
                <div className="relative group cursor-pointer">
                  <input type="file" id="driver-photo" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  <label htmlFor="driver-photo" className="block relative">
                    <div className="w-24 h-24 rounded-3xl border-4 border-slate-100 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-700 flex items-center justify-center group-hover:border-indigo-100 transition-colors">
                      {formData.photoUrl ? (
                        <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User className="text-slate-300" size={40} />
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-xl shadow-lg group-hover:bg-indigo-700">
                      <Camera size={16} />
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nome Completo</label>
                <input required type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">CNH</label>
                  <input required type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={formData.licenseNumber} onChange={e => setFormData({...formData, licenseNumber: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Categoria</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={formData.licenseCategory} onChange={e => setFormData({...formData, licenseCategory: e.target.value})}>
                    {['A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Telefone</label>
                  <input required type="text" placeholder="(00) 00000-0000" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20">
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Motorista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Histórico Modal */}
      {isHistoryOpen && selectedDriverHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-indigo-600 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden">
                   {selectedDriverHistory.photoUrl ? (
                     <img src={selectedDriverHistory.photoUrl} className="w-full h-full object-cover" />
                   ) : (
                     <User size={24} />
                   )}
                </div>
                <div>
                  <h3 className="text-lg font-bold">Histórico de Atividades</h3>
                  <p className="text-xs text-indigo-100 font-medium">{selectedDriverHistory.name}</p>
                </div>
              </div>
              <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
               {driverActivities.length > 0 ? (
                 <div className="space-y-4">
                   {driverActivities.map((fuel) => (
                     <div key={fuel.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex items-start gap-3">
                           <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                             <Fuel size={20} />
                           </div>
                           <div>
                              <p className="font-bold text-slate-800 dark:text-white">Abastecimento</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{getVehicleName(fuel.vehicleId)} • <span className="font-mono text-xs">{getVehiclePlate(fuel.vehicleId)}</span></p>
                              {fuel.location && (
                                <p className="text-[10px] text-emerald-600 flex items-center gap-1 mt-1 font-bold">
                                  <MapPin size={10} /> Localização Capturada
                                </p>
                              )}
                           </div>
                        </div>
                        <div className="flex flex-row sm:flex-col justify-between items-center sm:items-end text-right">
                           <div className="flex items-center gap-1 text-slate-400 text-xs">
                             <Calendar size={12} /> {new Date(fuel.date).toLocaleDateString()}
                           </div>
                           <p className="font-black text-slate-900 dark:text-white mt-1">R$ {fuel.totalCost.toFixed(2)}</p>
                           <p className="text-[10px] text-slate-500 uppercase font-bold">{fuel.liters} Litros</p>
                        </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="py-12 text-center text-slate-400">
                    <Fuel className="mx-auto mb-3 opacity-20" size={48} />
                    <p>Nenhuma atividade registrada para este motorista.</p>
                 </div>
               )}
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 text-center">
              <button 
                onClick={() => setIsHistoryOpen(false)}
                className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-300 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};