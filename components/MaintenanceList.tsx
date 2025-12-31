
import React, { useState } from 'react';
import { MaintenanceRecord, Vehicle, MaintenanceStatus } from '../types';
import { Plus, Search, Calendar, FileText, CheckCircle, Clock, AlertCircle, X, Pencil, Filter, Sparkles, RefreshCw, Car } from 'lucide-react';
import { getThemeInsight } from '../services/geminiService';

interface MaintenanceListProps {
  maintenance: MaintenanceRecord[];
  vehicles: Vehicle[];
  onAddMaintenance: (m: Omit<MaintenanceRecord, 'id'>) => void;
  onUpdateMaintenance: (m: MaintenanceRecord) => void;
}

export const MaintenanceList: React.FC<MaintenanceListProps> = ({ maintenance, vehicles, onAddMaintenance, onUpdateMaintenance }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchPlate, setSearchPlate] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  
  const [formData, setFormData] = useState({
    vehicleId: '', description: '', cost: 0, date: new Date().toISOString().split('T')[0], status: MaintenanceStatus.PENDING, type: 'Preventiva' as MaintenanceRecord['type']
  });

  const handleAIInsight = async () => {
    if (maintenance.length === 0) {
      alert("Nenhum registro de manutenção para analisar.");
      return;
    }
    setIsLoadingAI(true);
    const result = await getThemeInsight('maintenance', maintenance.slice(0, 20));
    setAiInsight(result);
    setIsLoadingAI(false);
  };

  const filteredRecords = maintenance.filter(m => {
    const vehicle = vehicles.find(v => v.id === m.vehicleId);
    const matchesStatus = filterStatus === 'all' || m.status === filterStatus;
    const matchesPlate = searchPlate === '' || 
                         vehicle?.plate.toLowerCase().includes(searchPlate.toLowerCase()) ||
                         vehicle?.model.toLowerCase().includes(searchPlate.toLowerCase());
    const matchesDate = filterDate === '' || m.date === filterDate;
    
    return matchesStatus && matchesPlate && matchesDate;
  });

  const getVehiclePlate = (id: string) => vehicles.find(v => v.id === id)?.plate || 'N/A';
  const getVehicleName = (id: string) => vehicles.find(v => v.id === id)?.model || 'Veículo';

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ vehicleId: '', description: '', cost: 0, date: new Date().toISOString().split('T')[0], status: MaintenanceStatus.PENDING, type: 'Preventiva' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: MaintenanceRecord) => {
    setEditingId(record.id);
    setFormData({ ...record });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editingId ? onUpdateMaintenance({ ...formData, id: editingId }) : onAddMaintenance(formData);
    setIsModalOpen(false);
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
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button 
            onClick={handleAIInsight}
            disabled={isLoadingAI}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoadingAI ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
            Insight Gemini
          </button>
          <button 
            onClick={handleOpenCreate}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus size={20} />
            Nova Ordem
          </button>
        </div>
      </div>

      {/* Filtros Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Filtrar por placa ou veículo..." 
            value={searchPlate}
            onChange={(e) => setSearchPlate(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm transition-all"
          />
        </div>
        <div className="relative group">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input 
            type="date" 
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm transition-all"
          />
          {filterDate && (
            <button 
              onClick={() => setFilterDate('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {aiInsight && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-4 rounded-2xl flex items-start gap-3 relative animate-scale-in">
          <div className="p-2 bg-indigo-600 text-white rounded-lg shrink-0">
            <Sparkles size={16} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-indigo-900 dark:text-indigo-200 font-medium leading-relaxed pr-8">{aiInsight}</p>
          </div>
          <button onClick={() => setAiInsight(null)} className="absolute top-4 right-4 text-indigo-400 hover:text-indigo-600">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {['all', MaintenanceStatus.PENDING, MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.COMPLETED].map((status) => (
            <button key={status} onClick={() => setFilterStatus(status)} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${filterStatus === status ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500'}`}>{status === 'all' ? 'Todas' : status}</button>
          ))}
        </nav>
      </div>

      <div className="grid gap-4">
        {filteredRecords.map((record) => (
          <div key={record.id} className="relative bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center hover:shadow-md transition-all group">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black text-slate-800 dark:text-white truncate tracking-tight">{record.description}</h3>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded-md">
                  <Car size={12} className="text-indigo-500" />
                  {getVehicleName(record.vehicleId)} • {getVehiclePlate(record.vehicleId)}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-1 rounded-md text-indigo-600 dark:text-indigo-400">
                  <Calendar size={12} />
                  Planejada: {new Date(record.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-1 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 mt-2 md:mt-0">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                {getStatusIcon(record.status)} {record.status}
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white ml-auto md:ml-0">
                R$ {record.cost.toLocaleString('pt-BR')}
              </div>
            </div>
            <button 
              onClick={() => handleOpenEdit(record)} 
              className="absolute top-4 right-4 md:relative md:top-0 md:right-0 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-all"
            >
              <Pencil size={18} />
            </button>
          </div>
        ))}
        {filteredRecords.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
               <Filter size={32} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhuma manutenção encontrada com esses filtros.</p>
            <button 
              onClick={() => { setSearchPlate(''); setFilterDate(''); setFilterStatus('all'); }}
              className="text-indigo-600 font-bold hover:underline"
            >
              Limpar todos os filtros
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{editingId ? 'Editar Ordem' : 'Nova Ordem'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1"><label className="text-sm font-medium">Veículo</label><select required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700" value={formData.vehicleId} onChange={e => setFormData({...formData, vehicleId: e.target.value})}><option value="">Selecione...</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.model} ({v.plate})</option>)}</select></div>
              <div className="space-y-1"><label className="text-sm font-medium">Descrição</label><textarea required rows={3} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-sm font-medium">Custo (R$)</label><input required type="number" step="0.01" className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700" value={formData.cost} onChange={e => setFormData({...formData, cost: parseFloat(e.target.value)})} /></div>
                <div className="space-y-1"><label className="text-sm font-medium">Data</label><input required type="date" className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
              </div>
              <div className="pt-4 flex gap-3"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border rounded-lg">Cancelar</button><button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium">Salvar</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
