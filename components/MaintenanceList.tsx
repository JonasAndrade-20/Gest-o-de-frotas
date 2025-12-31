
import React, { useState } from 'react';
import { MaintenanceRecord, Vehicle, MaintenanceStatus } from '../types';
import { Plus, Search, Calendar, FileText, CheckCircle, Clock, AlertCircle, X, Pencil, Filter, Sparkles, RefreshCw } from 'lucide-react';
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
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
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
    const matchesStatus = filterStatus === 'all' || m.status === filterStatus;
    const matchesVehicle = selectedVehicleId === '' || m.vehicleId === selectedVehicleId;
    return matchesStatus && matchesVehicle;
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
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white truncate">{record.description}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{getVehicleName(record.vehicleId)} • <span className="font-mono text-xs">{getVehiclePlate(record.vehicleId)}</span></p>
            </div>
            <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-1">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">{getStatusIcon(record.status)} {record.status}</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">R$ {record.cost.toLocaleString('pt-BR')}</div>
            </div>
            <button onClick={() => handleOpenEdit(record)} className="absolute top-4 right-4 md:relative md:top-0 md:right-0 p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Pencil size={18} /></button>
          </div>
        ))}
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
