import { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../api/client';
import { showToast } from '../utils/ui';
import { FaCalendarWeek, FaChevronLeft, FaChevronRight, FaFileExcel, FaUserMd, FaInfoCircle, FaClock, FaCalendarDay } from 'react-icons/fa';
import { exportToExcel } from '../utils/excel';
import { Card, Select, Button, Badge } from '../components/ui';
import ModalBase from '../components/ModalBase'; // Maintaining existing modal for detail view simplicity

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const getMonday = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

const generateTimeSlots = () => {
  const slots = [];
  let start = 6 * 60 + 0; // 6:00 AM
  const end = 20 * 60 + 0; // 8:00 PM
  const interval = 20;

  while (start < end) {
    const h = Math.floor(start / 60);
    const m = start % 60;
    const hFin = Math.floor((start + interval) / 60);
    const mFin = (start + interval) % 60;

    const formatTime = (hh, mm) => {
      const ampm = hh >= 12 ? 'p. m.' : 'a. m.';
      const h12 = hh % 12 || 12;
      return `${h12}:${mm.toString().padStart(2, '0')} ${ampm}`;
    };

    slots.push({ 
      label: `${formatTime(h, m)} - ${formatTime(hFin, mFin)}`, 
      start: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
      end: `${hFin.toString().padStart(2, '0')}:${mFin.toString().padStart(2, '0')}`
    });
    start += interval;
  }
  return slots;
};

export default function AgendaSemanal() {
  const [currentDate, setCurrentDate] = useState(getMonday(new Date()));
  const [profesionales, setProfesionales] = useState([]);
  const [profesionalId, setProfesionalId] = useState('0');
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCita, setSelectedCita] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const years = useMemo(() => {
    const currentY = new Date().getFullYear();
    return [currentY - 1, currentY, currentY + 1];
  }, []);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(currentDate);
      d.setDate(currentDate.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const fullDate = `${y}-${m}-${dayNum}`;

      days.push({
        name: dayNames[i],
        number: d.getDate(),
        fullDate: fullDate,
        isToday: fullDate === new Date().toISOString().split('T')[0]
      });
    }
    return days;
  }, [currentDate]);

  useEffect(() => {
    cargarProfesionales();
  }, []);

  useEffect(() => {
    cargarCitas();
  }, [currentDate, profesionalId]);

  async function cargarProfesionales() {
    try {
      const resp = await apiFetch(`${BACKEND_URL}/profesionales/`);
      setProfesionales(resp.data || []);
    } catch (err) { console.error(err); }
  }

  async function cargarCitas() {
    setLoading(true);
    try {
      const startStr = weekDays[0].fullDate;
      const endStr = weekDays[5].fullDate;
      const pId = profesionalId === '0' ? 0 : parseInt(profesionalId);
      const resp = await apiFetch(`${BACKEND_URL}/citas/profesional/${pId}/rango?inicio=${startStr}&fin=${endStr}`);
      setCitas(resp.data || []);
    } catch (err) {
      showToast('Error cargando citas', 'error');
    } finally {
      setLoading(false);
    }
  }

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const timeSlots = useMemo(() => generateTimeSlots(), []);

  const handleExportExcel = () => {
    if (citas.length === 0) return showToast('No hay citas para exportar', 'error');
    const dataToExport = citas.map(cita => ({
      'Fecha': cita.fecha,
      'Hora': `${cita.hora} - ${cita.hora_fin || ''}`,
      'Paciente': cita.paciente,
      'Documento': cita.documento,
      'Motivo': cita.motivo,
      'Profesional': cita.profesional
    }));
    exportToExcel(dataToExport, `Agenda_Semanal_${weekDays[0].fullDate}.xlsx`, 'Agenda Semanal');
  };

  return (
    <div className="max-w-[1800px] mx-auto space-y-4 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-brand-primary)]">Agenda Semanal</h1>
          <p className="text-[var(--color-text-secondary)]">Vista general de la semana por intervalos.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
           <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
             <Button variant="ghost" size="sm" onClick={() => navigateWeek(-1)}><FaChevronLeft/></Button>
             <span className="font-semibold text-gray-700 min-w-[280px] text-center">
                {weekDays[0].number} {monthNames[new Date(weekDays[0].fullDate).getMonth()]} - {weekDays[5].number} {monthNames[new Date(weekDays[5].fullDate).getMonth()]} {year}
             </span>
             <Button variant="ghost" size="sm" onClick={() => navigateWeek(1)}><FaChevronRight/></Button>
           </div>
           
           <div className="w-64">
             <Select
                value={profesionalId}
                onChange={(e) => setProfesionalId(e.target.value)}
                options={[{value:'0', label:'Todos los profesionales'}, ...profesionales.map(p => ({value:p.id, label:p.nombre_completo}))]}
                className="!mb-0"
             />
           </div>

           <Button onClick={handleExportExcel} variant="success" className="flex items-center gap-2">
              <FaFileExcel /> Excel
           </Button>
        </div>
      </div>

      {/* Grid */}
      <Card className="overflow-x-auto p-0">
        <div className="min-w-[1000px]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 border-b border-r border-gray-200 p-3 w-32 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                  Hora
                </th>
                {weekDays.map(day => (
                  <th key={day.fullDate} className={`border-b border-r border-gray-200 p-3 text-center min-w-[160px] ${day.isToday ? 'bg-blue-50' : 'bg-white'}`}>
                    <div className={`text-sm font-bold ${day.isToday ? 'text-blue-700' : 'text-gray-700'}`}>{day.name}</div>
                    <div className={`text-2xl font-light ${day.isToday ? 'text-blue-600' : 'text-gray-400'}`}>{day.number}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {timeSlots.map(slot => (
                <tr key={slot.start} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="sticky left-0 bg-white group-hover:bg-gray-50/50 border-r border-gray-200 p-2 text-xs text-gray-400 font-mono text-center align-top pt-3">
                    {slot.label}
                  </td>
                  {weekDays.map(day => {
                    const citasEnSlot = citas.filter(c => {
                      if (!c.hora) return false;
                      const [h, m] = c.hora.split(':');
                      return c.fecha === day.fullDate && `${h.padStart(2,'0')}:${m.padStart(2,'0')}` === slot.start;
                    });

                    return (
                      <td key={day.fullDate} className={`border-r border-gray-100 p-1 align-top h-16 ${day.isToday ? 'bg-blue-50/20' : ''}`}>
                        <div className="flex flex-col gap-1 h-full">
                          {citasEnSlot.map(cita => (
                            <div 
                              key={cita.id} 
                              onClick={() => setSelectedCita(cita)}
                              className="cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs p-1.5 rounded border-l-2 border-blue-500 shadow-sm transition-all hover:shadow-md"
                              title={`${cita.paciente} - ${cita.motivo}`}
                            >
                              <div className="font-bold truncate">{cita.paciente}</div>
                              <div className="flex items-center gap-1 text-[10px] opacity-80 truncate">
                                <FaUserMd size={8} /> {cita.profesional.split(' ')[0]} ...
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Detalle (Simple View) */}
      <ModalBase 
        open={!!selectedCita} 
        title="Detalle de Cita" 
        onClose={() => setSelectedCita(null)}
      >
        {selectedCita && (
          <div className="space-y-4 p-2">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg text-blue-900">
               <FaClock className="text-xl" />
               <div>
                 <div className="font-bold">{selectedCita.fecha}</div>
                 <div className="text-sm">{selectedCita.hora} - {selectedCita.hora_fin}</div>
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Paciente</label>
                <div className="text-gray-900 font-medium">{selectedCita.paciente}</div>
                <div className="text-xs text-gray-500">{selectedCita.documento}</div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Profesional</label>
                <div className="text-gray-900 font-medium">{selectedCita.profesional}</div>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Motivo</label>
                <div><Badge variant="info">{selectedCita.motivo}</Badge></div>
              </div>
              {selectedCita.observacion && (
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Observaciones</label>
                  <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{selectedCita.observacion}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end pt-4">
              <Button onClick={() => setSelectedCita(null)} variant="secondary">Cerrar</Button>
            </div>
          </div>
        )}
      </ModalBase>
    </div>
  );
}
