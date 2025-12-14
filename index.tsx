import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  PlusCircle, 
  BarChart3, 
  ChevronLeft, 
  ChevronRight,
  Sun,
  LayoutGrid,
  AlignLeft,
  Thermometer,
  Hammer,
  Info,
  Mail,
  PanelLeftClose,
  PanelLeft,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  UserPlus,
  Trash2,
  Settings,
  Loader2,
  List,
  Grid
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { db } from './db.js';

// --- Types ---

type AbsenceType = 'ferie' | 'permesso' | 'malattia' | 'cantiere';
type TimeSlot = 'full' | 'morning' | 'afternoon' | 'hours';

interface Technician {
  id: string;
  name: string;
  role: string;
  initials: string;
}

interface LeaveRequest {
  id: string;
  techId: string;
  startDate: string; // ISO Date YYYY-MM-DD
  endDate: string;   // ISO Date YYYY-MM-DD
  type: AbsenceType;
  slot: TimeSlot;
  hours?: number;    // If slot is 'hours'
  description?: string;
}

interface TooltipData {
  visible: boolean;
  x: number;
  y: number;
  techName?: string;
  techRole?: string;
  type?: AbsenceType;
  slot?: TimeSlot;
  dateRange?: string;
  hours?: number;
  description?: string;
}

// --- Helper Functions ---

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); // 0 = Sun

const formatDate = (date: Date) => date.toISOString().split('T')[0];

const isDateInRange = (checkDate: string, start: string, end: string) => {
  return checkDate >= start && checkDate <= end;
};

const generateInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// MODERN COLOR PALETTE
const getTypeColor = (type: AbsenceType, shade: 'bg' | 'text' | 'border' | 'solid' | 'fill' = 'bg') => {
  switch (type) {
    case 'ferie':
      if (shade === 'bg') return 'bg-rose-50';
      if (shade === 'text') return 'text-rose-700';
      if (shade === 'border') return 'border-rose-200';
      if (shade === 'solid') return 'bg-rose-600'; 
      return '#e11d48'; 
    case 'permesso':
      if (shade === 'bg') return 'bg-amber-50';
      if (shade === 'text') return 'text-amber-700';
      if (shade === 'border') return 'border-amber-200';
      if (shade === 'solid') return 'bg-amber-500';
      return '#f59e0b';
    case 'malattia':
      if (shade === 'bg') return 'bg-indigo-50';
      if (shade === 'text') return 'text-indigo-700';
      if (shade === 'border') return 'border-indigo-200';
      if (shade === 'solid') return 'bg-indigo-600';
      return '#4f46e5';
    case 'cantiere':
      if (shade === 'bg') return 'bg-emerald-50';
      if (shade === 'text') return 'text-emerald-700';
      if (shade === 'border') return 'border-emerald-200';
      if (shade === 'solid') return 'bg-emerald-600';
      return '#059669';
    default:
      return 'gray';
  }
};

const getTypeLabel = (type: AbsenceType) => {
  switch (type) {
    case 'ferie': return 'Ferie';
    case 'permesso': return 'Permesso';
    case 'malattia': return 'Malattia';
    case 'cantiere': return 'Cantiere';
    default: return type;
  }
};

const getSlotLabel = (slot: TimeSlot) => {
    switch(slot) {
        case 'full': return 'Giornata Intera';
        case 'morning': return 'Mattina';
        case 'afternoon': return 'Pomeriggio';
        case 'hours': return 'A Ore';
        default: return slot;
    }
}

// --- Components ---

const GlobalTooltip = ({ data }: { data: TooltipData }) => {
  if (!data.visible) return null;

  return (
    <div 
      className="fixed z-50 pointer-events-none transition-opacity duration-200"
      style={{ 
        left: Math.min(data.x + 15, window.innerWidth - 300), // Prevent overflow on right
        top: data.y + 15,
        maxWidth: '280px'
      }}
    >
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden text-sm ring-1 ring-black/5">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span className={`font-bold text-xs uppercase tracking-wider px-2 py-0.5 rounded-full ${data.type ? getTypeColor(data.type, 'bg') : ''} ${data.type ? getTypeColor(data.type, 'text') : ''}`}>
                {getTypeLabel(data.type || 'ferie')}
            </span>
           {data.hours && <span className="text-xs font-mono bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{data.hours}h</span>}
        </div>
        <div className="p-4 bg-white space-y-3">
          <div>
            <p className="font-bold text-slate-900 text-base">{data.techName}</p>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{data.techRole}</p>
          </div>
          <div className="space-y-1">
             <div className="text-sm text-slate-600 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2 text-slate-400" />
                {data.dateRange}
             </div>
             {data.slot !== 'full' && (
                <div className="text-sm text-slate-600 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-slate-400" />
                  <span>{getSlotLabel(data.slot || 'full')}</span>
                </div>
             )}
          </div>
          {data.description && (
            <div className="pt-3 mt-1 border-t border-slate-100 text-sm text-slate-600 italic">
               "{data.description}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon: Icon, subtext, type }: any) => {
    let iconBg = 'bg-slate-100 text-slate-600';
    if (type === 'danger') iconBg = 'bg-rose-100 text-rose-600';
    if (type === 'success') iconBg = 'bg-emerald-100 text-emerald-600';
    if (type === 'info') iconBg = 'bg-blue-100 text-blue-600';

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 transition-all hover:shadow-md">
            <div className={`p-3 rounded-lg ${iconBg}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{title}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{value}</h3>
                {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
            </div>
        </div>
    );
};

const Sidebar = ({ current, setView, isCollapsed, toggleCollapse }: any) => {
  const views = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'calendar', label: 'Calendario', icon: CalendarIcon },
    { id: 'timeline', label: 'Timeline', icon: AlignLeft },
    { id: 'team', label: 'Gestione Team', icon: Users },
    { id: 'info', label: 'Informazioni', icon: Info },
  ];

  return (
    <div className={`bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-0 md:w-16 overflow-hidden md:overflow-visible' : 'w-64'} h-full relative z-20 shadow-lg`}>
      <div className="p-4 flex items-center justify-between h-16 border-b border-slate-800">
        {!isCollapsed && <span className="font-bold text-white tracking-tight text-lg">Menu</span>}
        <button 
          onClick={toggleCollapse} 
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors mx-auto md:mx-0"
        >
          {isCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {views.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`w-full flex items-center px-3 py-3 rounded-lg transition-all group relative ${
              current === v.id 
                ? 'bg-[#17494D] text-white shadow-md' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className={`flex items-center justify-center ${isCollapsed ? 'w-full' : ''}`}>
               <v.icon className={`w-5 h-5 ${current === v.id ? 'text-emerald-400' : 'group-hover:text-slate-200'}`} />
            </div>
            
            {!isCollapsed && (
              <span className="ml-3 text-sm font-medium truncate">{v.label}</span>
            )}
            
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-slate-700 hidden md:block">
                {v.label}
              </div>
            )}
          </button>
        ))}
      </nav>

      {!isCollapsed && (
        <div className="p-4 bg-slate-950/30">
          <div className="text-xs text-slate-500 text-center font-medium">
            ITS Pescara Helpdesk
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Views ---

const InfoView = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-2xl mx-auto mt-6 text-center animate-fade-in">
       <div className="w-20 h-20 bg-[#17494D]/5 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-[#17494D]/20">
         <Info className="w-10 h-10 text-[#17494D]" />
       </div>
       <h2 className="text-2xl font-bold text-slate-800 mb-2">Portale Risorse Tecniche</h2>
       <p className="text-slate-500 mb-6">Versione Ottimizzata per Zendesk & Vercel</p>
       
       <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mb-6 border border-blue-100">
         <strong>Stato Backend:</strong><br/>
         Connesso a <code>db.js</code> (Simulazione Locale). <br/>
         Predisposto per integrazione Serverless (es. Vercel Postgres).
       </div>

       <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 text-left grid gap-6">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Contatti Supporto</h3>
            <div className="flex items-center p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-md mr-4">
                     <Mail className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold">Sviluppatore</p>
                    <a href="mailto:matteo.vizzani@rematarlazzi.it" className="text-slate-800 font-medium hover:text-[#17494D] transition-colors">
                        matteo.vizzani@rematarlazzi.it
                    </a>
                </div>
            </div>
          </div>
       </div>
    </div>
  );
};

const TechManagerView = ({ technicians, onAdd, onRemove }: any) => {
    const [newTech, setNewTech] = useState({ name: '', role: '' });
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (newTech.name && newTech.role) {
        onAdd({
          name: newTech.name,
          role: newTech.role,
          id: Math.random().toString(36).substr(2, 9),
          initials: generateInitials(newTech.name)
        });
        setNewTech({ name: '', role: '' });
      }
    };
  
    return (
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
           <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
             <UserPlus className="w-6 h-6 mr-2 text-[#17494D]" />
             Aggiungi Nuovo Tecnico
           </h2>
           <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
             <div className="flex-1 w-full">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome e Cognome</label>
               <input 
                 type="text"
                 placeholder="Es. Mario Rossi"
                 className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#17494D]/20 focus:border-[#17494D]"
                 value={newTech.name}
                 onChange={e => setNewTech({...newTech, name: e.target.value})}
               />
             </div>
             <div className="flex-1 w-full">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ruolo / Mansione</label>
               <input 
                 type="text"
                 placeholder="Es. Helpdesk"
                 className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#17494D]/20 focus:border-[#17494D]"
                 value={newTech.role}
                 onChange={e => setNewTech({...newTech, role: e.target.value})}
               />
             </div>
             <button 
                type="submit"
                disabled={!newTech.name || !newTech.role}
                className="w-full md:w-auto bg-[#17494D] text-white py-3 px-6 rounded-lg font-bold hover:bg-[#133a3e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
             >
               Aggiungi
             </button>
           </form>
        </div>
  
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
             <h3 className="text-base font-bold text-slate-800">Membri del Team ({technicians.length})</h3>
           </div>
           <div className="divide-y divide-slate-100">
             {technicians.map((tech: Technician) => (
               <div key={tech.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold">
                      {tech.initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{tech.name}</p>
                      <p className="text-xs text-slate-500">{tech.role}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onRemove(tech.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="Rimuovi Tecnico"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
               </div>
             ))}
           </div>
        </div>
      </div>
    );
  };

const DashboardView = ({ requests, technicians }: { requests: LeaveRequest[], technicians: Technician[] }) => {
  const today = formatDate(new Date()); 
  
  // Find requests active today
  const activeAbsences = requests.filter(r => isDateInRange(today, r.startDate, r.endDate));
  const absentTodayCount = activeAbsences.length;
  const activeTechsCount = technicians.length - absentTodayCount;
  
  const chartData = useMemo(() => {
    const cantiereCount = requests.filter(r => r.type === 'cantiere').length;
    return [
      { name: 'Interventi Cantiere', value: cantiereCount, fill: getTypeColor('cantiere', 'fill') },
    ];
  }, [requests]);

  const upcomingLeaves = requests
    .filter(r => r.startDate > today) // Only future
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in p-2">
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
          subtext={`Su ${technicians.length} tecnici totali`}
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

      {/* NOT OPERATIONAL TODAY SECTION */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-base font-bold mb-6 text-slate-800">Analisi Interventi (Cantiere)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                 <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={140} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    cursor={{fill: '#f1f5f9'}}
                />
                <Bar dataKey="value" barSize={32} radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-base font-bold mb-6 text-slate-800">Pianificazioni Future</h3>
          <div className="space-y-4">
            {upcomingLeaves.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">Nessuna attività futura registrata.</p>
            ) : (
              upcomingLeaves.map(req => {
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
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CalendarView = ({ requests, technicians, currentMonth, currentYear, onChangeMonth, onHoverInfo, onDateClick }: any) => {
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month');
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return requests.filter((r: LeaveRequest) => isDateInRange(dateStr, r.startDate, r.endDate));
  };

  const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

  // Daily View Render Logic
  const renderDailyView = () => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    
    return (
        <div className="animate-fade-in flex-1 overflow-auto">
            <div className="flex justify-between items-center mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                 <button onClick={() => setSelectedDay(Math.max(1, selectedDay - 1))} className="p-2 hover:bg-white rounded-md text-slate-500"><ChevronLeft className="w-5 h-5"/></button>
                 <div className="text-center">
                    <h3 className="text-lg font-bold text-slate-800">{selectedDay} {monthNames[currentMonth]} {currentYear}</h3>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Programma Giornaliero</p>
                 </div>
                 <button onClick={() => setSelectedDay(Math.min(daysInMonth, selectedDay + 1))} className="p-2 hover:bg-white rounded-md text-slate-500"><ChevronRight className="w-5 h-5"/></button>
            </div>

            <div className="space-y-3">
                {technicians.map((tech: Technician) => {
                    const req = requests.find((r: LeaveRequest) => 
                        r.techId === tech.id && isDateInRange(dateStr, r.startDate, r.endDate)
                    );
                    
                    const isPresent = !req;

                    return (
                        <div key={tech.id} className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-center justify-between group hover:bg-white hover:shadow-sm transition-all">
                             <div className="flex items-center space-x-3 w-1/3">
                                <div className="w-8 h-8 rounded-full bg-slate-800 text-white text-xs flex items-center justify-center font-bold">
                                    {tech.initials}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{tech.name}</p>
                                    <p className="text-[10px] text-slate-500 uppercase">{tech.role}</p>
                                </div>
                             </div>

                             {/* Time Bar */}
                             <div className="flex-1 mx-4 h-8 bg-slate-200 rounded-md overflow-hidden relative flex">
                                {isPresent ? (
                                    <div className="w-full h-full bg-slate-200 flex items-center justify-center text-xs text-slate-400 font-medium">Disponibile</div>
                                ) : (
                                    <>
                                        {/* Morning Slot */}
                                        <div className={`
                                            flex-1 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all
                                            ${(req.slot === 'full' || req.slot === 'morning') ? getTypeColor(req.type, 'solid') : 'bg-slate-200 text-slate-400'}
                                        `}>
                                            {(req.slot === 'full' || req.slot === 'morning') ? 'Mattina' : ''}
                                        </div>
                                        {/* Divider */}
                                        <div className="w-[1px] h-full bg-white/20 z-10"></div>
                                        {/* Afternoon Slot */}
                                        <div className={`
                                            flex-1 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all
                                            ${(req.slot === 'full' || req.slot === 'afternoon') ? getTypeColor(req.type, 'solid') : 'bg-slate-200 text-slate-400'}
                                        `}>
                                            {(req.slot === 'full' || req.slot === 'afternoon') ? 'Pomeriggio' : ''}
                                        </div>
                                        
                                        {/* Overlay for specific types */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                             {req.slot === 'hours' && (
                                                 <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${getTypeColor(req.type, 'bg')} ${getTypeColor(req.type, 'text')} border ${getTypeColor(req.type, 'border')}`}>
                                                     {req.hours}h {getTypeLabel(req.type)}
                                                 </div>
                                             )}
                                        </div>
                                    </>
                                )}
                             </div>

                             <div className="w-20 text-right">
                                 {req ? (
                                     <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${getTypeColor(req.type, 'bg')} ${getTypeColor(req.type, 'text')}`}>
                                         {getTypeLabel(req.type)}
                                     </span>
                                 ) : (
                                     <span className="text-[10px] font-bold text-slate-400 px-2 py-1">PRESENTE</span>
                                 )}
                             </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
        <h2 className="text-lg md:text-xl font-bold text-slate-800 capitalize flex items-center">
            {viewMode === 'month' ? (
                <>
                    {monthNames[currentMonth]} <span className="text-slate-400 font-normal ml-2">{currentYear}</span>
                </>
            ) : (
                'Vista Giornaliera'
            )}
        </h2>
        
        <div className="flex items-center space-x-4">
             {/* View Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={() => setViewMode('month')}
                    className={`flex items-center px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'month' ? 'bg-white text-[#17494D] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Grid className="w-4 h-4 mr-1.5" />
                    Mese
                </button>
                <button 
                    onClick={() => setViewMode('day')}
                    className={`flex items-center px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'day' ? 'bg-white text-[#17494D] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <List className="w-4 h-4 mr-1.5" />
                    Giorno
                </button>
            </div>

            {/* Nav Arrows */}
            {viewMode === 'month' && (
                <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => onChangeMonth(-1)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600"><ChevronLeft className="w-5 h-5" /></button>
                    <button onClick={() => onChangeMonth(1)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600"><ChevronRight className="w-5 h-5" /></button>
                </div>
            )}
        </div>
      </div>
      
      {/* View Content */}
      {viewMode === 'day' ? renderDailyView() : (
        <>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 mb-2">
                {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map(d => (
                <div key={d} className="text-center text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider py-2 truncate">
                    {d}
                </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1 md:gap-2 flex-1 auto-rows-fr overflow-y-auto">
                {blanks.map(b => <div key={`blank-${b}`} className="p-1" />)}
                {days.map(day => {
                const events = getEventsForDay(day);
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth;

                return (
                    <div 
                    key={day} 
                    className={`
                        min-h-[60px] md:min-h-[100px] border border-slate-100 rounded-lg p-1 md:p-2 transition-all cursor-pointer relative group
                        ${isToday ? 'bg-blue-50/50 ring-1 ring-blue-200' : 'bg-white hover:border-slate-300 hover:shadow-sm'}
                        ${selectedDay === day ? 'ring-2 ring-[#17494D]/30' : ''}
                    `}
                    onClick={() => {
                         setSelectedDay(day);
                         onDateClick(dateStr); 
                    }}
                    onDoubleClick={() => {
                        setSelectedDay(day);
                        setViewMode('day'); // Double click to zoom into day
                    }}
                    >
                    <div className="flex justify-between items-start mb-1 md:mb-2">
                        <span className={`text-xs md:text-sm font-semibold w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700'}`}>
                            {day}
                        </span>
                    </div>
                    
                    <div className="space-y-1 overflow-hidden">
                        {events.map((ev: LeaveRequest) => {
                        const tech = technicians.find((t:any) => t.id === ev.techId);
                        const bgClass = getTypeColor(ev.type, 'bg');
                        const textClass = getTypeColor(ev.type, 'text');
                        const borderClass = getTypeColor(ev.type, 'border');
                        
                        return (
                            <div 
                            key={ev.id} 
                            className={`
                                text-[9px] md:text-[10px] px-1 md:px-2 py-0.5 rounded-md border truncate font-medium transition-transform hover:scale-105
                                ${bgClass} ${textClass} ${borderClass}
                            `}
                            onMouseEnter={(e) => onHoverInfo(e, ev, tech)}
                            onMouseLeave={() => onHoverInfo(null)}
                            onClick={(e) => { e.stopPropagation(); onDateClick(dateStr); }} 
                            >
                            <span className="font-bold mr-1 hidden md:inline">{tech?.initials}</span>
                            <span className="md:hidden w-2 h-2 rounded-full bg-current inline-block mr-1"></span>
                            <span className="hidden md:inline">{ev.slot === 'morning' ? '(Mat)' : ev.slot === 'afternoon' ? '(Pom)' : ''}</span>
                            </div>
                        );
                        })}
                    </div>
                    </div>
                );
                })}
            </div>
        </>
      )}
    </div>
  );
};

const TimelineView = ({ requests, technicians, currentMonth, currentYear, onHoverInfo, onDateClick }: any) => {
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 overflow-hidden flex flex-col h-full">
      <h3 className="text-xl font-bold mb-6 text-slate-800">Timeline Disponibilità</h3>
      <div className="flex-1 overflow-auto timeline-scroll relative border border-slate-200 rounded-lg">
        <div className="min-w-max">
          {/* Header Row */}
          <div className="flex border-b border-slate-200 sticky top-0 bg-slate-50 z-20 shadow-sm">
            <div className="w-40 md:w-48 p-3 font-bold text-slate-500 text-xs uppercase tracking-wider border-r border-slate-200 sticky left-0 bg-slate-50 z-30">
                Tecnico
            </div>
            {days.map(d => (
              <div key={d} className="w-8 md:w-10 flex-shrink-0 text-center text-xs font-semibold text-slate-500 py-3 border-r border-slate-100">
                {d}
              </div>
            ))}
          </div>

          {/* Rows */}
          {technicians.map((tech: Technician) => (
            <div key={tech.id} className="flex border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
              <div className="w-40 md:w-48 p-3 border-r border-slate-200 flex items-center space-x-3 sticky left-0 bg-white z-10 group">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white text-xs flex items-center justify-center font-bold">
                  {tech.initials}
                </div>
                <div className="min-w-0">
                    <span className="text-sm font-semibold text-slate-700 block truncate">{tech.name}</span>
                    <span className="text-[10px] text-slate-400 uppercase truncate block">{tech.role}</span>
                </div>
              </div>
              {days.map(d => {
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const leave = requests.find((r: LeaveRequest) => 
                  r.techId === tech.id && isDateInRange(dateStr, r.startDate, r.endDate)
                );
                
                let cellContent = null;
                if (leave) {
                   const isStart = leave.startDate === dateStr;
                   const isEnd = leave.endDate === dateStr;
                   const roundedClass = `${isStart ? 'rounded-l-md' : ''} ${isEnd ? 'rounded-r-md' : ''}`;
                   
                   // Use Solid colors for Timeline for better visibility
                   const solidBg = getTypeColor(leave.type, 'solid');
                   
                   let letter = '';
                   switch(leave.type) {
                     case 'ferie': letter='F'; break;
                     case 'permesso': letter='P'; break;
                     case 'malattia': letter='M'; break;
                     case 'cantiere': letter='C'; break;
                   }

                   cellContent = (
                     <div 
                      className={`h-7 mx-0.5 my-auto ${roundedClass} text-[10px] font-bold flex items-center justify-center text-white cursor-help ${solidBg} shadow-sm hover:opacity-90 transition-all`}
                      onMouseEnter={(e) => onHoverInfo(e, leave, tech)}
                      onMouseLeave={() => onHoverInfo(null)}
                     >
                       {isStart && letter}
                     </div>
                   );
                }

                return (
                  <div 
                    key={d} 
                    className="w-8 md:w-10 flex-shrink-0 border-r border-slate-100 relative bg-transparent cursor-pointer hover:bg-slate-100/50 flex flex-col justify-center"
                    onClick={() => onDateClick(dateStr, tech.id)}
                  >
                    {cellContent}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const RequestForm = ({ technicians, onSubmit, onCancel, initialValues }: any) => {
  const [formData, setFormData] = useState<Partial<LeaveRequest>>({
    techId: technicians[0].id,
    type: 'ferie',
    slot: 'full',
    startDate: formatDate(new Date()),
    endDate: formatDate(new Date()),
    hours: 1,
    description: '',
    ...initialValues // Override with initial values if provided
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.techId && formData.startDate) {
      onSubmit({
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
        endDate: formData.endDate || formData.startDate
      });
    }
  };

  const SelectionCard = ({ type, icon: Icon, label, sub, colorClass, borderClass }: any) => (
    <button 
      type="button"
      className={`
        p-4 border rounded-xl flex flex-col items-center justify-center transition-all h-24 md:h-28
        ${formData.type === type 
            ? `${borderClass} bg-white ring-2 ring-offset-1 ring-slate-200 shadow-md` 
            : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-white hover:border-slate-300'
        }
      `}
      onClick={() => setFormData({...formData, type: type, slot: type === 'permesso' ? 'hours' : 'full'})}
    >
      <Icon className={`w-6 h-6 md:w-8 md:h-8 mb-2 ${formData.type === type ? colorClass : 'text-slate-400'}`} />
      <span className={`font-bold text-xs md:text-sm ${formData.type === type ? 'text-slate-800' : 'text-slate-500'}`}>{label}</span>
      {sub && <span className="text-[10px] text-slate-400 hidden md:block">{sub}</span>}
    </button>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 max-w-2xl mx-auto p-4 md:p-8 mt-6">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
        <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">Nuova Pianificazione</h2>
            <p className="text-slate-500 text-sm mt-1">Inserisci i dettagli per la nuova attività o assenza.</p>
        </div>
        <button onClick={onCancel} className="text-slate-500 hover:text-slate-800 text-sm font-medium px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors">Annulla</button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
        {/* Tecnico */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-700">Seleziona Tecnico</label>
          <div className="relative">
            <select 
              className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 px-4 border bg-white"
              value={formData.techId}
              onChange={e => setFormData({...formData, techId: e.target.value})}
            >
              {technicians.map((t: Technician) => (
                <option key={t.id} value={t.id}>{t.name} — {t.role}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tipo Grid */}
        <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">Tipologia Attività</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SelectionCard 
                type="ferie" 
                icon={Sun} 
                label="Ferie" 
                sub="Assenza" 
                colorClass="text-rose-600" 
                borderClass="border-rose-500" 
            />
            <SelectionCard 
                type="permesso" 
                icon={Clock} 
                label="Permesso" 
                sub="Ore/ROL" 
                colorClass="text-amber-500" 
                borderClass="border-amber-500" 
            />
            <SelectionCard 
                type="malattia" 
                icon={Thermometer} 
                label="Malattia" 
                sub="Medico" 
                colorClass="text-indigo-600" 
                borderClass="border-indigo-500" 
            />
            <SelectionCard 
                type="cantiere" 
                icon={Hammer} 
                label="Cantiere" 
                sub="Lavoro" 
                colorClass="text-emerald-600" 
                borderClass="border-emerald-500" 
            />
            </div>
        </div>

        {/* Date Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-2">
             <label className="block text-sm font-bold text-slate-700">Data Inizio</label>
             <input 
               type="date" 
               className="block w-full rounded-lg border-slate-300 shadow-sm border p-3 focus:ring-2 focus:ring-[#17494D]/20 focus:border-[#17494D]"
               value={formData.startDate}
               onChange={e => setFormData({...formData, startDate: e.target.value, endDate: e.target.value > (formData.endDate || '') ? e.target.value : formData.endDate})}
             />
           </div>
           <div className="space-y-2">
             <label className="block text-sm font-bold text-slate-700">Data Fine</label>
             <input 
               type="date" 
               className="block w-full rounded-lg border-slate-300 shadow-sm border p-3 focus:ring-2 focus:ring-[#17494D]/20 focus:border-[#17494D]"
               value={formData.endDate}
               min={formData.startDate}
               onChange={e => setFormData({...formData, endDate: e.target.value})}
             />
           </div>
        </div>

        {/* Slot Specifics */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
           <label className="block text-sm font-bold text-slate-700 mb-4">Dettagli Temporali</label>
           
           <div className="flex flex-wrap gap-4 mb-6">
             {['full', 'morning', 'afternoon'].map(opt => (
               <label key={opt} className={`
                    flex items-center px-4 py-2 rounded-lg border cursor-pointer transition-all
                    ${formData.slot === opt 
                        ? 'bg-white border-slate-400 ring-1 ring-slate-400 text-slate-800 shadow-sm' 
                        : 'bg-transparent border-slate-200 text-slate-500 hover:bg-white'}
               `}>
                 <input 
                    type="radio" 
                    name="slot" 
                    value={opt} 
                    checked={formData.slot === opt}
                    onChange={() => setFormData({...formData, slot: opt as TimeSlot, hours: undefined})}
                    className="hidden"
                 />
                 <span className="capitalize font-medium text-sm">{getSlotLabel(opt as TimeSlot)}</span>
               </label>
             ))}
             {formData.type === 'permesso' && (
               <label className={`
                    flex items-center px-4 py-2 rounded-lg border cursor-pointer transition-all
                    ${formData.slot === 'hours' 
                        ? 'bg-white border-slate-400 ring-1 ring-slate-400 text-slate-800 shadow-sm' 
                        : 'bg-transparent border-slate-200 text-slate-500 hover:bg-white'}
               `}>
                 <input 
                    type="radio" 
                    name="slot" 
                    value="hours" 
                    checked={formData.slot === 'hours'}
                    onChange={() => setFormData({...formData, slot: 'hours'})}
                    className="hidden"
                 />
                 <span className="font-medium text-sm">A Ore</span>
               </label>
             )}
           </div>

           {formData.slot === 'hours' && (
             <div className="mb-6 animate-fade-in">
               <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Quantità Ore</label>
               <input 
                 type="number" 
                 min="1" 
                 max="8" 
                 value={formData.hours || 1} 
                 onChange={e => setFormData({...formData, hours: parseInt(e.target.value)})}
                 className="w-24 border border-slate-300 rounded-lg p-2 text-center font-bold text-slate-700"
               />
             </div>
           )}

           <div>
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Note / Descrizione</label>
             <input 
               type="text" 
               value={formData.description || ''}
               onChange={e => setFormData({...formData, description: e.target.value})}
               className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#17494D]/20 focus:border-[#17494D]"
               placeholder="Es. Installazione presso Cliente..."
             />
           </div>
        </div>

        <button type="submit" className="w-full bg-[#17494D] text-white py-4 rounded-xl hover:bg-[#133a3e] transition-colors font-bold text-lg shadow-lg shadow-[#17494D]/20">
          Conferma Inserimento
        </button>
      </form>
    </div>
  );
};

// --- App Container ---

const App = () => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [view, setView] = useState('dashboard');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); 
  
  const [tooltipData, setTooltipData] = useState<TooltipData>({ visible: false, x: 0, y: 0 });
  const [formInitialValues, setFormInitialValues] = useState<Partial<LeaveRequest> | null>(null);

  // --- Fetch Initial Data from Backend ---
  useEffect(() => {
    const initData = async () => {
        setIsLoading(true);
        try {
            const [techs, reqs] = await Promise.all([
                db.technicians.list(),
                db.requests.list()
            ]);
            setTechnicians(techs);
            setRequests(reqs);
        } catch (error) {
            console.error("Failed to load data from backend", error);
        } finally {
            setIsLoading(false);
        }
    };
    initData();
  }, []);

  const handleMonthChange = (delta: number) => {
    let nextMonth = currentMonth + delta;
    let nextYear = currentYear;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear++;
    } else if (nextMonth < 0) {
      nextMonth = 11;
      nextYear--;
    }
    setCurrentMonth(nextMonth);
    setCurrentYear(nextYear);
  };

  const handleAddRequest = async (req: LeaveRequest) => {
    try {
        const savedReq = await db.requests.add(req);
        setRequests(prev => [...prev, savedReq]);
        setFormInitialValues(null);
        setView('dashboard');
    } catch (e) {
        alert("Errore salvataggio richiesta");
    }
  };

  const handleAddTechnician = async (tech: Technician) => {
    try {
        const savedTech = await db.technicians.add(tech);
        setTechnicians(prev => [...prev, savedTech]);
    } catch (e) {
        alert("Errore salvataggio tecnico");
    }
  };

  const handleRemoveTechnician = async (id: string) => {
    if (confirm('Sei sicuro di voler rimuovere questo tecnico?')) {
        try {
            await db.technicians.remove(id);
            setTechnicians(prev => prev.filter(t => t.id !== id));
        } catch (e) {
            alert("Errore rimozione tecnico");
        }
    }
  };

  const handleDateClick = (dateStr: string, techId?: string) => {
    setFormInitialValues({
      startDate: dateStr,
      endDate: dateStr,
      techId: techId || (technicians.length > 0 ? technicians[0].id : ''),
    });
    setView('form');
  };

  const handleHoverInfo = (e: React.MouseEvent, req: LeaveRequest, tech: Technician) => {
    if (!req) {
      setTooltipData({ ...tooltipData, visible: false });
      return;
    }
    
    // Format date string for tooltip
    let dateStr = new Date(req.startDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
    if (req.endDate && req.endDate !== req.startDate) {
      dateStr += ` → ${new Date(req.endDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}`;
    }

    setTooltipData({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      techName: tech?.name || 'Sconosciuto',
      techRole: tech?.role || '',
      type: req.type,
      slot: req.slot,
      dateRange: dateStr,
      hours: req.hours,
      description: req.description
    });
  };

  if (isLoading) {
      return (
          <div className="h-screen flex items-center justify-center bg-slate-50 flex-col space-y-4">
              <Loader2 className="w-10 h-10 text-[#17494D] animate-spin" />
              <p className="text-slate-500 font-medium">Caricamento Portale...</p>
          </div>
      );
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden font-sans text-slate-600">
      <GlobalTooltip data={tooltipData} />
      
      {/* Fake Zendesk Navbar Strip */}
      <div className="bg-[#17494D] h-14 flex-shrink-0 flex items-center px-4 md:px-6 justify-between shadow-md z-30">
        <div className="flex items-center space-x-4">
           <div className="text-white font-extrabold text-lg md:text-xl tracking-tight">Zendesk</div>
           <div className="bg-white/10 text-white/90 text-xs px-3 py-1 rounded-full backdrop-blur-sm hidden sm:block border border-white/10">
              Portale Risorse
           </div>
        </div>
        <div className="text-white/80 text-xs md:text-sm font-medium">ITS Pescara Helpdesk</div>
      </div>

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Now overlay on mobile if needed, or sidebar */}
        <Sidebar 
          current={view} 
          setView={(v:string) => { setView(v); if(window.innerWidth < 768) setIsSidebarCollapsed(true); }} // Auto close on mobile nav
          isCollapsed={isSidebarCollapsed} 
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-auto p-2 md:p-8 w-full relative">
          
          <div className="max-w-7xl mx-auto min-h-[600px] pb-10">
            {view === 'dashboard' && <DashboardView requests={requests} technicians={technicians} />}
            {view === 'calendar' && (
              <CalendarView 
                requests={requests} 
                technicians={technicians} 
                currentMonth={currentMonth} 
                currentYear={currentYear}
                onChangeMonth={handleMonthChange}
                onHoverInfo={handleHoverInfo}
                onDateClick={handleDateClick}
              />
            )}
            {view === 'timeline' && (
              <TimelineView 
                requests={requests} 
                technicians={technicians}
                currentMonth={currentMonth} 
                currentYear={currentYear}
                onHoverInfo={handleHoverInfo}
                onDateClick={handleDateClick}
              />
            )}
            {view === 'team' && (
                <TechManagerView 
                    technicians={technicians}
                    onAdd={handleAddTechnician}
                    onRemove={handleRemoveTechnician}
                />
            )}
            {view === 'form' && (
              <RequestForm 
                technicians={technicians} 
                onSubmit={handleAddRequest} 
                onCancel={() => { setView('dashboard'); setFormInitialValues(null); }} 
                initialValues={formInitialValues}
              />
            )}
             {view === 'info' && <InfoView />}
          </div>
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);