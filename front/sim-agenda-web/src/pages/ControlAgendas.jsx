// src/pages/ControlAgendas.jsx
import { useState, useMemo, useEffect } from 'react';
import ModalVerCitas from '../components/ModalVerCitas';
import ModalBloquearRango from '../components/ModalBloquearRango';
import ModalAgendarCita from '../components/ModalAgendarCita';
import { apiFetch } from '../api/client';
import { FaUserMd } from 'react-icons/fa';
import { showToast, showConfirm } from '../utils/ui';
import '../styles/estilos.css';

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
      const resp = await apiFetch(`${BACKEND_URL}/especialidades`);
      console.log("Especialidades cargadas:", resp.data);
      setEspecialidades(resp.data || []);
    } catch (err) {
      console.error('Error cargando especialidades', err);
    }
  }

  const especialidadesOptions = useMemo(() => 
    especialidades.map(e => ({ v: e.codigo, t: e.nombre })), 
  [especialidades]);

  useEffect(() => {
    cargarCitas();
  }, [year, month, profSel, professionals]);

  async function cargarProfesionales() {
    try {
      const resp = await apiFetch(`${BACKEND_URL}/profesionales`);
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
      // Usar fecha local para evitar desfases de zona horaria
      // Obtenemos el primer y último día del mes en curso según el estado local (year, month)
      const start = new Date(year, month, 1, 0, 0, 0);
      const end = new Date(year, month + 1, 0, 23, 59, 59);
      
      const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`;
      const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
      
      console.log(`Consultando citas desde ${startStr} hasta ${endStr}`);
      
      const profId = profSel === 'Todos' ? 0 : parseInt(profSel);
      const resp = await apiFetch(`${BACKEND_URL}/citas/profesional/${profId}/rango?inicio=${startStr}&fin=${endStr}`);
      
      console.log("Citas recibidas:", resp.data);
      setAppointments(resp.data || []);
    } catch (err) {
      console.error('Error cargando citas', err);
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
      
      // Contar citas para este día y este profesional
      const dailyApps = appointments.filter(a => 
        a.fecha === dateStr && 
        (professional.id === a.profesional_id)
      );

      const cell = {
        day: d,
        dateFull: dateStr,
        red: isHolidayOrSunday(date),
        appointmentCount: dailyApps.length,
        appointments: dailyApps
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
    const profList = profSel === 'Todos' ? professionals : professionals.filter(p => p.id === parseInt(profSel));
    return profList.map((p) => buildCalendar(year, month, p));
  }, [year, month, profSel, professionals, holidays, appointments]);

  // Citas para los modales (recalculadas si appointments cambia)
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
      // Si hay citas, mostrar el modal de ver para elegir cuál modificar
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
      // Obtener datos completos de la cita para el modal
      const resp = await apiFetch(`${BACKEND_URL}/citas/${cita.id}`);
      setCitaEdicion(resp.data);
      setLockSelection(true); // Bloquear especialidad y profesional según requerimiento "B"
      setModalAgendar(true);
    } catch (err) {
      showToast('Error al cargar datos de la cita', 'error');
    }
  }

  async function confirmarModificacion(datosNuevos) {
    const ok = await showConfirm('¿Está seguro de cambiar los datos de la cita?');
    if (!ok) return;

    try {
      // 1. Eliminar cita anterior
      await apiFetch(`${BACKEND_URL}/citas/${citaEdicion.id}`, { method: 'DELETE' });

      // 2. Crear nueva cita
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
      cargarCitas(); // Recargar el calendario
    } catch (err) {
      showToast('Error al modificar la cita', 'error');
    }
  }

  return (
    <section id="control-agendas-section">
      <div className="controls">
        <div className="control-group">
          <label htmlFor="year-select">Año:</label>
          <select
            id="year-select"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="month-select">Mes:</label>
          <select
            id="month-select"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
          >
            {monthNames.map((m, idx) => (
              <option key={m} value={idx}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="professional-select">Profesional:</label>
          <select
            id="professional-select"
            value={profSel}
            onChange={(e) => setProfSel(e.target.value)}
          >
            <option value="Todos">Todos los profesionales</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre_completo}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div id="calendars-container" className="calendars-grid">
        {calendars.map((cal) => (
          <div key={cal.professional.id} className="calendar-card">
            <div className="calendar-card-header">
              <FaUserMd className="icon" />
              <h3>{cal.professional.nombre_completo}</h3>
            </div>
            <table>
              <thead>
                <tr>
                  {cal.dayNames.map((d) => (
                    <th key={d}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cal.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => {
                      if (!cell) return <td key={j} className="empty-cell" />;
                      if (cell.red) {
                        return (
                          <td key={j} className="holiday-cell">
                            <div className="day-number">{cell.day}</div>
                          </td>
                        );
                      }
                      return (
                        <td key={j} className="work-cell">
                          <div className="day-number">{cell.day}</div>
                          <div className="actions-row">
                            <button
                              className="btn-a"
                              title={cell.appointmentCount > 0 ? `${cell.appointmentCount} citas agendadas` : 'Ver citas'}
                              onClick={() => openModal('A', cal.professional, cell)}
                            >
                              A {cell.appointmentCount > 0 && <span className="count-badge">{cell.appointmentCount}</span>}
                            </button>
                            <button
                              className="btn-m"
                              title="Modificar horario"
                              onClick={() => openModal('M', cal.professional, cell)}
                            >
                              M {cell.appointmentCount > 0 && <span className="count-badge">{cell.appointmentCount}</span>}
                            </button>
                            <button
                              className="btn-b"
                              title="Bloquear rango"
                              onClick={() => openModal('B', cal.professional, cell)}
                            >
                              B
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
      />

      <ModalAgendarCita
        open={modalAgendar}
        citaEdicion={citaEdicion}
        motivosOptions={especialidadesOptions}
        lockSelection={lockSelection}
        onClose={() => setModalAgendar(false)}
        onConfirmar={confirmarModificacion}
      />
    </section>
  );
}
