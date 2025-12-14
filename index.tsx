import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Calendar, 
  Clock, 
  Users, 
  PlusCircle, 
  BarChart3, 
  ChevronLeft, 
  ChevronRight,
  Sun,
  Moon,
  LayoutGrid,
  AlignLeft,
  Thermometer,
  Hammer,
  Info,
  Mail,
  Phone,
  FileText,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// --- Types ---

type AbsenceType = 'ferie' | 'permesso' | 'malattia' | 'cantiere';
type TimeSlot = 'full' | 'morning' | 'afternoon' | 'hours';

interface Technician {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
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

// --- Mock Data ---

const TECHNICIANS: Technician[] = [
  { id: '1', name: 'Marco Rossi', role: 'Senior Tech', avatarColor: 'bg-blue-500' },
  { id: '2', name: 'Giulia Bianchi', role: 'Field Specialist', avatarColor: 'bg-green-500' },
  { id: '3', name: 'Luca Verdi', role: 'Helpdesk', avatarColor: 'bg-purple-500' },
  { id: '4', name: 'Elena Neri', role: 'Support Lead', avatarColor: 'bg-orange-500' },
  { id: '5', name: 'Roberto Gallo', role: 'Junior Tech', avatarColor: 'bg-indigo-500' },
];

const INITIAL_REQUESTS: LeaveRequest[] = [
  { id: '101', techId: '1', startDate: '2023-10-05', endDate: '2023-10-06', type: 'ferie', slot: 'full', description: 'Weekend lungo' },
  { id: '102', techId: '2', startDate: '2023-10-10', endDate: '2023-10-10', type: 'permesso', slot: 'morning', description: 'Visita medica' },
  { id: '103', techId: '3', startDate: '2023-10-15', endDate: '2023-10-20', type: 'ferie', slot: 'full' },
  { id: '104', techId: '4', startDate: '2023-10-05', endDate: '2023-10-05', type: 'permesso', slot: 'hours', hours: 2, description: 'Uscita anticipata' },
  { id: '105', techId: '5', startDate: '2023-10-08', endDate: '2023-10-09', type: 'malattia', slot: 'full' },
  { id: '106', techId: '2', startDate: '2023-10-12', endDate: '2023-10-14', type: 'cantiere', slot: 'full', description: 'Installazione Cliente X' },
];

// --- Helper Functions ---

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); // 0 = Sun

const formatDate = (date: Date) => date.toISOString().split('T')[0];

const isDateInRange = (checkDate: string, start: string, end: string) => {
  return checkDate >= start && checkDate <= end;
};

const getTypeColor = (type: AbsenceType, shade: 'bg' | 'text' | 'border' | 'fill' = 'bg') => {
  switch (type) {
    case 'ferie':
      if (shade === 'bg') return 'bg-red-100';
      if (shade === 'text') return 'text-red-700';
      if (shade === 'border') return 'border-red-500';
      if (shade === 'fill') return '#ef4444';
      return 'red';
    case 'permesso':
      if (shade === 'bg') return 'bg-yellow-100';
      if (shade === 'text') return 'text-yellow-700';
      if (shade === 'border') return 'border-yellow-500';
      if (shade === 'fill') return '#eab308';
      return 'yellow';
    case 'malattia':
      if (shade === 'bg') return 'bg-purple-100';
      if (shade === 'text') return 'text-purple-700';
      if (shade === 'border') return 'border-purple-500';
      if (shade === 'fill') return '#a855f7';
      return 'purple';
    case 'cantiere':
      if (shade === 'bg') return 'bg-cyan-100';
      if (shade === 'text') return 'text-cyan-700';
      if (shade === 'border') return 'border-cyan-500';
      if (shade === 'fill') return '#06b6d4';
      return 'cyan';
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

// --- Components ---

const GlobalTooltip = ({ data }: { data: TooltipData }) => {
  if (!data.visible) return null;

  const bgClass = data.type ? getTypeColor(data.type, 'bg') : 'bg-gray-800';
  const borderClass = data.type ? getTypeColor(data.type, 'border') : 'border-gray-700';

  return (
    <div 
      className="fixed z-50 pointer-events-none transition-opacity duration-200"
      style={{ 
        left: data.x + 15, 
        top: data.y + 15,
        maxWidth: '280px'
      }}
    >
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden text-sm">
        <div className={`px-3 py-2 border-b font-semibold flex items-center justify-between ${bgClass} ${borderClass} bg-opacity-30`}>
          <span className="capitalize">{getTypeLabel(data.type || 'ferie')}</span>
          {data.hours && <span className="text-xs bg-white/50 px-1.5 py-0.5 rounded ml-2">{data.hours}h</span>}
        </div>
        <div className="p-3 bg-white space-y-2">
          <div>
            <p className="font-bold text-gray-800">{data.techName}</p>
            <p className="text-xs text-gray-500">{data.techRole}</p>
          </div>
          <div className="text-xs text-gray-600 flex items-center">
            <Calendar className="w-3 h-3 mr-1.5" />
            {data.dateRange}
          </div>
          {data.slot !== 'full' && (
             <div className="text-xs text-gray-600 flex items-center">
               <Clock className="w-3 h-3 mr-1.5" />
               <span className="capitalize">{data.slot === 'morning' ? 'Mattina' : 'Pomeriggio'}</span>
             </div>
          )}
          {data.description && (
            <div className="pt-2 mt-2 border-t border-gray-100 text-xs text-gray-600 italic flex items-start">
               <FileText className="w-3 h-3 mr-1.5 mt-0.5 flex-shrink-0" />
               {data.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon: Icon, subtext, color }: any) => (
  <div className="zendesk-card p-4 flex items-center space-x-4 border-l-4" style={{ borderLeftColor: color }}>
    <div className={`p-3 rounded-full ${color.replace('border-', 'bg-').replace('500', '100')}`}>
      <Icon className={`w-6 h-6 ${color.replace('border-', 'text-')}`} />
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
    </div>
  </div>
);

const Sidebar = ({ current, setView, isCollapsed, toggleCollapse }: any) => {
  const views = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'timeline', label: 'Timeline', icon: AlignLeft },
    { id: 'info', label: 'Info', icon: Info },
  ];

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} h-full shadow-sm relative z-20`}>
      <div className="p-4 flex items-center justify-between h-14 border-b border-gray-100">
        {!isCollapsed && <span className="font-bold text-gray-700 truncate">Menu</span>}
        <button 
          onClick={toggleCollapse} 
          className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors mx-auto md:mx-0"
        >
          {isCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {views.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`w-full flex items-center p-2 rounded-md transition-all group relative ${
              current === v.id 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className={`flex items-center justify-center ${isCollapsed ? 'w-full' : 'w-8'}`}>
               <v.icon className={`w-5 h-5 ${current === v.id ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
            </div>
            
            {!isCollapsed && (
              <span className="ml-3 text-sm font-medium truncate">{v.label}</span>
            )}
            
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                {v.label}
              </div>
            )}
          </button>
        ))}
      </nav>

      {!isCollapsed && (
        <div className="p-4 border-t border-gray-100">
          <div className="text-xs text-gray-400 text-center">
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
    <div className="zendesk-card p-8 max-w-2xl mx-auto mt-6 text-center animate-fade-in">
       <div className="w-16 h-16 bg-[#17494D]/10 rounded-full flex items-center justify-center mx-auto mb-6">
         <Info className="w-8 h-8 text-[#17494D]" />
       </div>
       <h2 className="text-2xl font-bold text-gray-800 mb-2">Informazioni App</h2>
       <p className="text-gray-500 mb-8">Dashboard per la gestione integrata delle risorse tecniche, ferie e permessi.</p>
       
       <div className="bg-gray-50 rounded-lg p-6 border border-gray-100 text-left">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Contatti Sviluppo</h3>
          
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-2 bg-white border rounded-full">
              <Mail className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <a href="mailto:matteo.vizzani@rematarlazzi.it" className="text-blue-600 font-medium hover:underline">
                matteo.vizzani@rematarlazzi.it
              </a>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
             <div className="p-2 bg-white border rounded-full">
               <Users className="w-5 h-5 text-gray-600" />
             </div>
             <div>
               <p className="text-xs text-gray-400">Team</p>
               <p className="text-gray-700 font-medium">ITS Pescara Helpdesk</p>
             </div>
          </div>
       </div>

       <div className="mt-8 text-xs text-gray-400">
         Versione 1.0.3 • Integrazione Zendesk
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
      { name: 'Cantiere (Interventi)', value: cantiereCount, fill: getTypeColor('cantiere', 'fill') },
    ];
  }, [requests]);

  const upcomingLeaves = requests
    .filter(r => r.startDate > today) // Only future
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in p-2">
      <div className="mb-4">
         <h1 className="text-2xl font-bold text-gray-900">Dashboard Operativa</h1>
         <p className="text-gray-500">Panoramica risorse per il {new Date().toLocaleDateString('it-IT')}</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard 
          title="Non Operativi Oggi" 
          value={absentTodayCount} 
          icon={Sun} 
          color="border-red-500" 
          subtext={`Su ${technicians.length} tecnici totali`}
        />
        <KPICard 
          title="Disponibili" 
          value={activeTechsCount} 
          icon={Users} 
          color="border-green-500" 
          subtext="Disponibilità immediata"
        />
        <KPICard 
          title="Attività Mese" 
          value={requests.length} 
          icon={Calendar} 
          color="border-blue-500" 
          subtext="Totale inserimenti"
        />
      </div>

      {/* NOT OPERATIONAL TODAY SECTION */}
      <div className="zendesk-card p-6 border-l-4 border-l-orange-400">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-bold text-gray-800 flex items-center">
               <Thermometer className="w-5 h-5 mr-2 text-orange-500" />
               Tecnici Non Operativi Oggi
             </h3>
             <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
               {activeAbsences.length} Assenti/Impegnati
             </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeAbsences.length === 0 ? (
              <div className="col-span-full py-8 text-center text-gray-500 bg-gray-50 rounded border border-dashed border-gray-200">
                <Users className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <p>Nessun tecnico assente oggi. Tutti operativi!</p>
              </div>
            ) : (
              activeAbsences.map(req => {
                const tech = technicians.find(t => t.id === req.techId);
                const bgClass = getTypeColor(req.type, 'bg');
                const textClass = getTypeColor(req.type, 'text');
                const borderClass = getTypeColor(req.type, 'border');

                return (
                  <div key={req.id} className="flex items-start p-3 bg-white rounded-lg border border-gray-200 shadow-sm relative overflow-hidden">
                    <div className={`absolute top-0 left-0 bottom-0 w-1 ${bgClass.replace('bg-', 'bg-')}`}></div>
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold ${tech?.avatarColor} mr-3`}>
                      {tech?.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{tech?.name}</p>
                      <p className="text-xs text-gray-500 mb-1">{tech?.role}</p>
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border ${bgClass} ${textClass} border-opacity-20`}>
                          {getTypeLabel(req.type)}
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center">
                           <Clock className="w-3 h-3 mr-1" />
                           {req.slot === 'full' ? 'Tutto il dì' : req.slot}
                        </span>
                      </div>
                      {req.description && (
                         <p className="text-[11px] text-gray-500 mt-1 italic truncate">"{req.description}"</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="zendesk-card p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Statistiche Cantieri</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                 <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming List */}
        <div className="zendesk-card p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Prossime Pianificazioni</h3>
          <div className="space-y-3">
            {upcomingLeaves.length === 0 ? (
              <p className="text-gray-400 text-sm">Nessuna attività futura programmata.</p>
            ) : (
              upcomingLeaves.map(req => {
                const tech = technicians.find(t => t.id === req.techId);
                const bgClass = getTypeColor(req.type, 'bg');
                const textClass = getTypeColor(req.type, 'text');

                return (
                  <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100 hover:bg-white transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${tech?.avatarColor}`}>
                        {tech?.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{tech?.name}</p>
                        <p className="text-xs text-gray-500">
                          {getTypeLabel(req.type)} • dal {req.startDate}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${bgClass} ${textClass}`}>
                      {req.slot === 'full' ? 'GG' : req.slot}
                    </span>
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
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return requests.filter((r: LeaveRequest) => isDateInRange(dateStr, r.startDate, r.endDate));
  };

  const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

  return (
    <div className="zendesk-card p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg md:text-xl font-bold text-gray-800">{monthNames[currentMonth]} {currentYear}</h2>
        <div className="flex space-x-2">
          <button onClick={() => onChangeMonth(-1)} className="p-2 hover:bg-gray-100 rounded"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={() => onChangeMonth(1)} className="p-2 hover:bg-gray-100 rounded"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden flex-1">
        {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map(d => (
          <div key={d} className="bg-gray-50 p-1 md:p-2 text-center text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
            {d}
          </div>
        ))}
        {blanks.map(b => <div key={`blank-${b}`} className="bg-white min-h-[60px] md:min-h-[100px]" />)}
        {days.map(day => {
          const events = getEventsForDay(day);
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          
          return (
            <div 
              key={day} 
              className="bg-white p-1 min-h-[60px] md:min-h-[100px] border-t border-gray-50 relative group hover:bg-blue-50/10 transition-colors cursor-pointer"
              onClick={() => onDateClick(dateStr)}
            >
              <span className={`text-xs md:text-sm font-medium p-1 rounded-full ${new Date().getDate() === day && new Date().getMonth() === currentMonth ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                {day}
              </span>
              <div className="mt-1 space-y-1">
                {events.map((ev: LeaveRequest) => {
                  const tech = technicians.find((t:any) => t.id === ev.techId);
                  const bgClass = getTypeColor(ev.type, 'bg');
                  const textClass = getTypeColor(ev.type, 'text');
                  
                  return (
                    <div 
                      key={ev.id} 
                      className={`text-[9px] md:text-[10px] px-1 py-0.5 rounded truncate ${bgClass} ${textClass} cursor-pointer hover:brightness-95`}
                      onMouseEnter={(e) => onHoverInfo(e, ev, tech)}
                      onMouseLeave={() => onHoverInfo(null)}
                      onClick={(e) => { e.stopPropagation(); onDateClick(dateStr); }} // Clicking an event also opens form for that day
                    >
                      {tech?.name.split(' ')[0]} {ev.slot === 'morning' ? '(M)' : ev.slot === 'afternoon' ? '(P)' : ''}
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

const TimelineView = ({ requests, technicians, currentMonth, currentYear, onHoverInfo, onDateClick }: any) => {
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="zendesk-card p-4 overflow-hidden flex flex-col h-full">
      <h3 className="text-lg font-bold mb-4">Timeline Disponibilità</h3>
      <div className="flex-1 overflow-auto timeline-scroll relative border rounded">
        <div className="min-w-max">
          {/* Header Row */}
          <div className="flex border-b sticky top-0 bg-gray-50 z-10">
            <div className="w-32 md:w-48 p-3 font-semibold text-gray-600 border-r bg-gray-50 sticky left-0 z-20 shadow-sm">Tecnico</div>
            {days.map(d => (
              <div key={d} className="w-8 md:w-10 flex-shrink-0 text-center text-xs text-gray-500 py-3 border-r">
                {d}
              </div>
            ))}
          </div>

          {/* Rows */}
          {technicians.map((tech: Technician) => (
            <div key={tech.id} className="flex border-b hover:bg-gray-50">
              <div className="w-32 md:w-48 p-3 border-r flex items-center space-x-2 sticky left-0 bg-white z-10">
                <div className={`w-6 h-6 rounded-full ${tech.avatarColor} text-white text-xs flex items-center justify-center`}>
                  {tech.name.charAt(0)}
                </div>
                <span className="text-xs md:text-sm font-medium text-gray-700 truncate">{tech.name}</span>
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
                   let bgClass = '';
                   let letter = '';
                   
                   switch(leave.type) {
                     case 'ferie': bgClass = 'bg-red-400'; letter='F'; break;
                     case 'permesso': bgClass = 'bg-yellow-400'; letter='P'; break;
                     case 'malattia': bgClass = 'bg-purple-400'; letter='M'; break;
                     case 'cantiere': bgClass = 'bg-cyan-500'; letter='C'; break;
                   }

                   cellContent = (
                     <div 
                      className={`h-6 mx-0.5 mt-2 ${roundedClass} text-[9px] flex items-center justify-center text-white cursor-help ${bgClass} hover:brightness-110 transition-all`}
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
                    className="w-8 md:w-10 flex-shrink-0 border-r relative bg-white cursor-pointer hover:bg-blue-50/20"
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
    // Validate logic
    if (formData.techId && formData.startDate) {
      onSubmit({
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
        // Ensure endDate is set same as start if not provided
        endDate: formData.endDate || formData.startDate
      });
    }
  };

  const SelectionCard = ({ type, icon: Icon, label, sub, colorClass, borderClass }: any) => (
    <button 
      type="button"
      className={`p-4 border rounded-lg flex flex-col items-center transition-all ${formData.type === type ? `${borderClass} ${colorClass.replace('text', 'bg').replace('500', '50').replace('700', '50')}` : 'border-gray-200 hover:bg-gray-50'}`}
      onClick={() => setFormData({...formData, type: type, slot: type === 'permesso' ? 'hours' : 'full'})}
    >
      <Icon className={`w-6 h-6 mb-2 ${formData.type === type ? colorClass : 'text-gray-400'}`} />
      <span className="font-medium text-sm">{label}</span>
      {sub && <span className="text-[10px] text-gray-500">{sub}</span>}
    </button>
  );

  return (
    <div className="zendesk-card max-w-2xl mx-auto p-4 md:p-8 mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">Nuova Richiesta / Attività</h2>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 text-sm md:text-base">Chiudi</button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tecnico */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tecnico</label>
          <div className="relative">
            <select 
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              value={formData.techId}
              onChange={e => setFormData({...formData, techId: e.target.value})}
            >
              {technicians.map((t: Technician) => (
                <option key={t.id} value={t.id}>{t.name} ({t.role})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tipo Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectionCard 
            type="ferie" 
            icon={Sun} 
            label="Ferie" 
            sub="Assenza retribuita" 
            colorClass="text-red-500" 
            borderClass="border-red-500" 
          />
          <SelectionCard 
            type="permesso" 
            icon={Clock} 
            label="Permesso" 
            sub="Ore o ROL" 
            colorClass="text-yellow-500" 
            borderClass="border-yellow-500" 
          />
          <SelectionCard 
            type="malattia" 
            icon={Thermometer} 
            label="Malattia" 
            sub="Certificato medico" 
            colorClass="text-purple-500" 
            borderClass="border-purple-500" 
          />
          <SelectionCard 
            type="cantiere" 
            icon={Hammer} 
            label="Cantiere" 
            sub="Lavoro esterno" 
            colorClass="text-cyan-500" 
            borderClass="border-cyan-500" 
          />
        </div>

        {/* Date Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Dal</label>
             <input 
               type="date" 
               className="block w-full rounded-md border-gray-300 shadow-sm border p-2"
               value={formData.startDate}
               onChange={e => setFormData({...formData, startDate: e.target.value, endDate: e.target.value > (formData.endDate || '') ? e.target.value : formData.endDate})}
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Al</label>
             <input 
               type="date" 
               className="block w-full rounded-md border-gray-300 shadow-sm border p-2"
               value={formData.endDate}
               min={formData.startDate}
               onChange={e => setFormData({...formData, endDate: e.target.value})}
             />
           </div>
        </div>

        {/* Slot Specifics */}
        <div className="bg-gray-50 p-4 rounded-md">
           <label className="block text-sm font-medium text-gray-700 mb-2">Dettaglio</label>
           <div className="flex flex-col sm:flex-row sm:space-x-4 gap-y-2 mb-4">
             {['full', 'morning', 'afternoon'].map(opt => (
               <label key={opt} className="flex items-center mr-4">
                 <input 
                    type="radio" 
                    name="slot" 
                    value={opt} 
                    checked={formData.slot === opt}
                    onChange={() => setFormData({...formData, slot: opt as TimeSlot, hours: undefined})}
                    className="mr-2"
                 />
                 <span className="capitalize">{opt === 'full' ? 'Tutto il Giorno' : opt === 'morning' ? 'Mattina' : 'Pomeriggio'}</span>
               </label>
             ))}
             {formData.type === 'permesso' && (
               <label className="flex items-center">
                 <input 
                    type="radio" 
                    name="slot" 
                    value="hours" 
                    checked={formData.slot === 'hours'}
                    onChange={() => setFormData({...formData, slot: 'hours'})}
                    className="mr-2"
                 />
                 <span>A Ore</span>
               </label>
             )}
           </div>

           {formData.slot === 'hours' && (
             <div className="mb-4 animate-fade-in">
               <label className="block text-xs font-medium text-gray-500 mb-1">Numero Ore</label>
               <input 
                 type="number" 
                 min="1" 
                 max="8" 
                 value={formData.hours || 1} 
                 onChange={e => setFormData({...formData, hours: parseInt(e.target.value)})}
                 className="w-20 border rounded p-1"
               />
             </div>
           )}

           <div>
             <label className="block text-xs font-medium text-gray-500 mb-1">Note / Descrizione (Opzionale)</label>
             <input 
               type="text" 
               value={formData.description || ''}
               onChange={e => setFormData({...formData, description: e.target.value})}
               className="w-full border rounded p-2 text-sm"
               placeholder="Es. Visita medica, Cantiere Via Roma..."
             />
           </div>
        </div>

        <button type="submit" className="w-full bg-[#17494D] text-white py-3 rounded hover:bg-[#133a3e] transition-colors font-medium">
          Inserisci Richiesta
        </button>
      </form>
    </div>
  );
};

// --- App Container ---

const App = () => {
  const [view, setView] = useState('dashboard');
  const [requests, setRequests] = useState<LeaveRequest[]>(INITIAL_REQUESTS);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [tooltipData, setTooltipData] = useState<TooltipData>({ visible: false, x: 0, y: 0 });
  const [formInitialValues, setFormInitialValues] = useState<Partial<LeaveRequest> | null>(null);

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

  const handleAddRequest = (req: LeaveRequest) => {
    setRequests([...requests, req]);
    setFormInitialValues(null);
    setView('dashboard');
  };

  const handleDateClick = (dateStr: string, techId?: string) => {
    setFormInitialValues({
      startDate: dateStr,
      endDate: dateStr,
      techId: techId || TECHNICIANS[0].id,
    });
    setView('form');
  };

  const handleHoverInfo = (e: React.MouseEvent, req: LeaveRequest, tech: Technician) => {
    if (!req) {
      setTooltipData({ ...tooltipData, visible: false });
      return;
    }

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    
    // Format date string for tooltip
    let dateStr = req.startDate;
    if (req.endDate && req.endDate !== req.startDate) {
      dateStr += ` → ${req.endDate}`;
    }

    setTooltipData({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      techName: tech.name,
      techRole: tech.role,
      type: req.type,
      slot: req.slot,
      dateRange: dateStr,
      hours: req.hours,
      description: req.description
    });
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      <GlobalTooltip data={tooltipData} />
      
      {/* Fake Zendesk Navbar Strip */}
      <div className="bg-[#17494D] h-12 flex-shrink-0 flex items-center px-4 justify-between shadow-sm z-30">
        <div className="flex items-center space-x-3">
           <div className="text-white font-bold text-lg tracking-tight">Zendesk</div>
           <div className="bg-white/20 text-white text-xs px-2 py-0.5 rounded hidden sm:block">Team Resources App</div>
        </div>
        <div className="text-white/80 text-sm">ITS Pescara Helpdesk</div>
      </div>

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar 
          current={view} 
          setView={setView} 
          isCollapsed={isSidebarCollapsed} 
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-auto p-4 md:p-6 w-full relative">
          
          <div className="max-w-7xl mx-auto min-h-[600px]">
            {view === 'dashboard' && <DashboardView requests={requests} technicians={TECHNICIANS} />}
            {view === 'calendar' && (
              <CalendarView 
                requests={requests} 
                technicians={TECHNICIANS} 
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
                technicians={TECHNICIANS}
                currentMonth={currentMonth} 
                currentYear={currentYear}
                onHoverInfo={handleHoverInfo}
                onDateClick={handleDateClick}
              />
            )}
            {view === 'form' && (
              <RequestForm 
                technicians={TECHNICIANS} 
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