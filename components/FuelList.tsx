
import React, { useState, useEffect, useRef } from 'react';
import { FuelRecord, Vehicle, Driver } from '../types';
import { Plus, Search, Filter, Fuel, Camera, X, FileText, Droplet, Pencil, MapPin, Navigation, Map as MapIcon, RefreshCw, User, Check, Layers, LocateFixed, Sparkles } from 'lucide-react';
import L from 'leaflet';
import { getThemeInsight } from '../services/geminiService';

interface FuelListProps {
  fuelRecords: FuelRecord[];
  vehicles: Vehicle[];
  drivers: Driver[];
  onAddFuel: (record: Omit<FuelRecord, 'id'>) => void;
  onUpdateFuel: (record: FuelRecord) => void;
}

export const FuelList: React.FC<FuelListProps> = ({ fuelRecords, vehicles, drivers, onAddFuel, onUpdateFuel }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const modalMapRef = useRef<HTMLDivElement>(null);
  const leafletModalMap = useRef<L.Map | null>(null);
  const modalMarker = useRef<L.Marker | null>(null);

  const [formData, setFormData] = useState<Omit<FuelRecord, 'id'>>({
    vehicleId: '', driverId: '', date: new Date().toISOString().split('T')[0],
    odometer: 0, liters: 0, totalCost: 0, receiptUrl: '', location: undefined
  });

  const getVehicleInfo = (id: string) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `${v.brand} ${v.model} (${v.plate})` : 'Veículo não encontrado';
  };

  const getDriverInfo = (id: string) => {
    const d = drivers.find(d => d.id === id);
    return d ? d.name : 'Motorista Desconhecido';
  };

  const getDriverPhoto = (id: string) => drivers.find(d => d.id === id)?.photoUrl;

  const filteredRecords = selectedVehicleId 
    ? fuelRecords.filter(r => r.vehicleId === selectedVehicleId)
    : fuelRecords;

  const recordsWithLocation = filteredRecords.filter(r => r.location && r.location.latitude && r.location.longitude);

  const handleAIInsight = async () => {
    if (fuelRecords.length < 2) {
      alert("São necessários ao menos 2 registros para uma análise de consumo.");
      return;
    }
    setIsLoadingAI(true);
    const result = await getThemeInsight('fuel', fuelRecords.slice(0, 20));
    setAiInsight(result);
    setIsLoadingAI(false);
  };

  useEffect(() => {
    if (showMap && mapRef.current && !leafletMap.current) {
      leafletMap.current = L.map(mapRef.current).setView([-23.5505, -46.6333], 12);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(leafletMap.current);
      markersLayer.current = L.layerGroup().addTo(leafletMap.current);
    }
    if (showMap && leafletMap.current && markersLayer.current) {
      markersLayer.current.clearLayers();
      const bounds: L.LatLngExpression[] = [];
      recordsWithLocation.forEach(record => {
        if (record.location) {
          const v = vehicles.find(vec => vec.id === record.vehicleId);
          const marker = L.marker([record.location.latitude, record.location.longitude])
            .bindPopup(`<b>${v?.plate}</b> - R$ ${record.totalCost}`);
          marker.addTo(markersLayer.current!);
          bounds.push([record.location.latitude, record.location.longitude]);
        }
      });
      if (bounds.length > 0) leafletMap.current.fitBounds(L.latLngBounds(bounds), { padding: [30, 30] });
    }
  }, [showMap, recordsWithLocation, vehicles]);

  useEffect(() => {
    if (isModalOpen && formData.location && modalMapRef.current) {
      const { latitude, longitude } = formData.location;
      if (!leafletModalMap.current) {
        leafletModalMap.current = L.map(modalMapRef.current, { zoomControl: false, scrollWheelZoom: false }).setView([latitude, longitude], 16);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(leafletModalMap.current);
        modalMarker.current = L.marker([latitude, longitude], { draggable: true }).addTo(leafletModalMap.current);
        modalMarker.current.on('dragend', (e) => {
          const pos = e.target.getLatLng();
          setFormData(prev => ({ ...prev, location: { latitude: pos.lat, longitude: pos.lng } }));
        });
      } else {
        leafletModalMap.current.setView([latitude, longitude]);
        if (modalMarker.current) modalMarker.current.setLatLng([latitude, longitude]);
      }
      setTimeout(() => leafletModalMap.current?.invalidateSize(), 100);
    }
    if (!isModalOpen || !formData.location) {
      leafletModalMap.current?.remove();
      leafletModalMap.current = null;
      modalMarker.current = null;
    }
  }, [isModalOpen, formData.location]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ vehicleId: '', driverId: '', date: new Date().toISOString().split('T')[0], odometer: 0, liters: 0, totalCost: 0, receiptUrl: '', location: undefined });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: FuelRecord) => {
    setEditingId(record.id);
    setFormData({ ...record, receiptUrl: record.receiptUrl || '' });
    setIsModalOpen(true);
  };

  const handleCaptureLocation = () => {
    setIsCapturingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({ ...prev, location: { latitude: pos.coords.latitude, longitude: pos.coords.longitude } }));
        setIsCapturingLocation(false);
      },
      () => setIsCapturingLocation(false),
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editingId ? onUpdateFuel({ ...formData, id: editingId }) : onAddFuel(formData);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Abastecimentos</h2>
          <p className="text-slate-500 dark:text-slate-400">Controle de consumo e rotas da frota.</p>
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
            onClick={() => setShowMap(!showMap)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium border transition-all ${
              showMap ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {showMap ? <Layers size={18} /> : <MapIcon size={18} />}
            {showMap ? 'Ver Lista' : 'Ver Mapa'}
          </button>
          <button 
            onClick={handleOpenCreate}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Plus size={20} />
            Novo Registro
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

      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2 sm:mb-0">
          <Filter size={20} />
          <span className="font-medium text-sm">Filtrar Veículo:</span>
        </div>
        <select
          value={selectedVehicleId}
          onChange={(e) => setSelectedVehicleId(e.target.value)}
          className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:white focus:outline-none transition-colors"
        >
          <option value="">Todos os Veículos</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>{v.brand} {v.model} - {v.plate}</option>
          ))}
        </select>
      </div>

      {showMap ? (
        <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm h-[500px] relative overflow-hidden animate-fade-in">
          <div ref={mapRef} className="w-full h-full rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
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
                  <p className="text-xs text-slate-400 uppercase font-semibold">Veículo</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{getVehicleInfo(record.vehicleId)}</p>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center overflow-hidden shrink-0">
                     {getDriverPhoto(record.driverId) ? (
                       <img src={getDriverPhoto(record.driverId)} className="w-full h-full object-cover" />
                     ) : (
                       <User size={14} className="text-indigo-600" />
                     )}
                  </div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{getDriverInfo(record.driverId)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <p className="text-xs text-slate-400 uppercase font-semibold">Hodômetro</p>
                     <p className="text-sm font-mono text-slate-700 dark:text-slate-300">{record.odometer} km</p>
                  </div>
                  <div>
                     <p className="text-xs text-slate-400 uppercase font-semibold">Litros</p>
                     <p className="text-sm text-slate-700 dark:text-slate-300">{record.liters} L</p>
                  </div>
                </div>
              </div>
              <button onClick={() => handleOpenEdit(record)} className="absolute top-2 right-2 p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:text-indigo-600">
                <Pencil size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{editingId ? 'Editar Abastecimento' : 'Novo Abastecimento'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Veículo</label>
                  <select required className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    value={formData.vehicleId} onChange={e => setFormData({...formData, vehicleId: e.target.value})}>
                      <option value="">Selecione...</option>
                      {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Motorista</label>
                  <select required className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    value={formData.driverId} onChange={e => setFormData({...formData, driverId: e.target.value})}>
                      <option value="">Selecione...</option>
                      {drivers.filter(d => d.status === 'Ativo').map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Hodômetro (km)</label>
                  <input required type="number" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" 
                    value={formData.odometer || ''} onChange={e => setFormData({...formData, odometer: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Custo Total (R$)</label>
                  <input required type="number" step="0.01" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" 
                    value={formData.totalCost || ''} onChange={e => setFormData({...formData, totalCost: parseFloat(e.target.value)})} />
                </div>
              </div>
              <button type="button" onClick={handleCaptureLocation} className="w-full py-2.5 border rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                {isCapturingLocation ? <RefreshCw className="animate-spin" size={16} /> : <MapPin size={16} />}
                {formData.location ? 'Localização Capturada' : 'Capturar Local'}
              </button>
              {formData.location && <div className="h-40 w-full rounded-2xl overflow-hidden border border-slate-200"><div ref={modalMapRef} className="w-full h-full" /></div>}
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border rounded-xl font-bold">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">Salvar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
