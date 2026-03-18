
import { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../api/client';
import { Card, Badge, Button } from '../components/ui';
import { 
  FaCalendarCheck, FaUserClock, FaCheckCircle, FaTimesCircle, 
  FaChartBar, FaCalendarDay, FaArrowRight, FaPlus 
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [weekAppointments, setWeekAppointments] = useState([]);
  const [stats, setStats] = useState({
    totalToday: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0
  });

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const authUser = sessionStorage.getItem('auth_user') || 'Administrador';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Calculate start/end of current week (Monday to Sunday)
      const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
      const diffToMon = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(today);
      monday.setDate(diffToMon);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      const startWeekStr = monday.toISOString().split('T')[0];
      const endWeekStr = sunday.toISOString().split('T')[0];

      // Fetch Today's Appointments (All professionals = 0)
      const respToday = await apiFetch(`${BACKEND_URL}/citas/profesional/0/rango?inicio=${todayStr}&fin=${todayStr}`);
      const todayData = respToday.data || [];
      setTodayAppointments(todayData);

      // Fetch Week's Appointments for Chart
      const respWeek = await apiFetch(`${BACKEND_URL}/citas/profesional/0/rango?inicio=${startWeekStr}&fin=${endWeekStr}`);
      setWeekAppointments(respWeek.data || []);

      // Calculate Stats
      const statsCalc = todayData.reduce((acc, curr) => {
        acc.totalToday++;
        const status = (curr.estado || 'PENDIENTE').toUpperCase();
        if (status === 'PENDIENTE') acc.pending++;
        else if (status === 'CONFIRMADA') acc.confirmed++;
        else if (status === 'COMPLETADA') acc.completed++;
        else if (status === 'CANCELADA') acc.cancelled++;
        return acc;
      }, { totalToday: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 });

      setStats(statsCalc);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  // Weekly Chart Data
  const weeklyChartData = useMemo(() => {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const counts = new Array(7).fill(0);
    
    weekAppointments.forEach(app => {
      if (!app.fecha) return;
      const d = new Date(app.fecha); // Verify format YYYY-MM-DD
      // d.getDay() returns 0 for Sunday. We want 0 for Monday.
      // Sun (0) -> 6
      // Mon (1) -> 0
      let idx = d.getDay() - 1;
      if (idx === -1) idx = 6;
      
      if (idx >= 0 && idx < 7) counts[idx]++;
    });

    const max = Math.max(...counts, 1);
    return days.map((day, i) => ({
      day,
      count: counts[i],
      height: `${(counts[i] / max) * 100}%`
    }));
  }, [weekAppointments]);

  // Upcoming Appointments (Top 5 pending/confirmed from today, sorted by time)
  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    const currentHourStr = now.toTimeString().slice(0, 5); // HH:MM

    return todayAppointments
      .filter(a => {
        const status = (a.estado || '').toUpperCase();
        return status !== 'CANCELADA' && status !== 'COMPLETADA';
      })
      .sort((a, b) => a.hora.localeCompare(b.hora))
      .filter(a => a.hora >= currentHourStr) // Only future appointments today
      .slice(0, 5);
  }, [todayAppointments]);

  return (
    <div className="space-y-8 animate-fadeIn pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Panel de Control</h1>
          <p className="text-gray-500">Bienvenido de nuevo, <span className="font-semibold text-blue-600">{authUser}</span></p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/agendamiento')} variant="outline" className="gap-2">
            <FaCalendarCheck /> Agendar Cita
          </Button>
          <Button onClick={fetchDashboardData} variant="ghost" className="text-gray-400 hover:text-blue-600">
            <FaArrowRight className="transform rotate-180" /> {/* Refresh icon substitute */}
            Actualizar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Citas para Hoy" 
          value={stats.totalToday} 
          icon={<FaCalendarDay />} 
          color="bg-blue-500" 
          subText="Total programadas"
        />
        <KpiCard 
          title="Confirmadas" 
          value={stats.confirmed} 
          icon={<FaCheckCircle />} 
          color="bg-green-500" 
          subText="Pacientes confirmados"
        />
        <KpiCard 
          title="Pendientes" 
          value={stats.pending} 
          icon={<FaUserClock />} 
          color="bg-amber-500" 
          subText="Por confirmar llegada"
        />
        <KpiCard 
          title="Canceladas" 
          value={stats.cancelled} 
          icon={<FaTimesCircle />} 
          color="bg-red-500" 
          subText="Cancelaciones del día"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column: Weekly Stats & Upcoming */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Weekly Chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <FaChartBar className="text-blue-500" /> Rendimiento Semanal
              </h3>
              <Badge variant="neutral">Esta Semana</Badge>
            </div>
            
            <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 px-2">
              {weeklyChartData.map((d) => (
                <div key={d.day} className="flex flex-col items-center gap-2 flex-1 group h-full">
                  <div className="relative w-full max-w-[40px] bg-gray-100 rounded-t-lg h-full overflow-visible flex items-end">
                    <div 
                      className="w-full bg-blue-500 rounded-t-lg transition-all duration-500 hover:bg-blue-600 relative group-hover:shadow-lg"
                      style={{ height: d.height }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {d.count} citas
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gray-500">{d.day}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Upcoming List */}
          <Card className="p-0 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-700">Próximas Citas (Hoy)</h3>
              <Button size="sm" variant="ghost" onClick={() => navigate('/agenda-diaria')}>Ver Todo</Button>
            </div>
            <div className="divide-y divide-gray-50">
              {loading ? (
                <div className="p-8 text-center text-gray-400">Cargando...</div>
              ) : upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((app) => (
                  <div key={app.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-50 text-blue-700 font-mono font-bold px-3 py-2 rounded-lg text-sm">
                        {app.hora.substring(0, 5)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{app.paciente}</p>
                        <p className="text-xs text-gray-500">{app.motivo} • {app.profesional}</p>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(app.estado)}>{app.estado || 'Pendiente'}</Badge>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400 italic">
                  No hay más citas programadas para hoy.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Quick Actions & Availability */}
        <div className="space-y-8">
          
          {/* Quick Actions */}
          <Card className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-lg">
            <h3 className="font-bold text-lg mb-4">Acciones Rápidas</h3>
            <div className="space-y-3">
              <button onClick={() => navigate('/agendamiento')} className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10 backdrop-blur-sm group">
                <span className="font-medium text-sm">Nueva Cita</span>
                <div className="bg-white/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform"><FaPlus className="text-xs" /></div>
              </button>
              <button onClick={() => navigate('/pacientes')} className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10 backdrop-blur-sm group">
                <span className="font-medium text-sm">Registrar Paciente</span>
                <div className="bg-white/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform"><FaPlus className="text-xs" /></div>
              </button>
              <button onClick={() => navigate('/crear-disponibilidad')} className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10 backdrop-blur-sm group">
                <span className="font-medium text-sm">Abrir Agenda</span>
                <div className="bg-white/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform"><FaCalendarCheck className="text-xs" /></div>
              </button>
            </div>
          </Card>

           {/* Today's Summary Text */}
           <Card className="p-6">
            <h3 className="font-bold text-gray-700 mb-4">Resumen del Día</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Ocupación estimada</span>
                <span className="font-bold text-gray-800">
                  {Math.round((stats.confirmed + stats.completed) / (stats.totalToday || 1) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.round((stats.confirmed + stats.completed) / (stats.totalToday || 1) * 100)}%` }}
                ></div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                <p>Datos actualizados en tiempo real.</p>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon, color, subText }) {
  return (
    <Card className="p-0 overflow-hidden border-l-4" style={{ borderLeftColor: 'var(--color-border-transparent)' }}>
      <div className="p-6 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h2 className="text-3xl font-bold text-gray-800">{value}</h2>
          {subText && <p className="text-xs text-gray-400 mt-2">{subText}</p>}
        </div>
        <div className={`p-3 rounded-xl text-white shadow-lg ${color}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function getStatusVariant(status) {
  switch ((status || '').toUpperCase()) {
    case 'CONFIRMADA': return 'success';
    case 'PENDIENTE': return 'warning';
    case 'CANCELADA': return 'danger';
    case 'COMPLETADA': return 'info';
    default: return 'neutral';
  }
}
