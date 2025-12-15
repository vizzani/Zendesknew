import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  AlertCircle, CheckCircle2, Briefcase, Users, Clock, 
  Calendar as CalendarIcon, LayoutDashboard, Plus, Trash2, 
  ChevronLeft, ChevronRight, UserCog, Table
} from 'lucide-react';
import { db } from './db.js';

// --- INTERFACES ---
interface Technician {
  id: string;
  name: string;
  role: string;
  initials: string;
}

interface LeaveRequest {
  id: string;
  techId: string;
  startDate: string;
  endDate: string;
  type: 'ferie' | 'permesso' | 'malattia' | 'cantiere';
  slot: 'mattina' | 'pomeriggio' | 'interagiornata';
  hours?: number;
  description?: string;
}

// --- UTILS ---
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isDateInRange = (dateToCheck: string, startDate: string, endDate: string): boolean => {
  return dateToCheck >= startDate && dateToCheck <= endDate;
};

const getTypeColor = (type: string, property: 'fill' | 'bg' | 'text' | 'border'): string => {
  const colors: Record<string, any> = {
    ferie: { fill: '#ef4444', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    permesso: { fill: '#f97316', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    malattia: { fill: '#a855f7', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    cantiere: { fill: '#3b82f6', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    default: { fill: '#94a3b8', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  };
  return (colors[type] || colors['default'])[property];
};

const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    ferie: 'Ferie',
    permesso: 'Permesso',
    malattia: 'Malattia',
    cantiere: 'Cantiere',
  };
  return labels[type] || type;
};

const getSlotLabel = (slot: string): string => {
  const labels: Record<string, string> = {
    mattina: 'Mattina',
    pomeriggio: 'Pomeriggio',
    interagiornata: 'Intera Giornata',
  };
  return labels[slot] || slot;
};

// --- COMPONENTS ---

// 1. KPI CARD
const KPICard = ({ title, value, icon: Icon, type, subtext }: { title: string, value: number, icon: any, type: 'danger' | 'success' | 'info', subtext?: string }) => {
  const colors = {
    danger: 'bg-red-50 text-red-600',
    success: 'bg-emerald-50 text-emerald-600',
    info: 'bg-blue-50 text-blue-600',
  };
  const iconColor = colors[type] || 'bg-slate-50 text-slate-600';
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h2 className="text-3xl font-bold text-slate-900">{value}</h2>
        {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg ${iconColor}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};

// 2. DASHBOARD VIEW (With logic for displaying names)
const DashboardView = ({ requests, technicians }: { requests: LeaveRequest[], technicians: Technician[] }) => {
  const today = formatDate(new Date()); 
  
  const activeAbsences = requests.filter(r => isDateInRange(today, r.startDate, r.endDate));
  const absentTodayCount = activeAbsences.length;
  const activeTechsCount = technicians.length - absentTodayCount;
  
  // LOGICA NOMI ASSENTI
  const absentNamesList = activeAbsences
    .map(req => technicians.find(t => t.id === req.techId)?.name)
    .filter(Boolean);

  const absentSubtext = absentNamesList.length > 0 
     ? absentNamesList.join(', ') 
     : `Su ${technicians.length} tecnici totali`;

  const upcomingLeaves = requests
    .filter(r => r.startDate > today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 10); // Increased slice since we have more space

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
         <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard Operativa</h1>
            <p className="text-slate-500">Panoramica del {new Date().toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
         </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard 
          title="Non Operativi Oggi" 
          value={absentTodayCount} 
          icon={AlertCircle} 
          type="danger" 
          subtext={absentSubtext}
        />
        <KPICard 
          title="Tecnici Disponibili" 
          value={activeTechsCount} 
          icon={CheckCircle2} 
          type="success" 
          subtext="Pronti per assegnazione"
        />
        <KPICard 
          title="Attività Pianificate" 
          value={requests.length} 
          icon={Briefcase} 
          type="info" 
          subtext="In questo mese"
        />
      </div>

      {/* DETTAGLIO ASSENZE ODIERNE */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
             <h3 className="text-base font-bold text-slate-800 flex items-center">
               <Users className="w-5 h-5 mr-2 text-slate-500" />
               Stato Assenze Odierne
             </h3>
             <span className={`text-xs font-bold px-3 py-1 rounded-full ${activeAbsences.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
               {activeAbsences.length > 0 ? `${activeAbsences.length} Risorse Indisponibili` : 'Tutto il team operativo'}
             </span>
          </div>
          
          <div className="p-6">
            {activeAbsences.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-slate-800 font-semibold">Tutti Presenti</h4>
                <p className="text-slate-500 text-sm">Nessuna assenza o cantiere registrato per oggi.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeAbsences.map(req => {
                  const tech = technicians.find(t => t.id === req.techId);
                  const bgClass = getTypeColor(req.type, 'bg');
                  const textClass = getTypeColor(req.type, 'text');
                  const borderClass = getTypeColor(req.type, 'border');

                  return (
                    <div key={req.id} className="flex flex-col bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="p-4 flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                            {tech?.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                             <div className="flex justify-between items-start">
                                 <p className="text-sm font-bold text-slate-900 truncate">{tech?.name}</p>
                             </div>
                             <p className="text-xs text-slate-500 mb-2">{tech?.role}</p>
                             <div className="flex flex-wrap gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${bgClass} ${textClass} ${borderClass}`}>
                                {getTypeLabel(req.type)}
                                </span>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {getSlotLabel(req.slot)}
                                </span>
                             </div>
                        </div>
                      </div>
                      {req.description && (
                        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-600 italic truncate rounded-b-lg">
                           "{req.description}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
      </div>

      {/* Upcoming List (Full Width) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-base font-bold mb-6 text-slate-800">Pianificazioni Future</h3>
        <div className="space-y-4">
          {upcomingLeaves.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">Nessuna attività futura registrata.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingLeaves.map(req => {
                const tech = technicians.find(t => t.id === req.techId);
                const bgClass = getTypeColor(req.type, 'bg');
                const textClass = getTypeColor(req.type, 'text');

                return (
                  <div key={req.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold group-hover:bg-slate-300 transition-colors">
                        {tech?.initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{tech?.name}</p>
                        <p className="text-xs text-slate-500">
                            dal {new Date(req.startDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                        <span className={`block text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${bgClass} ${textClass}`}>
                        {getTypeLabel(req.type)}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                            {getSlotLabel(req.slot)}
                        </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 3. CALENDAR VIEW
const CalendarView = ({ requests, technicians, onDelete }: { requests: LeaveRequest[], technicians: Technician[], onDelete: (id: string) => void }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
    const dateStr = formatDate(d);
    const dayRequests = requests.filter(r => isDateInRange(dateStr, r.startDate, r.endDate));
    return { date: d, dateStr, dayRequests };
  });

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const legendTypes = ['ferie', 'permesso', 'malattia', 'cantiere'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex space-x-2 mr-4">
                <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full border border-slate-200"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full border border-slate-200"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <h2 className="text-xl font-bold text-slate-800 capitalize min-w-[200px] text-center md:text-left">
            {currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
            </h2>
        </div>

        {/* LEGENDA */}
        <div className="flex flex-wrap gap-3 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
            {legendTypes.map(type => (
                <div key={type} className="flex items-center">
                    <span className={`w-3 h-3 rounded-full mr-2 ${getTypeColor(type, 'bg')} border ${getTypeColor(type, 'border')}`}></span>
                    <span className="text-xs font-medium text-slate-600 capitalize">{getTypeLabel(type)}</span>
                </div>
            ))}
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
        {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
          <div key={day} className="bg-slate-50 p-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
        
        {days.map(({ date, dateStr, dayRequests }) => {
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            return (
                <div key={dateStr} className={`bg-white min-h-[120px] p-2 transition-colors relative group ${isWeekend ? 'bg-slate-50/50' : 'hover:bg-blue-50/30'}`}>
                    <div className="flex justify-between items-start mb-1">
                        <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${dateStr === formatDate(new Date()) ? 'bg-blue-600 text-white shadow-md' : (isWeekend ? 'text-red-400' : 'text-slate-700')}`}>
                        {date.getDate()}
                        </span>
                    </div>
                    
                    <div className="mt-1 space-y-1.5">
                    {dayRequests.map(req => {
                        const tech = technicians.find(t => t.id === req.techId);
                        const bgClass = getTypeColor(req.type, 'bg');
                        const textClass = getTypeColor(req.type, 'text');
                        // Utilizziamo un bordo leggero per definire meglio il box colorato
                        const borderClass = req.type === 'cantiere' ? 'border-blue-200' : 'border-transparent'; 

                        return (
                        <div 
                            key={req.id} 
                            className={`text-[10px] px-2 py-1 rounded border ${bgClass} ${textClass} ${borderClass} truncate flex justify-between items-center group/item shadow-sm`}
                            title={`${tech?.name} - ${getTypeLabel(req.type)} (${getSlotLabel(req.slot)})`}
                        >
                            <span className="font-semibold truncate">{tech?.initials}</span>
                            <span className="hidden md:inline ml-1 opacity-80 truncate">- {getTypeLabel(req.type)}</span>
                            
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(req.id); }} 
                                className="opacity-0 group-hover/item:opacity-100 ml-1 text-current hover:font-bold transition-opacity"
                            >
                            <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                        );
                    })}
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

// 3.5 TIMELINE VIEW (VISTA "TUTTI")
const TimelineView = ({ requests, technicians }: { requests: LeaveRequest[], technicians: Technician[] }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    
    // Genera array dei giorni del mese
    const days = Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
        return {
            date: d,
            dateStr: formatDate(d),
            dayLabel: d.getDate(),
            isWeekend: d.getDay() === 0 || d.getDay() === 6
        };
    });

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    const legendTypes = ['ferie', 'permesso', 'malattia', 'cantiere'];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-140px)]">
            {/* HEADER */}
            <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                 <div className="flex items-center gap-4">
                    <div className="flex space-x-2">
                        <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full border border-slate-200"><ChevronLeft className="w-4 h-4" /></button>
                        <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full border border-slate-200"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 capitalize">
                    {currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                    </h2>
                 </div>

                 <div className="flex flex-wrap gap-3">
                    {legendTypes.map(type => (
                        <div key={type} className="flex items-center">
                            <span className={`w-3 h-3 rounded-sm mr-2 ${getTypeColor(type, 'bg')} border ${getTypeColor(type, 'border')}`}></span>
                            <span className="text-xs text-slate-500 capitalize">{getTypeLabel(type)}</span>
                        </div>
                    ))}
                 </div>
            </div>

            {/* TABLE SCROLL CONTAINER */}
            <div className="flex-1 overflow-auto relative">
                <table className="w-full border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-20">
                        <tr>
                            <th className="sticky left-0 bg-slate-50 z-30 p-3 text-left text-xs font-bold text-slate-500 uppercase border-b border-r border-slate-200 min-w-[150px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                Tecnico
                            </th>
                            {days.map(d => (
                                <th key={d.dateStr} className={`p-1 text-center border-b border-slate-200 min-w-[36px] ${d.isWeekend ? 'bg-slate-100 text-red-400' : 'text-slate-600'}`}>
                                    <div className="text-[10px] font-bold">{d.dayLabel}</div>
                                    <div className="text-[9px] font-normal uppercase">{d.date.toLocaleDateString('it-IT', { weekday: 'narrow' })}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {technicians.map((tech, idx) => (
                            <tr key={tech.id} className="hover:bg-slate-50/50">
                                <td className="sticky left-0 bg-white z-10 p-3 border-b border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-[10px] flex items-center justify-center font-bold">
                                            {tech.initials}
                                        </div>
                                        <div className="text-xs font-medium text-slate-700 truncate max-w-[120px]" title={tech.name}>
                                            {tech.name}
                                        </div>
                                    </div>
                                </td>
                                {days.map(d => {
                                    const dayReq = requests.find(r => r.techId === tech.id && isDateInRange(d.dateStr, r.startDate, r.endDate));
                                    const bgClass = dayReq ? getTypeColor(dayReq.type, 'bg') : (d.isWeekend ? 'bg-slate-50' : '');
                                    const textClass = dayReq ? getTypeColor(dayReq.type, 'text') : '';
                                    const borderClass = dayReq ? getTypeColor(dayReq.type, 'border') : 'border-slate-100';

                                    return (
                                        <td key={`${tech.id}-${d.dateStr}`} className={`border-b border-r ${borderClass} ${bgClass} p-1 text-center relative h-10`}>
                                            {dayReq && (
                                                <div 
                                                    className={`w-full h-full flex items-center justify-center text-[10px] font-bold ${textClass}`}
                                                    title={`${getTypeLabel(dayReq.type)} (${getSlotLabel(dayReq.slot)})`}
                                                >
                                                    {dayReq.type.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// 4. TECH MANAGEMENT VIEW
const TechView = ({ technicians, onAdd, onDelete }: { technicians: Technician[], onAdd: (t: Technician) => void, onDelete: (id: string) => void }) => {
  const [newTech, setNewTech] = useState({ name: '', role: '', initials: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTech.name && newTech.initials) {
      onAdd({ ...newTech, id: crypto.randomUUID() });
      setNewTech({ name: '', role: '', initials: '' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Aggiungi Tecnico</h2>
        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">Nome Completo</label>
            <input 
              className="w-full px-3 py-2 border rounded-lg text-sm" 
              value={newTech.name} 
              onChange={e => setNewTech({...newTech, name: e.target.value})}
              placeholder="Mario Rossi"
              required 
            />
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-slate-500 mb-1">Ruolo</label>
            <input 
              className="w-full px-3 py-2 border rounded-lg text-sm" 
              value={newTech.role} 
              onChange={e => setNewTech({...newTech, role: e.target.value})}
              placeholder="Tecnico Senior"
            />
          </div>
          <div className="w-24">
            <label className="block text-xs font-medium text-slate-500 mb-1">Iniziali</label>
            <input 
              className="w-full px-3 py-2 border rounded-lg text-sm" 
              value={newTech.initials} 
              onChange={e => setNewTech({...newTech, initials: e.target.value})}
              placeholder="MR"
              maxLength={3}
              required
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 text-sm font-medium flex items-center">
            <Plus className="w-4 h-4 mr-2" /> Aggiungi
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         <table className="w-full text-sm text-left">
           <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
             <tr>
               <th className="px-6 py-3">Iniziali</th>
               <th className="px-6 py-3">Nome</th>
               <th className="px-6 py-3">Ruolo</th>
               <th className="px-6 py-3 text-right">Azioni</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
             {technicians.map(tech => (
               <tr key={tech.id} className="hover:bg-slate-50">
                 <td className="px-6 py-3 font-bold text-slate-700">{tech.initials}</td>
                 <td className="px-6 py-3 text-slate-800">{tech.name}</td>
                 <td className="px-6 py-3 text-slate-500">{tech.role}</td>
                 <td className="px-6 py-3 text-right">
                   <button onClick={() => onDelete(tech.id)} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded">
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
      </div>
    </div>
  );
};

// 5. INSERT MODAL (New Request)
const InsertModal = ({ technicians, onClose, onSave }: { technicians: Technician[], onClose: () => void, onSave: (req: any) => void }) => {
  const [formData, setFormData] = useState({
    techId: technicians[0]?.id || '',
    startDate: formatDate(new Date()),
    endDate: formatDate(new Date()),
    type: 'ferie',
    slot: 'interagiornata',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, id: crypto.randomUUID() });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold mb-4">Nuova Assenza / Attività</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tecnico</label>
            <select 
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              value={formData.techId}
              onChange={e => setFormData({...formData, techId: e.target.value})}
            >
              {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Dal</label>
                <input type="date" className="w-full px-3 py-2 border rounded-lg text-sm" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
             </div>
             <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Al</label>
                <input type="date" className="w-full px-3 py-2 border rounded-lg text-sm" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
              <select className="w-full px-3 py-2 border rounded-lg text-sm bg-white" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="ferie">Ferie</option>
                <option value="permesso">Permesso</option>
                <option value="malattia">Malattia</option>
                <option value="cantiere">Cantiere</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Slot</label>
              <select className="w-full px-3 py-2 border rounded-lg text-sm bg-white" value={formData.slot} onChange={e => setFormData({...formData, slot: e.target.value})}>
                <option value="interagiornata">Intera Giornata</option>
                <option value="mattina">Mattina</option>
                <option value="pomeriggio">Pomeriggio</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Descrizione (Opzionale)</label>
            <input 
              className="w-full px-3 py-2 border rounded-lg text-sm"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Note aggiuntive..."
            />
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
             <button type="button" onClick={onClose} className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Annulla</button>
             <button type="submit" className="flex-1 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium">Salva</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
const App = () => {
  const [view, setView] = useState<'dashboard' | 'calendar' | 'timeline' | 'techs'>('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Data on Mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [techsData, reqsData] = await Promise.all([
          db.technicians.list(),
          db.requests.list()
        ]);
        setTechnicians(techsData);
        setRequests(reqsData);
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAddRequest = async (req: LeaveRequest) => {
    const saved = await db.requests.add(req);
    setRequests([...requests, saved]);
    setShowModal(false);
  };

  const handleDeleteRequest = async (id: string) => {
    // In a real app we would have a delete endpoint for requests too
    // keeping it local state for now for the calendar view interaction
    setRequests(requests.filter(r => r.id !== id));
  };

  const handleAddTech = async (tech: Technician) => {
    const saved = await db.technicians.add(tech);
    setTechnicians([...technicians, saved]);
  };

  const handleDeleteTech = async (id: string) => {
    await db.technicians.remove(id);
    setTechnicians(technicians.filter(t => t.id !== id));
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-slate-400">Caricamento risorse...</div>;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col">
        <div className="p-6">
          <h1 className="text-white font-bold text-lg tracking-tight flex items-center gap-2">
            <LayoutDashboard className="text-blue-500" />
            Team Planner
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${view === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800'}`}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
          </button>
          <button 
            onClick={() => setView('calendar')}
            className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${view === 'calendar' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800'}`}
          >
            <CalendarIcon className="w-5 h-5 mr-3" /> Calendario
          </button>
          <button 
            onClick={() => setView('timeline')}
            className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${view === 'timeline' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800'}`}
          >
            <Table className="w-5 h-5 mr-3" /> Vista Globale
          </button>
          <button 
            onClick={() => setView('techs')}
            className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${view === 'techs' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800'}`}
          >
            <UserCog className="w-5 h-5 mr-3" /> Risorse
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
           <button 
             onClick={() => setShowModal(true)}
             className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm shadow-lg flex items-center justify-center transition-all hover:scale-[1.02]"
           >
             <Plus className="w-5 h-5 mr-2" /> Nuova Attività
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen">
        <div className="max-w-7xl mx-auto">
          {view === 'dashboard' && <DashboardView requests={requests} technicians={technicians} />}
          {view === 'calendar' && <CalendarView requests={requests} technicians={technicians} onDelete={handleDeleteRequest} />}
          {view === 'timeline' && <TimelineView requests={requests} technicians={technicians} />}
          {view === 'techs' && <TechView technicians={technicians} onAdd={handleAddTech} onDelete={handleDeleteTech} />}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <InsertModal 
          technicians={technicians} 
          onClose={() => setShowModal(false)} 
          onSave={handleAddRequest} 
        />
      )}
    </div>
  );
};

// --- RENDER ROOT ---
const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);