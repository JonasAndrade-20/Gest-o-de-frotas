
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, Vehicle, MaintenanceRecord, FuelRecord } from '../types';
import { Camera, Mail, Shield, User, MapPin, Key, Save, X, Lock, CheckCircle2, RefreshCw } from 'lucide-react';

interface ProfileViewProps {
  user: UserProfile;
  onUpdateUser: (u: UserProfile) => void;
  vehicles: Vehicle[];
  maintenance: MaintenanceRecord[];
  fuelRecords: FuelRecord[];
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateUser, vehicles, maintenance, fuelRecords }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [locationName, setLocationName] = useState('Detectando localização...');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [editForm, setEditForm] = useState({ ...user });
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Capturar Localização Atual
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationName('Localização não suportada');
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // Simplificado: Exibe as coordenadas ou poderia usar um serviço de reverse geocoding
        // Para manter minimalista e funcional sem APIs externas de mapas aqui:
        setLocationName(`Lat: ${latitude.toFixed(2)}, Long: ${longitude.toFixed(2)}`);
        setIsDetectingLocation(false);
      },
      (error) => {
        setLocationName('São Paulo, Brasil (Padrão)');
        setIsDetectingLocation(false);
      }
    );
  };

  useEffect(() => {
    detectLocation();
  }, []);

  // Processar Atividades Recentes Reais
  const getRecentActivities = () => {
    const activities: { text: string; time: string; date: Date }[] = [];

    // Pegar últimas manutenções
    maintenance.slice(0, 3).forEach(m => {
      const v = vehicles.find(vec => vec.id === m.vehicleId);
      activities.push({
        text: `${m.status === 'Concluído' ? 'Finalizou' : 'Registrou'} manutenção: ${m.description} (${v?.plate || 'S/P'})`,
        time: new Date(m.date).toLocaleDateString('pt-BR'),
        date: new Date(m.date)
      });
    });

    // Pegar últimos abastecimentos
    fuelRecords.slice(0, 3).forEach(f => {
      const v = vehicles.find(vec => vec.id === f.vehicleId);
      activities.push({
        text: `Registrou abastecimento de ${f.liters}L para o veículo ${v?.plate || ''}`,
        time: new Date(f.date).toLocaleDateString('pt-BR'),
        date: new Date(f.date)
      });
    });

    // Ordenar por data mais recente e pegar as 5 primeiras
    return activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  };

  const recentActivities = getRecentActivities();

  const handleEditToggle = () => {
    if (isEditing) setEditForm({ ...user });
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      name: editForm.name,
      email: editForm.email,
      role: editForm.role,
      avatarUrl: editForm.avatarUrl
    });
    setIsEditing(false);
  };

  const handlePhotoClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setEditForm(prev => ({ ...prev, avatarUrl: base64String }));
        if (!isEditing) onUpdateUser({ ...user, avatarUrl: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      alert("As senhas não coincidem!");
      return;
    }
    setShowPasswordSuccess(true);
    setTimeout(() => {
      setIsPasswordModalOpen(false);
      setShowPasswordSuccess(false);
      setPasswordForm({ current: '', new: '', confirm: '' });
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-12">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all">
        {/* Banner */}
        <div className="h-40 bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 relative">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]"></div>
        </div>
        
        <div className="px-8 pb-8">
          <div className="relative flex flex-col md:flex-row justify-between items-center md:items-end -mt-16 mb-8 gap-6">
            <div className="relative group">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              <div 
                onClick={handlePhotoClick}
                className="w-32 h-32 rounded-3xl border-8 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 overflow-hidden shadow-2xl cursor-pointer hover:scale-105 transition-transform"
              >
                {(isEditing ? editForm.avatarUrl : user.avatarUrl) ? (
                  <img src={isEditing ? editForm.avatarUrl : user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-indigo-600 font-black text-4xl bg-indigo-50 dark:bg-indigo-900/30">
                    {(isEditing ? editForm.name : user.name).charAt(0)}
                  </div>
                )}
              </div>
              <button onClick={handlePhotoClick} className="absolute bottom-2 right-2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 z-10">
                <Camera size={18} />
              </button>
            </div>

            <div className="flex gap-3 pb-2">
              {isEditing ? (
                <>
                  <button onClick={handleEditToggle} className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all flex items-center gap-2">
                    <X size={18} /> Cancelar
                  </button>
                  <button onClick={handleSaveProfile} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2">
                    <Save size={18} /> Salvar Perfil
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleEditToggle} className="px-6 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold text-slate-700 dark:text-white hover:bg-slate-50 transition-all">
                    Editar Perfil
                  </button>
                  <button onClick={() => setIsPasswordModalOpen(true)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30">
                    Alterar Senha
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="space-y-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nome Completo</label>
                      <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full text-2xl font-black bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-5 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargo / Função</label>
                      <input type="text" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-5 py-3 text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{user.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 text-[10px] font-black uppercase rounded-full flex items-center gap-1.5">
                         <Shield size={12} /> {user.role}
                       </span>
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 text-slate-400 mb-2">
                    <Mail size={16} className="text-indigo-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Email Corporativo</span>
                  </div>
                  <p className="font-bold text-slate-800 dark:text-white truncate">{user.email}</p>
                </div>
                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 relative group">
                  <div className="flex items-center gap-3 text-slate-400 mb-2">
                    <MapPin size={16} className="text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Localização Atual</span>
                    <button onClick={detectLocation} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">
                       <RefreshCw size={12} className={isDetectingLocation ? 'animate-spin' : ''} />
                    </button>
                  </div>
                  <p className="font-bold text-slate-800 dark:text-white truncate">
                    {isDetectingLocation ? 'Buscando GPS...' : locationName}
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b-2 border-slate-100 dark:border-slate-800">
                  <Key size={18} className="text-indigo-500" /> Atividades Recentes do Gestor
                </h3>
                <div className="space-y-4">
                  {recentActivities.map((act, i) => (
                    <div key={i} className="flex items-start justify-between gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
                      <div className="flex items-start gap-3">
                         <div className="mt-1 w-2 h-2 rounded-full bg-indigo-400 shrink-0"></div>
                         <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{act.text}</p>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase whitespace-nowrap pt-1">{act.time}</span>
                    </div>
                  ))}
                  {recentActivities.length === 0 && (
                    <div className="text-center py-8 text-slate-400 italic text-sm">Nenhuma atividade registrada na frota ainda.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                <h4 className="font-black text-slate-900 dark:text-white mb-6 uppercase text-xs tracking-widest">Informações da Conta</h4>
                <div className="space-y-5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500 font-medium">Membro desde</span>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-200">Jan 2023</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500 font-medium">Veículos Geridos</span>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-200">{vehicles.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500 font-medium">Status do Perfil</span>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full uppercase">Ativo</span>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-xl shadow-indigo-600/20 relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Shield size={120} />
                </div>
                <p className="text-xs font-bold leading-relaxed italic relative z-10">
                  "Sua conta possui acesso total de administrador. Lembre-se de manter sua senha segura e as ordens de manutenção sempre atualizadas."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-700">
            <div className="p-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Segurança</h3>
                  <p className="text-sm text-slate-500 font-medium">Redefina sua senha de acesso.</p>
                </div>
                <button onClick={() => setIsPasswordModalOpen(false)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                  <X size={24} />
                </button>
              </div>

              {showPasswordSuccess ? (
                <div className="py-10 text-center space-y-4 animate-scale-in">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl mb-4">
                    <CheckCircle2 size={40} />
                  </div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white">Tudo pronto!</h4>
                  <p className="text-sm text-slate-500 font-medium">Sua senha foi atualizada com sucesso.</p>
                </div>
              ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Senha Atual</label>
                    <div className="relative">
                       <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                       <input required type="password" placeholder="••••••••" className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" value={passwordForm.current} onChange={e => setPasswordForm({...passwordForm, current: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nova Senha</label>
                    <div className="relative">
                       <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                       <input required type="password" placeholder="••••••••" className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" value={passwordForm.new} onChange={e => setPasswordForm({...passwordForm, new: e.target.value})} />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black mt-8 shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all uppercase tracking-widest text-xs">
                    Confirmar Alteração
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
