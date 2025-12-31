import React, { useState } from 'react';
import { MaintenanceRecord, Vehicle, MaintenanceStatus } from '../types';
import { Plus, Search, Calendar, FileText, CheckCircle, Clock, AlertCircle, X, Pencil, Filter } from 'lucide-react';

interface MaintenanceListProps {
  maintenance: MaintenanceRecord[];
  vehicles: Vehicle[];
  onAddMaintenance: (m: Omit<MaintenanceRecord, 'id'>) => void;
  onUpdateMaintenance: (m: MaintenanceRecord) => void;
}

export const MaintenanceList: React.FC<MaintenanceListProps> = ({ maintenance, vehicles, onAddMaintenance, onUpdateMaintenance }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    vehicleId: '', 
    description: '', 
    cost: 0, 
    date: new Date().toISOString().split('T')[0], 
    status: MaintenanceStatus.PENDING, 
    type: 'Preventiva' as MaintenanceRecord['type']
  });

  const filteredRecords = maintenance.filter(m => {
    const matchesStatus = filterStatus === 'all' || m.status === filterStatus;
    const matchesVehicle = selectedVehicleId === '' || m.vehicleId === selectedVehicleId;
    return matchesStatus && matchesVehicle;
  });

  const getVehiclePlate = (id: string) => vehicles.find(v => v.id === id)?.plate || 'N/A';
  const getVehicleName = (id: string) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `${v.brand} ${v.model}` : 'Veículo Removido';
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      vehicleId: '', description: '', cost: 0, date: new Date().toISOString().split('T')[0], status: MaintenanceStatus.PENDING, type: 'Preventiva'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: MaintenanceRecord) => {
    setEditingId(record.id);
    setFormData({
      vehicleId: record.vehicleId,
      description: record.description,
      cost: record.cost,
      date: record.date,
      status: record.status,
      type: record.type
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdateMaintenance({ ...formData, id: editingId });
    } else {
      onAddMaintenance(formData);
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      vehicleId: '', description: '', cost: 0, date: new Date().toISOString().split('T')[0], status: MaintenanceStatus.PENDING, type: 'Preventiva'
    });
  };

  const getStatusIcon = (status: MaintenanceStatus) => {
    switch (status) {
      case MaintenanceStatus.COMPLETED: return <CheckCircle size={16} className="text-emerald-500" />;
      case MaintenanceStatus.IN_PROGRESS: return <Clock size={16} className="text-amber-500" />;
      case MaintenanceStatus.PENDING: return <AlertCircle size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Manutenções</h2>
          <p className="text-slate-500 dark:text-slate-400">Histórico e agendamento de serviços.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={20} />
          Nova Ordem
        </button>
      </div>

      {/* Tabs / Filters */}
      <div className="border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {['all', MaintenanceStatus.PENDING, MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.COMPLETED].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`
                whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${filterStatus === status 
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                }
              `}
            >
              {status === 'all' ? 'Todas' : status}
            </button>
          ))}
        </nav>
        
        <div className="pb-3 w-full md:w-64">
           <div className="relative">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <select
               value={selectedVehicleId}
               onChange={(e) => setSelectedVehicleId(e.target.value)}
               className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none transition-colors"
             >
               <option value="">Todos os Veículos</option>
               {vehicles.map(v => (
                 <option key={v.id} value={v.id}>
                   {v.brand} {v.model} ({v.plate})
                 </option>
               ))}
             </select>
           </div>
        </div>
      </div>

      {/* List */}
      <div className="grid gap-4">
        {filteredRecords.map((record) => (
          <div key={record.id} className="relative bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center hover:shadow-md transition-all group">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400 hidden md:block">
              <FileText size={24} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase tracking-wide">{record.type}</span>
                <span className="text-xs text-slate-400">{new Date(record.date).toLocaleDateString()}</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white truncate pr-8 md:pr-0">{record.description}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm truncate">{getVehicleName(record.vehicleId)} • <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-1 rounded">{getVehiclePlate(record.vehicleId)}</span></p>
            </div>

            <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-1 w-full md:w-auto justify-between md:justify-center">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                 {getStatusIcon(record.status)}
                 {record.status}
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                R$ {record.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Edit Button Desktop */}
            <div className="hidden md:flex flex-col items-center justify-center pl-4 border-l border-slate-100 dark:border-slate-700 ml-2">
               <button 
                onClick={() => handleOpenEdit(record)} 
                className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                title="Editar Ordem"
               >
                 <Pencil size={18} />
               </button>
            </div>

            {/* Edit Button Mobile */}
            <button 
              onClick={() => handleOpenEdit(record)} 
              className="absolute top-4 right-4 md:hidden p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <Pencil size={18} />
            </button>
          </div>
        ))}
        {filteredRecords.length === 0 && (
           <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed transition-colors">
             <div className="mx-auto w-12 h-12 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3">
               <Search className="text-slate-400" />
             </div>
             <p className="text-slate-500 dark:text-slate-400">
               {maintenance.length === 0 ? "Nenhuma ordem de manutenção encontrada." : "Nenhuma ordem encontrada para os filtros selecionados."}
             </p>
           </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in transition-colors">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {editingId ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Veículo</label>
                <select required className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  value={formData.vehicleId} onChange={e => setFormData({...formData, vehicleId: e.target.value})}>
                    <option value="">Selecione um veículo...</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate})</option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Descrição do Serviço</label>
                <textarea required rows={3} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="Ex: Troca de óleo e filtro..."
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Custo Estimado (R$)</label>
                  <input required type="number" step="0.01" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white" 
                    value={formData.cost} onChange={e => setFormData({...formData, cost: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Data</label>
                  <input required type="date" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white" 
                    value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tipo</label>
                  <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as MaintenanceRecord['type']})}>
                      <option value="Preventiva">Preventiva</option>
                      <option value="Corretiva">Corretiva</option>
                      <option value="Emergencial">Emergencial</option>
                  </select>
                </div>
                 <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                  <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as MaintenanceStatus})}>
                      {Object.values(MaintenanceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-md">
                  {editingId ? 'Salvar Alterações' : 'Criar Ordem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};