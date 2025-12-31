import React, { useState } from 'react';
import { Vehicle, VehicleStatus } from '../types';
import { Plus, Search, Filter, Pencil, X, Camera, Image as ImageIcon } from 'lucide-react';

interface VehicleListProps {
  vehicles: Vehicle[];
  onAddVehicle: (v: Omit<Vehicle, 'id'>) => void;
  onUpdateVehicle: (v: Vehicle) => void;
}

export const VehicleList: React.FC<VehicleListProps> = ({ vehicles, onAddVehicle, onUpdateVehicle }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // New Vehicle Form State
  const [newVehicle, setNewVehicle] = useState<Omit<Vehicle, 'id'>>({
    plate: '', brand: '', model: '', year: new Date().getFullYear(), mileage: 0, status: VehicleStatus.ACTIVE, photoUrl: ''
  });

  const filteredVehicles = vehicles.filter(v => 
    v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingId(null);
    setNewVehicle({ plate: '', brand: '', model: '', year: new Date().getFullYear(), mileage: 0, status: VehicleStatus.ACTIVE, photoUrl: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (vehicle: Vehicle) => {
    setEditingId(vehicle.id);
    setNewVehicle({
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      mileage: vehicle.mileage,
      status: vehicle.status,
      photoUrl: vehicle.photoUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdateVehicle({ ...newVehicle, id: editingId } as Vehicle);
    } else {
      onAddVehicle(newVehicle);
    }
    setIsModalOpen(false);
    setEditingId(null);
    setNewVehicle({ plate: '', brand: '', model: '', year: new Date().getFullYear(), mileage: 0, status: VehicleStatus.ACTIVE, photoUrl: '' });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewVehicle({ ...newVehicle, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const getStatusColor = (status: VehicleStatus) => {
    switch (status) {
      case VehicleStatus.ACTIVE: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case VehicleStatus.MAINTENANCE: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case VehicleStatus.RETIRED: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Veículos</h2>
          <p className="text-slate-500 dark:text-slate-400">Gerencie a frota da empresa.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus size={20} />
          Novo Veículo
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por placa ou modelo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 bg-white dark:bg-slate-800 transition-colors">
          <Filter size={18} />
          Filtros
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 text-sm">Veículo</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 text-sm">Placa</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 text-sm">Ano</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 text-sm">KM Atual</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 text-sm">Status</th>
                <th className="px-6 py-4 text-right font-semibold text-slate-600 dark:text-slate-400 text-sm">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-600">
                        {vehicle.photoUrl ? (
                          <img src={vehicle.photoUrl} alt={vehicle.model} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon size={20} className="text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{vehicle.brand} {vehicle.model}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">ID: {vehicle.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-300">{vehicle.plate}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{vehicle.year}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{vehicle.mileage.toLocaleString()} km</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleOpenEdit(vehicle)}
                      className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 transition-colors"
                      title="Editar Veículo"
                    >
                      <Pencil size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    Nenhum veículo encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in transition-colors">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {editingId ? 'Editar Veículo' : 'Novo Veículo'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Photo Upload Section */}
              <div className="flex justify-center mb-6">
                <div className="relative group cursor-pointer">
                  <input 
                    type="file" 
                    id="vehicle-photo" 
                    accept="image/*" 
                    capture="environment" 
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label htmlFor="vehicle-photo" className="block relative">
                    <div className="w-32 h-32 rounded-full border-4 border-slate-100 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-700 flex items-center justify-center group-hover:border-blue-100 dark:group-hover:border-slate-600 transition-colors">
                       {newVehicle.photoUrl ? (
                         <img src={newVehicle.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                       ) : (
                         <div className="text-center p-2">
                           <Camera className="mx-auto text-slate-400 mb-1" size={24} />
                           <span className="text-xs text-slate-400 font-medium">Adicionar Foto</span>
                         </div>
                       )}
                    </div>
                    <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-md group-hover:bg-blue-700 transition-colors">
                      <Camera size={16} />
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Marca</label>
                  <input required type="text" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white" 
                    value={newVehicle.brand} onChange={e => setNewVehicle({...newVehicle, brand: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Modelo</label>
                  <input required type="text" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white" 
                    value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Placa</label>
                  <input required type="text" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white uppercase" 
                    value={newVehicle.plate} onChange={e => setNewVehicle({...newVehicle, plate: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ano</label>
                  <input required type="number" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white" 
                    value={newVehicle.year} onChange={e => setNewVehicle({...newVehicle, year: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Quilometragem Atual</label>
                  <input required type="number" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white" 
                    value={newVehicle.mileage} onChange={e => setNewVehicle({...newVehicle, mileage: parseInt(e.target.value)})} />
              </div>
              <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                  <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    value={newVehicle.status} onChange={e => setNewVehicle({...newVehicle, status: e.target.value as VehicleStatus})}>
                      {Object.values(VehicleStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-md">
                  {editingId ? 'Salvar Alterações' : 'Salvar Veículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};