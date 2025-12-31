import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, Car, Wrench, Settings, LogOut, Fuel, CalendarDays, Users } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen, setIsOpen, onLogout }) => {
  const navItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'VEHICLES', label: 'Veículos', icon: Car },
    { id: 'DRIVERS', label: 'Motoristas', icon: Users },
    { id: 'MAINTENANCE', label: 'Manutenção', icon: Wrench },
    { id: 'PLANNER', label: 'Planejador', icon: CalendarDays },
    { id: 'FUEL', label: 'Abastecimento', icon: Fuel },
  ];

  const handleLogout = () => {
    if (confirm("Deseja realmente sair da plataforma?")) {
      onLogout();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-30 h-screen w-64 bg-slate-900 dark:bg-slate-950 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 border-r border-slate-800 dark:border-slate-800 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-center border-b border-slate-800 dark:border-slate-800">
          <h1 className="text-xl font-bold tracking-wider text-blue-400">FLEET<span className="text-white">AI</span></h1>
        </div>

        <nav className="mt-8 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id as ViewState);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                    : 'text-slate-400 hover:bg-slate-800 dark:hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <Icon size={20} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-0 w-full px-4">
          <button 
            onClick={() => {
              setView('SETTINGS');
              setIsOpen(false);
            }}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors mb-2
              ${currentView === 'SETTINGS' 
                ? 'bg-slate-800 text-white' 
                : 'text-slate-400 hover:bg-slate-800 dark:hover:bg-slate-800 hover:text-white'
              }`}
          >
            <Settings size={20} />
            Configurações
          </button>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-400 hover:bg-slate-800 dark:hover:bg-slate-800 hover:text-red-300 transition-colors"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
};