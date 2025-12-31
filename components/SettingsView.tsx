import React from 'react';
import { AppSettings } from '../types';
import { Save, Bell, Globe, DollarSign, Ruler, Building } from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    onUpdateSettings({
      ...settings,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Configurações do Sistema</h2>
        <p className="text-slate-500 dark:text-slate-400">Personalize o comportamento da plataforma Fleet AI.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* General Settings */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Building size={20} className="text-indigo-500" />
              Geral
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome da Frota / Empresa</label>
                <input 
                  type="text" 
                  name="fleetName"
                  value={settings.fleetName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <DollarSign size={14} /> Moeda
                  </label>
                  <select 
                    name="currency"
                    value={settings.currency}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="BRL">Real (R$)</option>
                    <option value="USD">Dólar ($)</option>
                    <option value="EUR">Euro (€)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Ruler size={14} /> Unidade de Distância
                  </label>
                  <select 
                    name="distanceUnit"
                    value={settings.distanceUnit}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="km">Quilômetros (km)</option>
                    <option value="mi">Milhas (mi)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Bell size={20} className="text-indigo-500" />
              Notificações
            </h3>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <div>
                <p className="font-medium text-slate-800 dark:text-white">Alertas de Manutenção</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Receba avisos quando ordens estiverem atrasadas.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="notificationsEnabled"
                  checked={settings.notificationsEnabled}
                  onChange={handleChange}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-indigo-600 text-white p-6 rounded-xl shadow-lg shadow-indigo-600/20">
            <Globe className="mb-4 opacity-50" size={32} />
            <h4 className="font-bold mb-2">Fleet AI Cloud</h4>
            <p className="text-sm text-indigo-100 mb-4">Seus dados são sincronizados automaticamente em todos os seus dispositivos.</p>
            <div className="text-xs p-2 bg-indigo-500/50 rounded">
              Versão: 2.5.0-stable
            </div>
          </div>
          
          <button className="w-full flex items-center justify-center gap-2 bg-slate-800 dark:bg-slate-700 text-white py-3 rounded-xl font-semibold hover:bg-slate-900 dark:hover:bg-slate-600 transition-all active:scale-95">
            <Save size={18} />
            Salvar Preferências
          </button>
        </div>
      </div>
    </div>
  );
};