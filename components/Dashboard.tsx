
import React, { useState, useRef, useEffect } from 'react';
import { Vehicle, MaintenanceRecord, VehicleStatus, AIInsight, MaintenanceStatus, ViewState, FuelRecord } from '../types';
import { analyzeFleetData, askFleetAI } from '../services/geminiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LineChart, Line, LabelList
} from 'recharts';
import { Sparkles, DollarSign, Activity, AlertTriangle, RefreshCw, Droplet, Download, MessageSquare, Send, X, Bot, TrendingUp, Zap, Clock, ChevronRight, Wrench } from 'lucide-react';

interface DashboardProps {
  vehicles: Vehicle[];
  maintenance: MaintenanceRecord[];
  fuelRecords: FuelRecord[];
  onNavigate: (view: ViewState) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export const Dashboard: React.FC<DashboardProps> = ({ vehicles, maintenance, fuelRecords, onNavigate }) => {
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'ai', text: 'Olá! Sou o Assistente Fleet AI. Como posso ajudar com os dados de consumo e manutenção hoje?', timestamp: new Date() }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeVehicles = vehicles.filter(v => v.status === VehicleStatus.ACTIVE).length;
  
  const totalCompletedCost = maintenance
    .filter(m => m.status === MaintenanceStatus.COMPLETED)
    .reduce((sum, record) => sum + record.cost, 0);

  const totalFuelCost = fuelRecords.reduce((sum, record) => sum + record.totalCost, 0);
  const pendingOrders = maintenance.filter(m => m.status !== MaintenanceStatus.COMPLETED).length;

  const handleAIAnalysis = async () => {
    if (vehicles.length === 0) {
      alert("Adicione alguns veículos primeiro para que a IA possa analisar sua frota.");
      return;
    }
    setLoadingAI(true);
    try {
      const result = await analyzeFleetData(vehicles, maintenance);
      setInsight(result);
    } catch (err) {
      alert("Erro ao conectar com o serviço de IA. Verifique sua conexão.");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleExport = () => {
    if (vehicles.length === 0 && maintenance.length === 0 && fuelRecords.length === 0) {
      alert("Não há dados registrados para exportar.");
      return;
    }

    const downloadCSV = (data: any[], filename: string) => {
      if (!data || data.length === 0) return;
      const headers = Object.keys(data[0]);
      const rows = data.map(row => headers.map(h => String(row[h] ?? '').replace(/,/g, '.')).join(','));
      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    };

    downloadCSV(vehicles, 'frota_veiculos.csv');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: chatInput, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);
    try {
      const responseText = await askFleetAI(chatInput, vehicles, maintenance, fuelRecords);
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'ai', text: responseText, timestamp: new Date() }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'ai', text: 'Erro ao processar. Tente novamente.', timestamp: new Date() }]);
    } finally { setIsTyping(false); }
  };

  const groupAndSortByMonth = (data: any[], dateKey: string, valueKey: string) => {
    const grouped = data.reduce((acc: any, curr) => {
      const date = new Date(curr[dateKey]);
      const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const name = date.toLocaleString('pt-BR', { month: 'short' });
      if (!acc[sortKey]) acc[sortKey] = { sortKey, name, value: 0 };
      acc[sortKey].value += curr[valueKey];
      return acc;
    }, {});
    return Object.values(grouped).sort((a: any, b: any) => a.sortKey.localeCompare(b.sortKey));
  };

  const fuelChartData = groupAndSortByMonth(fuelRecords, 'date', 'totalCost').slice(-6);

  const vehicleEfficiencyData = vehicles.map(v => {
    const records = fuelRecords
      .filter(f => f.vehicleId === v.id)
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const label = `${v.model}-${v.plate}`;
    
    if (records.length < 2) return { name: label, kml: 0 };
    
    const kmStart = records[0].odometer;
    const kmEnd = records[records.length - 1].odometer;
    const distance = kmEnd - kmStart;
    
    const litersAfterFirst = records.slice(1).reduce((sum, r) => sum + r.liters, 0);
    
    const kml = (litersAfterFirst > 0 && distance > 0) ? (distance / litersAfterFirst) : 0;
    
    return { name: label, kml: parseFloat(kml.toFixed(2)) };
  }).filter(d => d.kml > 0).sort((a, b) => b.kml - a.kml);

  const statusChartData = [
    { name: 'Concluído', value: maintenance.filter(m => m.status === MaintenanceStatus.COMPLETED).length, color: '#10b981' },
    { name: 'Em Aberto', value: maintenance.filter(m => m.status !== MaintenanceStatus.COMPLETED).length, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const recentActivities = [...maintenance]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const getVehicleLabel = (id: string) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `${v.plate}` : '---';
  };

  const commonTooltipProps = {
    contentStyle: { 
      borderRadius: '16px', 
      border: 'none', 
      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', 
      background: '#1e293b', 
      color: '#fff',
      padding: '12px'
    },
    itemStyle: { color: '#fff', fontWeight: 'bold' },
    cursor: { stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5 5' }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard de Performance</h2>
          <p className="text-slate-500 dark:text-slate-400">Gestão técnica de frotas com análise preditiva.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setIsChatOpen(true)} className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 px-4 py-2 rounded-xl font-bold hover:bg-indigo-100 transition-all">
            <MessageSquare size={18} /> Assistente AI
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 px-4 py-2 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all">
            <Download size={18} /> Exportar
          </button>
          <button onClick={handleAIAnalysis} disabled={loadingAI} className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2 rounded-xl font-bold shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-70">
            {loadingAI ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
            {loadingAI ? 'Analisando...' : 'Insight Gemini'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Veículos Ativos', val: activeVehicles, icon: Activity, color: 'emerald' },
          { label: 'Gasto Combustível', val: `R$ ${totalFuelCost.toLocaleString()}`, icon: Droplet, color: 'amber' },
          { label: 'Manutenção Paga', val: `R$ ${totalCompletedCost.toLocaleString()}`, icon: DollarSign, color: 'indigo' },
          { label: 'Ordens Pendentes', val: pendingOrders, icon: AlertTriangle, color: 'red' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className={`p-2 bg-${kpi.color}-100 dark:bg-${kpi.color}-900/30 rounded-xl text-${kpi.color}-600 dark:text-${kpi.color}-400 mb-3 w-fit`}>
              <kpi.icon size={20} />
            </div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{kpi.label}</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{kpi.val}</h3>
          </div>
        ))}
      </div>

      {insight && (
        <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/40 p-6 rounded-2xl shadow-sm animate-scale-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-600 text-white rounded-lg"><Sparkles size={20} /></div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Relatório Fleet AI</h3>
            <span className="ml-auto text-xs font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-tighter">Saúde da Frota: {insight.fleet_health_score}%</span>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
               <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Resumo Estratégico</h4>
               <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{insight.summary}</p>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/20">
               <h4 className="text-[10px] font-black text-emerald-600 uppercase mb-2 tracking-widest">Oportunidade de Economia</h4>
               <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">{insight.savings_opportunity}</p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
               <h4 className="text-[10px] font-black text-red-600 uppercase mb-2 tracking-widest">Atenção Crítica</h4>
               <p className="text-sm text-red-800 dark:text-red-300 font-medium">{insight.urgent_attention}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-500" /> Histórico de Gastos (R$)
            </h3>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={fuelChartData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
              <Tooltip 
                {...commonTooltipProps}
                formatter={(value: number) => [`R$ ${value.toLocaleString()}`, 'Total Abastecido']}
              />
              <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }}>
                <LabelList dataKey="value" position="top" offset={10} style={{ fontSize: '11px', fill: '#6366f1', fontWeight: 'bold' }} formatter={(val: number) => `R$${val.toLocaleString()}`} />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Zap size={18} className="text-amber-500" /> Consumo Técnico (KM/L)
            </h3>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={vehicleEfficiencyData} layout="vertical" margin={{ left: 10, right: 50, top: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: '800', fill: '#64748b'}} width={130} />
              <Tooltip 
                {...commonTooltipProps}
                cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                formatter={(value: number) => [`${value} KM/L`, 'Eficiência Média']}
              />
              <Bar dataKey="kml" fill="#f59e0b" radius={[0, 8, 8, 0]} barSize={24}>
                <LabelList dataKey="kml" position="right" offset={10} style={{ fontSize: '12px', fill: '#64748b', fontWeight: '900' }} />
                {vehicleEfficiencyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.kml > 12 ? '#10b981' : entry.kml > 9 ? '#6366f1' : '#f59e0b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Clock size={18} className="text-indigo-500" /> Manutenções de Prioridade
            </h3>
            <button onClick={() => onNavigate('MAINTENANCE')} className="text-xs font-black text-indigo-600 hover:underline flex items-center gap-1 uppercase tracking-widest">
              Relatório Completo <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {recentActivities.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 transition-all hover:border-indigo-200">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${m.status === MaintenanceStatus.COMPLETED ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    <Wrench size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-800 dark:text-white truncate">{m.description}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{getVehicleLabel(m.vehicleId)} • {new Date(m.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900 dark:text-slate-100">R$ {m.cost.toLocaleString()}</p>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${m.status === MaintenanceStatus.COMPLETED ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                    {m.status}
                  </span>
                </div>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <div className="py-12 text-center text-slate-400 italic text-sm font-medium">Não há registros de manutenção no período.</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <Activity size={18} className="text-emerald-500" /> Status do Cronograma
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie 
                data={statusChartData} 
                innerRadius={70} 
                outerRadius={100} 
                paddingAngle={8} 
                dataKey="value" 
                stroke="none"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {statusChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip 
                {...commonTooltipProps}
                formatter={(value: number) => [value, 'Quantidade']}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full sm:w-[500px] h-[100dvh] sm:h-[650px] sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/20">
            <div className="p-6 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-black text-lg leading-none">Fleet AI</h3>
                  <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest mt-1">Sempre Online</p>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-950/50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-3xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm'}`}>
                    <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isTyping && <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest animate-pulse ml-2">Fleet AI está analisando...</div>}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex gap-3">
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Como está a média do Corolla?" className="flex-1 bg-slate-100 dark:bg-slate-800 border-0 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                <button type="submit" disabled={!chatInput.trim() || isTyping} className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50">
                  <Send size={20} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
