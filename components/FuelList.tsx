import React, { useState } from 'react';
import { FuelRecord, Vehicle } from '../types';
import { Plus, Search, Filter, Fuel, Camera, X, FileText, Droplet, Pencil } from 'lucide-react';

interface FuelListProps {
  fuelRecords: FuelRecord[];
  vehicles: Vehicle[];
  onAddFuel: (record: Omit<FuelRecord, 'id'>) => void;
  onUpdateFuel: (record: FuelRecord) => void;
}

export const FuelList: React.FC<FuelListProps> = ({ fuelRecords, vehicles, onAddFuel, onUpdateFuel }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<FuelRecord, 'id'>>({
    vehicleId: '',
    date: new Date().toISOString().split('T')[0],
    odometer: 0,
    liters: 0,
    totalCost: 0,
    receiptUrl: ''
  });

  const getVehicleInfo = (id: string) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `${v.brand} ${v.model} (${v.plate})` : 'Veículo não encontrado';
  };

  const filteredRecords = selectedVehicleId 
    ? fuelRecords.filter(r => r.vehicleId === selectedVehicleId)
    : fuelRecords;

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      vehicleId: '',
      date: new Date().toISOString().split('T')[0],
      odometer: 0,
      liters: 0,
      totalCost: 0,
      receiptUrl: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: FuelRecord) => {
    setEditingId(record.id);
    setFormData({
      vehicleId: record.vehicleId,
      date: record.date,
      odometer: record.odometer,
      liters: record.liters,
      totalCost: record.totalCost,
      receiptUrl: record.receiptUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdateFuel({ ...formData, id: editingId });
    } else {
      onAddFuel(formData);
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      vehicleId: '',
      date: new Date().toISOString().split('T')[0],
      odometer: 0,
      liters: 0,
      totalCost: 0,
      receiptUrl: ''
    });
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, receiptUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Gestão de Abastecimento</h2>
          <p className="text-slate-500 dark:text-slate-400">Controle de combustível e comprovantes.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-600/20"
        >
          <Plus size={20} />
          Registrar Abastecimento
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2 sm:mb-0">
          <Filter size={20} />
          <span className="font-medium text-sm">Filtrar por Veículo:</span>
        </div>
        <select
          value={selectedVehicleId}
          onChange={(e) => setSelectedVehicleId(e.target.value)}
          className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
        >
          <option value="">Todos os Veículos</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>{v.brand} {v.model} - {v.plate}</option>
          ))}
        </select>
      </div>

      {/* Records Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecords.map((record) => (
          <div key={record.id} className="relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all overflow-hidden group">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Fuel size={14} /> {new Date(record.date).toLocaleDateString()}
              </span>
              <span className="font-bold text-slate-800 dark:text-white">R$ {record.totalCost.toFixed(2)}</span>
            </div>
            
            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-semibold">Veículo</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{getVehicleInfo(record.vehicleId)}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-semibold">Hodômetro</p>
                   <p className="text-sm font-mono text-slate-700 dark:text-slate-300">{record.odometer} km</p>
                </div>
                <div>
                   <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-semibold">Litros</p>
                   <p className="text-sm text-slate-700 dark:text-slate-300">{record.liters} L</p>
                </div>
              </div>

              {record.receiptUrl && (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1">
                    <FileText size={12} /> Comprovante
                  </p>
                  <div className="h-24 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden relative group/img cursor-pointer">
                    <img src={record.receiptUrl} alt="Comprovante" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">
                      Ver Imagem
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Edit Button */}
            <button 
              onClick={() => handleOpenEdit(record)}
              className="absolute top-2 right-2 p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:text-indigo-600 dark:hover:text-indigo-400"
              title="Editar"
            >
              <Pencil size={16} />
            </button>
          </div>
        ))}
        
        {filteredRecords.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            <Droplet size={48} className="mx-auto mb-4 opacity-50" />
            <p>Nenhum registro de abastecimento encontrado.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in transition-colors">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {editingId ? 'Editar Abastecimento' : 'Registrar Abastecimento'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Veículo</label>
                <select 
                  required 
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  value={formData.vehicleId} 
                  onChange={e => setFormData({...formData, vehicleId: e.target.value})}
                >
                    <option value="">Selecione um veículo...</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate})</option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Data</label>
                  <input required type="date" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white" 
                    value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Hodômetro (km)</label>
                  <input required type="number" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white" 
                    value={formData.odometer || ''} onChange={e => setFormData({...formData, odometer: parseInt(e.target.value)})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Valor Total (R$)</label>
                  <input required type="number" step="0.01" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white" 
                    value={formData.totalCost || ''} onChange={e => setFormData({...formData, totalCost: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Litros</label>
                  <input required type="number" step="0.1" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white" 
                    value={formData.liters || ''} onChange={e => setFormData({...formData, liters: parseFloat(e.target.value)})} />
                </div>
              </div>

              {/* Receipt Upload */}
              <div className="space-y-2 pt-2">
                 <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">Comprovante</label>
                 <div className="flex items-center gap-4">
                    <label className="flex-1 cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors bg-slate-50 dark:bg-slate-700/50">
                        <Camera className="text-slate-400 mb-2" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">Tirar foto ou enviar arquivo</span>
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleReceiptChange} />
                    </label>
                    {formData.receiptUrl && (
                        <div className="w-24 h-24 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden border border-slate-200 dark:border-slate-600 relative">
                            <img src={formData.receiptUrl} alt="Preview" className="w-full h-full object-cover" />
                            <button 
                              type="button"
                              onClick={() => setFormData({...formData, receiptUrl: ''})}
                              className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}
                 </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-md">
                  {editingId ? 'Salvar Alterações' : 'Salvar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};