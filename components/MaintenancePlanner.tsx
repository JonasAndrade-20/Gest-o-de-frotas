
import React, { useState } from 'react';
import { Vehicle, Periodicity, MaintenanceRecord, MaintenanceStatus } from '../types';
import { Calendar, Plus, Trash2, ArrowRight, CheckCircle2, Info, RefreshCw, Sparkles, X } from 'lucide-react';
import { getThemeInsight } from '../services/geminiService';

interface MaintenancePlannerProps {
  vehicles: Vehicle[];
  onScheduleMaintenance: (records: Omit<MaintenanceRecord, 'id'>[]) => void;
}

export const MaintenancePlanner: React.FC<MaintenancePlannerProps> = ({ vehicles, onScheduleMaintenance }) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [periodicity, setPeriodicity] = useState<Periodicity>(Periodicity.DAYS_180);
  const [occurrences, setOccurrences] = useState(4);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [preview, setPreview] = useState<Omit<MaintenanceRecord, 'id'>[]>([]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const handleAIInsight = async () => {
    if (vehicles.length === 0) {
      alert("Nenhum veículo cadastrado para sugerir planejamento.");
      return;
    }
    setIsLoadingAI(true);
    const result = await getThemeInsight('planner', vehicles.map(v => ({ modelo: v.model, km: v.mileage, ano: v.year })));
    setAiInsight(result);
    setIsLoadingAI(false);
  };

  const getDaysFromPeriodicity = (p: Periodicity) => {
    switch (p) {
      case Periodicity.DAYS_30: return 30;
      case Periodicity.DAYS_60: return 60;
      case Periodicity.DAYS_90: return 90;
      case Periodicity.DAYS_180: return 180;
      case Periodicity.DAYS_365: return 365;
      default: return 30;
    }
  };

  // Função auxiliar para formatar data local como YYYY-MM-DD sem shift de timezone
  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const generatePreview = () => {
    if (!selectedVehicleId || !description || occurrences <= 0) return;
    
    const newPreview: Omit<MaintenanceRecord, 'id'>[] = [];
    const daysInterval = getDaysFromPeriodicity(periodicity);
    
    // CORREÇÃO: Parse manual dos componentes da data para evitar timezone shift
    // Em vez de new Date(startDate), que assume UTC meia-noite
    const [year, month, day] = startDate.split('-').map(Number);
    let currentDate = new Date(year, month - 1, day);

    for (let i = 0; i < occurrences; i++) {
      newPreview.push({ 
        vehicleId: selectedVehicleId, 
        description: `${description} (Planejada ${i + 1}/${occurrences})`, 
        cost: estimatedCost, 
        date: formatDateLocal(currentDate), 
        status: MaintenanceStatus.PENDING, 
        type: 'Preventiva' 
      });
      currentDate.setDate(currentDate.getDate() + daysInterval);
    }
    setPreview(newPreview);
  };

  const handleConfirm = () => {
    if (preview.length === 0) return;
    onScheduleMaintenance(preview);
    setPreview([]);
    setDescription('');
    alert(`${preview.length} manutenções agendadas com sucesso!`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Planejador de Manutenção</h2>
          <p className="text-slate-500 dark:text-slate-400">Automatize o cronograma de manutenções preventivas.</p>
        </div>
        <button 
          onClick={handleAIInsight}
          disabled={isLoadingAI}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {isLoadingAI ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
          Insight Gemini
        </button>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <RefreshCw size={20} className="text-indigo-500" /> Configurar Recorrência
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Veículo</label>
                <select className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700" value={selectedVehicleId} onChange={e => setSelectedVehicleId(e.target.value)}>
                  <option value="">Selecione...</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.model} ({v.plate})</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Serviço</label>
                <input type="text" placeholder="Ex: Troca de Óleo" className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-sm font-medium">Início</label><input type="date" className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                <div className="space-y-1"><label className="text-sm font-medium">Vezes</label><input type="number" min="1" className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700" value={occurrences} onChange={e => setOccurrences(parseInt(e.target.value) || 0)} /></div>
              </div>
              <div className="space-y-1"><label className="text-sm font-medium">Periodicidade</label><select className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700" value={periodicity} onChange={e => setPeriodicity(e.target.value as Periodicity)}>{Object.values(Periodicity).map(p => <option key={p} value={p}>{p}</option>)}</select></div>
              <button onClick={generatePreview} className="w-full bg-slate-800 dark:bg-slate-700 text-white py-2.5 rounded-lg font-bold">Gerar Planejamento</button>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 h-full overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-slate-50 dark:bg-slate-900/50"><h3 className="font-bold">Prévia do Cronograma</h3></div>
            <div className="flex-1 overflow-y-auto min-h-[400px]">
              {preview.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {preview.map((item, index) => (
                    <div key={index} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-8 w-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">{index + 1}</div>
                        <div><p className="font-medium text-sm">{item.description}</p><p className="text-xs text-slate-500">{new Date(item.date + 'T12:00:00').toLocaleDateString()}</p></div>
                      </div>
                      <ArrowRight size={16} className="text-slate-300" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400"><Calendar size={48} className="mb-4 opacity-20" /><p>Gere uma prévia para visualizar o cronograma.</p></div>
              )}
            </div>
            {preview.length > 0 && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t"><button onClick={handleConfirm} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"><CheckCircle2 size={20} />Salvar Cronograma</button></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
