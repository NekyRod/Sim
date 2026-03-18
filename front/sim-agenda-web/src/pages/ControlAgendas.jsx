import { useState, useMemo, useEffect } from 'react';
import ModalVerCitas from '../components/ModalVerCitas';
import ModalBloquearRango from '../components/ModalBloquearRango';
import ModalAgendarCita from '../components/ModalAgendarCita';
import { apiFetch } from '../api/client';
import { FaUserMd, FaCalendarAlt, FaCalendarCheck, FaBan, FaSearch } from 'react-icons/fa';
import { showToast, showConfirm } from '../utils/ui';
import { Card, Select, Button, Badge } from '../components/ui';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril',
  'Mayo', 'Junio', 'Julio', 'Agosto',
  'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function ControlAgendas() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth); // 0-11
  const [profSel, setProfSel] = useState('Todos');
  const [professionals, setProfessionals] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [appointments, setAppointments] = useState([]); // Citas del mes
  const [blockedRanges, setBlockedRanges] = useState([]); // Bloqueos del mes
  const [loading, setLoading] = useState(false);

  const [modalVer, setModalVer] = useState(false);
  const [modalBloq, setModalBloq] = useState(false);
  const [modalAgendar, setModalAgendar] = useState(false);
  const [permiteModificarModal, setPermiteModificarModal] = useState(false);
  
  const [profModal, setProfModal] = useState(null);
  const [cellModal, setCellModal] = useState(null);
  const [citaEdicion, setCitaEdicion] = useState(null);
  const [lockSelection, setLockSelection] = useState(false);
  const [especialidades, setEspecialidades] = useState([]);

  const years = [currentYear - 1, currentYear, currentYear + 1];

  useEffect(() => {
    cargarProfesionales();
    cargarFestivos();
    cargarEspecialidades();
  }, []);

  async function cargarEspecialidades() {
    try {
      const resp = await apiFetch(`${BACKEND_URL}/especialidades/`);
      setEspecialidades(resp.data || []);
    } catch (err) {
      console.error('Error cargando especialidades', err);
    }
  }

  const especialidadesOptions = useMemo(() => 
    especialidades.map(e => ({ value: e.codigo, label: e.nombre })), 
  [especialidades]);

  useEffect(() => {
    cargarCitas();
  }, [year, month, profSel, professionals]);

  async function cargarProfesionales() {
    try {
      const resp = await apiFetch(`${BACKEND_URL}/profesionales/`);
      setProfessionals(resp.data || []);
    } catch (err) {
      console.error('Error cargando profesionales', err);
    }
  }

  async function cargarFestivos() {
    try {
      const resp = await apiFetch(`${BACKEND_URL}/festivos/`);
      setHolidays(resp.data || []);
    } catch (err) {
      console.error('Error cargando festivos', err);
    }
  }

  async function cargarCitas() {
    if (professionals.length === 0) return;
    try {
      setLoading(true);
      const start = new Date(year, month, 1, 0, 0, 0);
      const end = new Date(year, month + 1, 0, 23, 59, 59);
      
      const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`;
      const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
      
      const profId = profSel === 'Todos' ? 0 : parseInt(profSel);
      const resp = await apiFetch(`${BACKEND_URL}/citas/profesional/${profId}/rango?inicio=${startStr}&fin=${endStr}`);
      setAppointments(resp.data || []);

      const respBlocks = await apiFetch(`${BACKEND_URL}/rangos-bloqueados/rango?profesional_id=${profId}&inicio=${startStr}&fin=${endStr}`);
      setBlockedRanges(respBlocks.data || []);
    } catch (err) {
      console.error('Error cargando datos de agenda', err);
    } finally {
      setLoading(false);
    }
  }

  function isHolidayOrSunday(date) {
    if (date.getDay() === 0) return true;
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return holidays.some(h => h.fecha === dateStr);
  }

  function buildCalendar(year, monthIndex, professional) {
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const rows = [];
    let currentRow = new Array(7).fill(null);
    let startDay = firstDay.getDay();

    for (let i = 0; i < startDay; i++) {
      currentRow[i] = null;
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, monthIndex, d);
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const col = (startDay + d - 1) % 7;
      
      const dailyApps = appointments.filter(a => 
        a.fecha === dateStr && 
        (Number(professional.id) === Number(a.profesional_id))
      );

      const dailyBlocks = blockedRanges.filter(b => 
        b.fecha === dateStr && 
        (Number(professional.id) === Number(b.profesional_id))
      );

      const cell = {
        day: d,
        dateFull: dateStr,
        red: isHolidayOrSunday(date),
        appointmentCount: dailyApps.length,
        appointments: dailyApps,
        blockedCount: dailyBlocks.length,
        blocks: dailyBlocks
      };

      currentRow[col] = cell;

      if (col === 6 || d === daysInMonth) {
        rows.push(currentRow);
        currentRow = new Array(7).fill(null);
      }
    }

    return {
      professional,
      dayNames,
      rows,
    };
  }

  const calendars = useMemo(() => {
    const profList = profSel === 'Todos' ? professionals : professionals.filter(p => Number(p.id) === Number(profSel));
    return profList.map((p) => buildCalendar(year, month, p));
  }, [year, month, profSel, professionals, holidays, appointments, blockedRanges]);

  const appointmentsDelDia = useMemo(() => {
    if (!profModal || !cellModal?.dateFull) return [];
    return appointments.filter(a => 
      a.fecha === cellModal.dateFull && 
      (profModal.id === a.profesional_id)
    );
  }, [appointments, profModal, cellModal]);

  function openModal(tipo, profesional, cell) {
    setProfModal(profesional);
    setCellModal(cell);
    if (tipo === 'A') {
      setPermiteModificarModal(false);
      setModalVer(true);
    }
    if (tipo === 'M') {
      setPermiteModificarModal(true);
      if (cell.appointmentCount > 0) {
        setModalVer(true);
      } else {
        showToast('No hay citas para modificar en este día.', 'error');
      }
    }
    if (tipo === 'B') setModalBloq(true);
  }

  async function handleModifyAppointment(cita) {
    try {
      const resp = await apiFetch(`${BACKEND_URL}/citas/${cita.id}`);
      setCitaEdicion(resp.data);
      setLockSelection(true);
      setModalAgendar(true);
    } catch (err) {
      showToast('Error al cargar datos de la cita', 'error');
    }
  }

  async function confirmarModificacion(datosNuevos) {
    const ok = await showConfirm('¿Está seguro de cambiar los datos de la cita?');
    if (!ok) return;

    try {
      await apiFetch(`${BACKEND_URL}/citas/${citaEdicion.id}`, { method: 'DELETE' });

      const payload = {
        tipo_identificacion: citaEdicion.tipo_identificacion,
        numero_identificacion: citaEdicion.numero_identificacion,
        nombre_paciente: citaEdicion.nombre_paciente,
        telefono_fijo: citaEdicion.telefono_fijo,
        telefono_celular: citaEdicion.telefono_celular,
        segundo_telefono_celular: citaEdicion.segundo_telefono_celular,
        titular_segundo_celular: citaEdicion.titular_segundo_celular,
        direccion: citaEdicion.direccion,
        correo_electronico: citaEdicion.correo_electronico,
        lugar_residencia: citaEdicion.lugar_residencia,
        fecha_nacimiento: citaEdicion.fecha_nacimiento,
        tipo_doc_acompanante: citaEdicion.tipo_doc_acompanante,
        nombre_acompanante: citaEdicion.nombre_acompanante,
        parentesco_acompanante: citaEdicion.parentesco_acompanante,
        profesional_id: datosNuevos.profesional_id,
        fecha_programacion: datosNuevos.fecha,
        fecha_solicitada: citaEdicion.fecha_solicitada,
        hora: datosNuevos.hora_inicio,
        hora_fin: datosNuevos.hora_fin,
        tipo_servicio: citaEdicion.tipo_servicio,
        tipo_pbs: citaEdicion.tipo_pbs,
        mas_6_meses: citaEdicion.mas_6_meses,
        motivo_cita: datosNuevos.especialidad_id,
        observacion: citaEdicion.observacion
      };

      await apiFetch(`${BACKEND_URL}/citas/`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      showToast('Cita modificada correctamente.');
      setModalAgendar(false);
      setCitaEdicion(null);
      cargarCitas();
    } catch (err) {
      showToast('Error al modificar la cita', 'error');
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-brand-primary)]">Control de Agendas</h1>
          <p className="text-[var(--color-text-secondary)]">Visualización y gestión de calendarios por profesional.</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Select
            label="Año"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            options={years.map(y => ({ value: y, label: y }))}
          />
          <Select
            label="Mes"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            options={monthNames.map((m, idx) => ({ value: idx, label: m }))}
          />
          <Select
            label="Profesional"
            value={profSel}
            onChange={(e) => setProfSel(e.target.value)}
            options={[{value: 'Todos', label: 'Todos los profesionales'}, ...professionals.map(p => ({ value: p.id, label: p.nombre_completo }))]}
          />
        </div>
      </Card>

      {/* Calendars Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {calendars.map((cal) => (
          <Card key={cal.professional.id} className="overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
               <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <FaUserMd size={20} />
               </div>
               <h3 className="font-semibold text-lg text-gray-800">{cal.professional.nombre_completo}</h3>
            </div>

            {/* Calendar Grid */}
            <div className="w-full overflow-x-auto">
               <table className="w-full text-center border-collapse">
                 <thead>
                   <tr>
                     {cal.dayNames.map((d) => (
                       <th key={d} className="py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{d}</th>
                     ))}
                   </tr>
                 </thead>
                 <tbody className="text-sm">
                   {cal.rows.map((row, i) => (
                     <tr key={i}>
                       {row.map((cell, j) => {
                         if (!cell) return <td key={j} className="p-2 bg-gray-50/30"></td>;
                         
                         const isToday = false; // Implement logic if needed
                         const isHoliday = cell.red;
                         
                         return (
                           <td key={j} className={`p-1 border border-gray-100 align-top h-24 ${isHoliday ? 'bg-red-50' : 'bg-white hover:bg-gray-50 transition-colors'}`}>
                             <div className="flex flex-col h-full justify-between">
                                <div className={`text-right px-1 text-xs font-semibold ${isHoliday ? 'text-red-500' : 'text-gray-400'}`}>
                                   {cell.day}
                                </div>
                                
                                <div className="space-y-1 p-1">
                                  {/* Actions */}
                                   <div className="flex justify-center gap-1">
                                      <button 
                                        onClick={() => openModal('A', cal.professional, cell)} 
                                        className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold transition-colors ${cell.appointmentCount > 0 ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                        title="Ver Citas"
                                      >
                                        A
                                      </button>
                                      <button 
                                        onClick={() => openModal('M', cal.professional, cell)}
                                        className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold transition-colors ${cell.appointmentCount > 0 ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                         title="Modificar"
                                      >
                                        M
                                      </button>
                                      <button 
                                        onClick={() => openModal('B', cal.professional, cell)}
                                        className="w-6 h-6 flex items-center justify-center rounded text-xs font-bold bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors"
                                         title="Bloquear"
                                      >
                                        B
                                      </button>
                                   </div>
                                    {cell.appointmentCount > 0 && (
                                      <div className="mt-1">
                                        <Badge variant={isHoliday ? 'warning' : 'success'} size="sm">
                                          {cell.appointmentCount} citas
                                        </Badge>
                                      </div>
                                    )}
                                    {cell.blockedCount > 0 && (
                                      <div className="mt-1 flex items-center gap-1 justify-center bg-red-100 text-red-700 p-1 rounded text-[10px] font-bold">
                                         <FaBan size={10} /> BLOQUEADO
                                      </div>
                                    )}
                                 </div>
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
        ))}
      </div>

      <ModalVerCitas
        open={modalVer}
        profesional={profModal}
        fecha={cellModal?.dateFull}
        appointments={appointmentsDelDia}
        permiteModificar={permiteModificarModal}
        onClose={() => setModalVer(false)}
        onModifyAppointment={handleModifyAppointment}
      />
      
      <ModalBloquearRango
        open={modalBloq}
        profesional={profModal}
        fecha={cellModal?.dateFull}
        appointments={appointmentsDelDia}
        onClose={() => setModalBloq(false)}
        onModifyAppointment={handleModifyAppointment}
        onRefresh={cargarCitas}
      />

      <ModalAgendarCita
        open={modalAgendar}
        citaEdicion={citaEdicion}
        motivosOptions={especialidadesOptions}
        lockSelection={lockSelection}
        onClose={() => setModalAgendar(false)}
        onConfirmar={confirmarModificacion}
      />
    </div>
  );
}
