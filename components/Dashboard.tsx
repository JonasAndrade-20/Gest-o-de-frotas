import React, { useState, useRef, useEffect } from 'react';
import { Vehicle, MaintenanceRecord, VehicleStatus, AIInsight, MaintenanceStatus, ViewState, FuelRecord } from '../types';
import { analyzeFleetData, askFleetAI } from '../services/geminiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LineChart, Line, LabelList
} from 'recharts';
import { Sparkles, DollarSign, Activity, AlertTriangle, RefreshCw, ArrowRight, Wrench, Droplet, Download, Clock, AlertCircle, MessageSquare, Send, X, Bot } from 'lucide-react';

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
  
  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'ai', text: 'Olá! Sou o Assistente Fleet AI. Tenho acesso a todos os dados da sua frota. Como posso ajudar hoje?', timestamp: new Date() }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Computed Stats
  const activeVehicles = vehicles.filter(v => v.status === VehicleStatus.ACTIVE).length;
  const maintenanceVehicles = vehicles.filter(v => v.status === VehicleStatus.MAINTENANCE).length;
  const totalCost = maintenance.reduce((sum, record) => sum + record.cost, 0);
  const pendingOrders = maintenance.filter(m => m.status !== MaintenanceStatus.COMPLETED).length;

  // Fuel Stats
  const totalFuelCost = fuelRecords.reduce((sum, record) => sum + record.totalCost, 0);
  const totalFuelLiters = fuelRecords.reduce((sum, record) => sum + record.liters, 0);

  // Urgent Maintenance Logic (Pending > 7 days)
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const urgentMaintenance = maintenance.filter(m => {
    const recordDate = new Date(m.date);
    return m.status === MaintenanceStatus.PENDING && recordDate < sevenDaysAgo;
  });

  const handleAIAnalysis = async () => {
    setLoadingAI(true);
    const result = await analyzeFleetData(vehicles, maintenance);
    setInsight(result);
    setLoadingAI(false);
  };

  const handleExport = () => {
    const downloadCSV = (data: any[], filename: string) => {
      if (data.length === 0) return;
      
      const headers = Object.keys(data[0]);
      const rows = data.map(row => 
        headers.map(fieldName => {
          let val = row[fieldName];
          if (val === null || val === undefined) val = '';
          val = String(val);
          if (val.search(/("|,|\n)/g) >= 0) {
            val = `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(',')
      );
      
      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    downloadCSV(vehicles, 'frota_veiculos.csv');
    setTimeout(() => downloadCSV(maintenance, 'frota_manutencoes.csv'), 500);
    setTimeout(() => downloadCSV(fuelRecords, 'frota_abastecimentos.csv'), 1000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isChatOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: chatInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    try {
      const responseText = await askFleetAI(userMsg.text, vehicles, maintenance, fuelRecords);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: 'Desculpe, tive um problema ao processar sua solicitação.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Helper to group data by month and sort chronologically
  const groupAndSortByMonth = (data: any[], dateKey: string, valueKey: string, countKey?: string) => {
    const grouped = data.reduce((acc: any, curr) => {
      const date = new Date(curr[dateKey]);
      // Key for sorting: YYYY-MM
      const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      // Label for display: Month (short)
      const name = date.toLocaleString('pt-BR', { month: 'short' });
      
      if (!acc[sortKey]) {
        acc[sortKey] = { sortKey, name, value: 0, count: 0 };
      }
      acc[sortKey].value += curr[valueKey];
      if (countKey) acc[sortKey].count += curr[countKey];
      return acc;
    }, {});

    return Object.values(grouped).sort((a: any, b: any) => a.sortKey.localeCompare(b.sortKey));
  };

  // Chart 1: Maintenance Costs (Sorted)
  const costChartData = groupAndSortByMonth(maintenance, 'date', 'cost').map((item: any) => ({
    name: item.name,
    cost: item.value
  })).slice(-6);

  // Chart 2: Fuel Costs (Sorted)
  const fuelChartData = groupAndSortByMonth(fuelRecords, 'date', 'totalCost').map((item: any) => ({
    name: item.name,
    cost: item.value
  })).slice(-6);

  // Chart 3: Fuel Efficiency (L/KM) calculation
  const calculateEfficiencyData = () => {
    const efficiencyMap: Record<string, { km: number, liters: number, name: string }> = {};

    // Group records by vehicle to calculate distance deltas
    const recordsByVehicle = vehicles.reduce((acc, v) => ({ ...acc, [v.id]: [] as FuelRecord[] }), {} as Record<string, FuelRecord[]>);
    fuelRecords.forEach(r => recordsByVehicle[r.vehicleId]?.push(r));

    // Process each vehicle
    Object.values(recordsByVehicle).forEach(recs => {
      // Sort by date ascending
      recs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      for (let i = 1; i < recs.length; i++) {
        const prev = recs[i - 1];
        const curr = recs[i];
        const distance = curr.odometer - prev.odometer;
        
        // Only consider valid positive distances
        if (distance > 0) {
          const date = new Date(curr.date);
          const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const name = date.toLocaleString('pt-BR', { month: 'short' });

          if (!efficiencyMap[sortKey]) {
            efficiencyMap[sortKey] = { km: 0, liters: 0, name };
          }
          efficiencyMap[sortKey].km += distance;
          efficiencyMap[sortKey].liters += curr.liters;
        }
      }
    });

    // Convert to array and sort
    return Object.entries(efficiencyMap)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([_, val]) => ({
        name: val.name,
        // L/KM = Liters / KM
        efficiency: val.km > 0 ? Number((val.liters / val.km).toFixed(3)) : 0
      }))
      .slice(-6);
  };

  const efficiencyData = calculateEfficiencyData();

  // Chart Data Preparation (Status Distribution)
  const statusCounts = {
    [MaintenanceStatus.COMPLETED]: maintenance.filter(m => m.status === MaintenanceStatus.COMPLETED).length,
    [MaintenanceStatus.IN_PROGRESS]: maintenance.filter(m => m.status === MaintenanceStatus.IN_PROGRESS).length,
    [MaintenanceStatus.PENDING]: maintenance.filter(m => m.status === MaintenanceStatus.PENDING).length,
  };

  const statusChartData = [
    { name: 'Concluído', value: statusCounts[MaintenanceStatus.COMPLETED], color: '#10b981' }, // emerald-500
    { name: 'Em Andamento', value: statusCounts[MaintenanceStatus.IN_PROGRESS], color: '#f59e0b' }, // amber-500
    { name: 'Pendente', value: statusCounts[MaintenanceStatus.PENDING], color: '#94a3b8' }, // slate-400
  ].filter(d => d.value > 0);

  // Recent Maintenance
  const recentMaintenance = [...maintenance]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const getVehicleName = (id: string) => {
     const v = vehicles.find(v => v.id === id);
     return v ? `${v.brand} ${v.model}` : 'Veículo Desconhecido';
  };

  const getDaysOverdue = (dateStr: string) => {
    const date = new Date(dateStr);
    const diffTime = Math.abs(today.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  };

  // Custom Label Renderers
  const renderCostLabel = (props: any) => {
    const { x, y, width, value } = props;
    return (
      <text x={x + width / 2} y={y - 10} fill="#64748b" textAnchor="middle" fontSize={10} fontWeight="bold">
        R${value > 1000 ? (value/1000).toFixed(1) + 'k' : value}
      </text>
    );
  };

  const renderEfficiencyLabel = (props: any) => {
    const { x, y, value } = props;
    return (
      <text x={x} y={y - 10} fill="#64748b" textAnchor="middle" fontSize={10} fontWeight="bold">
        {value}
      </text>
    );
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Visão Geral</h2>
          <p className="text-slate-500 dark:text-slate-400">Acompanhe os indicadores chave da sua frota.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setIsChatOpen(true)}
            className="flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-5 py-2.5 rounded-lg font-medium shadow-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all active:scale-95"
          >
            <MessageSquare size={18} />
            Assistente AI
          </button>
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-lg font-medium shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
          >
            <Download size={18} />
            Exportar CSV
          </button>
          <button
            onClick={handleAIAnalysis}
            disabled={loadingAI}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-70 active:scale-95"
          >
            {loadingAI ? (
               <RefreshCw className="animate-spin" size={18} />
            ) : (
              <Sparkles size={18} />
            )}
            {loadingAI ? 'Analisando...' : 'Gerar Relatório IA'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Veículos Ativos</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{activeVehicles}</h3>
            </div>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Activity size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Combustível</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-2">R$ {totalFuelCost.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</h3>
              <p className="text-xs text-slate-400 mt-1">{totalFuelLiters.toFixed(0)} Litros</p>
            </div>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
              <Droplet size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Custo Manutenção</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-2">R$ {totalCost.toLocaleString('pt-BR')}</h3>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Ordens Pendentes</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{pendingOrders}</h3>
            </div>
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Urgent Maintenance Alert Card */}
      {urgentMaintenance.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-6 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg text-red-600 dark:text-red-400">
               <AlertCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Manutenções Urgentes</h3>
          </div>
          <p className="text-red-600 dark:text-red-300 text-sm mb-4">
            As seguintes ordens de serviço estão pendentes há mais de 7 dias e requerem atenção imediata.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {urgentMaintenance.map(m => (
               <div key={m.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-red-100 dark:border-red-900/30 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-white truncate">{m.description}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{getVehicleName(m.vehicleId)}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                      <Clock size={12} /> {getDaysOverdue(m.date)} dias atrasado
                    </span>
                    <button 
                      onClick={() => onNavigate('MAINTENANCE')}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      Resolver
                    </button>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* AI Insight Section */}
      {insight && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
           <div className="col-span-1 md:col-span-3 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/50 p-6 rounded-xl shadow-sm relative overflow-hidden transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles size={100} className="text-indigo-600 dark:text-indigo-400"/>
              </div>
              <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-300 mb-4 flex items-center gap-2">
                <Sparkles size={20} className="text-indigo-600 dark:text-indigo-400"/>
                Análise Inteligente Gemini
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                   <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{insight.summary}</p>
                   <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Saúde da Frota:</span>
                      <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${insight.fleet_health_score > 70 ? 'bg-green-500' : 'bg-yellow-500'}`} 
                          style={{width: `${insight.fleet_health_score}%`}}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{insight.fleet_health_score}/100</span>
                   </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800">
                    <span className="block text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">Oportunidade de Economia</span>
                    <p className="text-sm text-green-800 dark:text-green-300 mt-1">{insight.savings_opportunity}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800">
                    <span className="block text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">Atenção Urgente</span>
                    <p className="text-sm text-red-800 dark:text-red-300 mt-1">{insight.urgent_attention}</p>
                  </div>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Custos de Manutenção (R$)</h3>
          <div className="h-80 lg:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costChartData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `R$${value}`} />
                <Tooltip 
                  cursor={{fill: 'rgba(241, 245, 249, 0.5)'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="cost" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={50}>
                  <LabelList content={renderCostLabel} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Pie Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col transition-colors">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Status das Ordens</h3>
          <div className="flex-1 min-h-[320px] lg:min-h-[384px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, value}) => `${value}`} 
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none'}} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
            {statusChartData.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
                    Sem dados
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Fuel Charts Section - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
         {/* Fuel Cost Chart */}
         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Gastos com Abastecimento (R$)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fuelChartData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `R$${value}`} />
                  <Tooltip 
                    cursor={{fill: 'rgba(241, 245, 249, 0.5)'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="cost" name="Custo" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={50}>
                     <LabelList content={renderCostLabel} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* New Efficiency Chart (Liters/KM) */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Consumo Médio (Litros/KM)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={efficiencyData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    cursor={{stroke: 'rgba(99, 102, 241, 0.2)', strokeWidth: 2}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    formatter={(value: number) => [`${value} L/KM`, 'Consumo']}
                  />
                  <Line type="monotone" dataKey="efficiency" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6'}} activeDot={{r: 6}}>
                    <LabelList content={renderEfficiencyLabel} />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
              {efficiencyData.length === 0 && (
                 <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm pt-10">
                    Dados insuficientes para cálculo de média
                 </div>
              )}
            </div>
          </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Manutenções Recentes</h3>
          <button 
            onClick={() => onNavigate('MAINTENANCE')}
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
          >
            Ver todas <ArrowRight size={16} />
          </button>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {recentMaintenance.map((record) => (
            <div 
              key={record.id} 
              onClick={() => onNavigate('MAINTENANCE')}
              className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${
                    record.status === MaintenanceStatus.COMPLETED ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    record.status === MaintenanceStatus.IN_PROGRESS ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                }`}>
                  <Wrench size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 dark:text-white">{record.description}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{getVehicleName(record.vehicleId)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-700 dark:text-slate-200">R$ {record.cost.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{new Date(record.date).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
          {recentMaintenance.length === 0 && (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              Nenhuma manutenção registrada.
            </div>
          )}
        </div>
      </div>

       {/* Chat Modal */}
       {isChatOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full sm:w-[500px] h-[90vh] sm:h-[600px] sm:rounded-2xl shadow-2xl flex flex-col animate-fade-in border border-slate-200 dark:border-slate-800">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-indigo-600 text-white sm:rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Bot size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold">Assistente Fleet AI</h3>
                  <p className="text-xs text-indigo-100 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    Online
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <span className={`text-[10px] block mt-2 opacity-60 ${msg.role === 'user' ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-bl-none border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 sm:rounded-b-2xl">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Pergunte sobre sua frota..."
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border-0 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isTyping}
                  className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-600/20"
                >
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