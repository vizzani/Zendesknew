import React, { useState, useMemo } from 'react';
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
  Hammer
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

// --- Mock Data ---

const TECHNICIANS: Technician[] = [
  { id: '1', name: 'Marco Rossi', role: 'Senior Tech', avatarColor: 'bg-blue-500' },
  { id: '2', name: 'Giulia Bianchi', role: 'Field Specialist', avatarColor: 'bg-green-500' },
  { id: '3', name: 'Luca Verdi', role: 'Helpdesk', avatarColor: 'bg-purple-500' },
  { id: '4', name: 'Elena Neri', role: 'Support Lead', avatarColor: 'bg-orange-500' },
  { id: '5', name: 'Roberto Gallo', role: 'Junior Tech', avatarColor: 'bg-indigo-500' },
];

const INITIAL_REQUESTS: LeaveRequest[] = [
  { id: '101', techId: '1', startDate: '2023-10-05', endDate: '2023-10-06', type: 'ferie', slot: 'full' },
  { id: '102', techId: '2', startDate: '2023-10-10', endDate: '2023-10-10', type: 'permesso', slot: 'morning' },
  { id: '103', techId: '3', startDate: '2023-10-15', endDate: '2023-10-20', type: 'ferie', slot: 'full' },
  { id: '104', techId: '4', startDate: '2023-10-05', endDate: '2023-10-05', type: 'permesso', slot: 'hours', hours: 2 },
  { id: '105', techId: '5', startDate: '2023-10-08', endDate: '2023-10-09', type: 'malattia', slot: 'full' },
  { id: '106', techId: '2', startDate: '2023-10-12', endDate: '2023-10-14', type: 'cantiere', slot: 'full' },
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

const ViewToggle = ({ current, setView }: { current: string, setView: (v: string) => void }) => {
  const views = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'timeline', label: 'Timeline', icon: AlignLeft },
    { id: 'form', label: 'Inserisci', icon: PlusCircle },
  ];

  return (
    <div className="flex bg-gray-200 p-1 rounded-lg">
      {views.map((v) => (
        <button
          key={v.id}
          onClick={() => setView(v.id)}
          className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
            current === v.id 
              ? 'bg-white text-gray-800 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300/50'
          }`}
        >
          <v.icon className="w-4 h-4 mr-2" />
          {v.label}
        </button>
      ))}
    </div>
  );
};

// --- Main Views ---

const DashboardView = ({ requests, technicians }: { requests: LeaveRequest[], technicians: Technician[] }) => {
  const today = formatDate(new Date()); // Using mock today for simplicity or real today
  
  // Stats
  // We count Cantiere as "Impegnato" but technically they are working. 
  // For "In Ferie/Assenti Oggi" we might exclude Cantiere, but keep Malattia.
  // Let's count "Non Disponibili in Sede" (so include all).
  const absentToday = requests.filter(r => isDateInRange(today, r.startDate, r.endDate)).length;
  const activeTechs = technicians.length - absentToday;
  
  // Chart Data Preparation
  const chartData = useMemo(() => {
    const types = { ferie: 0, permesso: 0, malattia: 0, cantiere: 0 };
    requests.forEach(r => {
      if (r.type === 'ferie') types.ferie += 1;
      if (r.type === 'permesso') types.permesso += r.hours || 4;
      if (r.type === 'malattia') types.malattia += 1;
      if (r.type === 'cantiere') types.cantiere += 1;
    });
    return [
      { name: 'Ferie (gg)', value: types.ferie, fill: getTypeColor('ferie', 'fill') },
      { name: 'Permessi (h)', value: types.permesso, fill: getTypeColor('permesso', 'fill') },
      { name: 'Malattia (gg)', value: types.malattia, fill: getTypeColor('malattia', 'fill') },
      { name: 'Cantiere (gg)', value: types.cantiere, fill: getTypeColor('cantiere', 'fill') },
    ];
  }, [requests]);

  const upcomingLeaves = requests
    .filter(r => r.startDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard 
          title="Impegnati Oggi" 
          value={absentToday} 
          icon={Sun} 
          color="border-red-500" 
          subtext={`Su ${technicians.length} tecnici totali`}
        />
        <KPICard 
          title="Disponibili" 
          value={activeTechs} 
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="zendesk-card p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Distribuzione Attività</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                 <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
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

        {/* List */}
        <div className="zendesk-card p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Prossime Attività/Assenze</h3>
          <div className="space-y-3">
            {upcomingLeaves.length === 0 ? (
              <p className="text-gray-400 text-sm">Nessuna attività programmata.</p>
            ) : (
              upcomingLeaves.map(req => {
                const tech = technicians.find(t => t.id === req.techId);
                const bgClass = getTypeColor(req.type, 'bg');
                const textClass = getTypeColor(req.type, 'text');

                return (
                  <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${tech?.avatarColor}`}>
                        {tech?.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{tech?.name}</p>
                        <p className="text-xs text-gray-500">
                          {getTypeLabel(req.type)} • {req.startDate}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${bgClass} ${textClass}`}>
                      {req.slot === 'full' ? 'Tutto il gg' : req.slot}
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

const CalendarView = ({ requests, technicians, currentMonth, currentYear, onChangeMonth }: any) => {
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
        <h2 className="text-xl font-bold text-gray-800">{monthNames[currentMonth]} {currentYear}</h2>
        <div className="flex space-x-2">
          <button onClick={() => onChangeMonth(-1)} className="p-2 hover:bg-gray-100 rounded"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={() => onChangeMonth(1)} className="p-2 hover:bg-gray-100 rounded"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden flex-1">
        {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map(d => (
          <div key={d} className="bg-gray-50 p-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {d}
          </div>
        ))}
        {blanks.map(b => <div key={`blank-${b}`} className="bg-white min-h-[100px]" />)}
        {days.map(day => {
          const events = getEventsForDay(day);
          return (
            <div key={day} className="bg-white p-1 min-h-[100px] border-t border-gray-50 relative group hover:bg-blue-50/30 transition-colors">
              <span className={`text-sm font-medium p-1 rounded-full ${new Date().getDate() === day && new Date().getMonth() === currentMonth ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                {day}
              </span>
              <div className="mt-1 space-y-1">
                {events.map((ev: LeaveRequest) => {
                  const tech = technicians.find((t:any) => t.id === ev.techId);
                  const bgClass = getTypeColor(ev.type, 'bg');
                  const textClass = getTypeColor(ev.type, 'text');
                  
                  return (
                    <div key={ev.id} className={`text-[10px] px-1 py-0.5 rounded truncate ${bgClass} ${textClass}`}>
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

const TimelineView = ({ requests, technicians, currentMonth, currentYear }: any) => {
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="zendesk-card p-4 overflow-hidden flex flex-col h-full">
      <h3 className="text-lg font-bold mb-4">Timeline Disponibilità</h3>
      <div className="flex-1 overflow-auto timeline-scroll relative border rounded">
        <div className="min-w-max">
          {/* Header Row */}
          <div className="flex border-b sticky top-0 bg-gray-50 z-10">
            <div className="w-48 p-3 font-semibold text-gray-600 border-r bg-gray-50 sticky left-0 z-20 shadow-sm">Tecnico</div>
            {days.map(d => (
              <div key={d} className="w-10 flex-shrink-0 text-center text-xs text-gray-500 py-3 border-r">
                {d}
              </div>
            ))}
          </div>

          {/* Rows */}
          {technicians.map((tech: Technician) => (
            <div key={tech.id} className="flex border-b hover:bg-gray-50">
              <div className="w-48 p-3 border-r flex items-center space-x-2 sticky left-0 bg-white z-10">
                <div className={`w-6 h-6 rounded-full ${tech.avatarColor} text-white text-xs flex items-center justify-center`}>
                  {tech.name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-gray-700 truncate">{tech.name}</span>
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
                      className={`h-6 mx-0.5 mt-2 ${roundedClass} text-[9px] flex items-center justify-center text-white cursor-help ${bgClass}`}
                      title={`${getTypeLabel(leave.type)} - ${leave.slot}`}
                     >
                       {isStart && letter}
                     </div>
                   );
                }

                return (
                  <div key={d} className="w-10 flex-shrink-0 border-r relative bg-white">
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

const RequestForm = ({ technicians, onSubmit, onCancel }: any) => {
  const [formData, setFormData] = useState<Partial<LeaveRequest>>({
    techId: technicians[0].id,
    type: 'ferie',
    slot: 'full',
    startDate: formatDate(new Date()),
    endDate: formatDate(new Date()),
    hours: 1
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
    <div className="zendesk-card max-w-2xl mx-auto p-8 mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Nuova Richiesta / Attività</h2>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">Chiudi</button>
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
        <div className="grid grid-cols-2 gap-4">
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
        <div className="grid grid-cols-2 gap-4">
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
           <label className="block text-sm font-medium text-gray-700 mb-2">Dettaglio Orario</label>
           <div className="flex space-x-4 flex-wrap gap-y-2">
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
             <div className="mt-3 animate-fade-in">
               <label className="block text-xs font-medium text-gray-500">Numero Ore</label>
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
    setView('dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Fake Zendesk Navbar Strip */}
      <div className="bg-[#17494D] h-12 flex items-center px-4 justify-between shadow-sm">
        <div className="flex items-center space-x-3">
           <div className="text-white font-bold text-lg tracking-tight">Zendesk</div>
           <div className="bg-white/20 text-white text-xs px-2 py-0.5 rounded">Team Resources App</div>
        </div>
        <div className="text-white/80 text-sm">Tech Team Italy</div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestione Ferie & Permessi</h1>
            <p className="text-gray-500">Pianificazione risorse tecniche e disponibilità</p>
          </div>
          
          <ViewToggle current={view} setView={setView} />
        </div>

        <div className="min-h-[600px]">
          {view === 'dashboard' && <DashboardView requests={requests} technicians={TECHNICIANS} />}
          {view === 'calendar' && (
            <CalendarView 
              requests={requests} 
              technicians={TECHNICIANS} 
              currentMonth={currentMonth} 
              currentYear={currentYear}
              onChangeMonth={handleMonthChange}
            />
          )}
          {view === 'timeline' && (
            <TimelineView 
              requests={requests} 
              technicians={TECHNICIANS}
              currentMonth={currentMonth} 
              currentYear={currentYear}
            />
          )}
          {view === 'form' && (
            <RequestForm 
              technicians={TECHNICIANS} 
              onSubmit={handleAddRequest} 
              onCancel={() => setView('dashboard')} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
