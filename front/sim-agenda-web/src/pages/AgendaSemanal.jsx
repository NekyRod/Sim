// src/pages/AgendaSemanal.jsx
import { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../api/client';
import { showToast } from '../utils/ui';
import { FaCalendarWeek, FaChevronLeft, FaChevronRight, FaFileExcel, FaUserMd, FaInfoCircle } from 'react-icons/fa';
import { exportToExcel } from '../utils/excel';
import ModalBase from '../components/ModalBase';
import '../styles/estilos.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Función para obtener el lunes de la semana de una fecha dada
const getMonday = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // ajustar si es domingo
  return new Date(date.setDate(diff));
};

// Generar slots de tiempo (de 6:00 AM a 8:00 PM cada 20 min)
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

    const timeStr = formatTime(h, m);
    const timeEndStr = formatTime(hFin, mFin);

    slots.push({ 
      label: `${timeStr} - ${timeEndStr}`, 
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
      
      // Formatear fecha localmente YYYY-MM-DD para evitar problemas de zona horaria
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const fullDate = `${y}-${m}-${dayNum}`;

      days.push({
        name: dayNames[i],
        number: d.getDate(),
        fullDate: fullDate
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
      const resp = await apiFetch(`${BACKEND_URL}/profesionales`);
      setProfesionales(resp.data || []);
    } catch (err) {
      console.error('Error cargando profesionales', err);
    }
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

  const handleYearChange = (e) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(parseInt(e.target.value));
    setCurrentDate(getMonday(newDate));
  };

  const handleMonthChange = (e) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(parseInt(e.target.value));
    // Al cambiar mes, intentamos ir al primer lunes de ese mes
    const firstOfMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
    setCurrentDate(getMonday(firstOfMonth));
  };

  const timeSlots = useMemo(() => generateTimeSlots(), []);

  const handleExportExcel = () => {
    if (citas.length === 0) {
      showToast('No hay citas para exportar', 'error');
      return;
    }

    const dataToExport = citas.map(cita => ({
      'Fecha': cita.fecha,
      'Hora': `${cita.hora} - ${cita.hora_fin || ''}`,
      'Paciente': cita.paciente,
      'Documento': cita.documento,
      'Motivo': cita.motivo,
      'Profesional': cita.profesional
    }));

    const fileName = `Agenda_Semanal_${weekDays[0].fullDate}_al_${weekDays[5].fullDate}.xlsx`;
    exportToExcel(dataToExport, fileName, 'Agenda Semanal');
    showToast('Archivo Excel generado correctamente');
  };

  return (
    <div className="agenda-semanal-container-full">
      <div className="agenda-semanal-header-filtros">
        <div className="filtros-top">
          <div className="filtro-item">
            <label>Año</label>
            <select value={year} onChange={handleYearChange}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="filtro-item">
            <label>Mes</label>
            <select value={month} onChange={handleMonthChange}>
              {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
          <div className="filtro-item" style={{ flex: 1 }}>
            <label>Profesional</label>
            <select value={profesionalId} onChange={(e) => setProfesionalId(e.target.value)}>
              <option value="0">-- Todos los profesionales --</option>
              {profesionales.map(p => (
                <option key={p.id} value={p.id}>{p.nombre_completo}</option>
              ))}
            </select>
          </div>
          <button onClick={handleExportExcel} className="btn-excel" style={{ alignSelf: 'flex-end', height: '38px' }}>
            <FaFileExcel /> Descargar a Excel
          </button>
        </div>

        <div className="semana-navegacion">
          <button onClick={() => navigateWeek(-1)} className="nav-arrow"><FaChevronLeft /></button>
          <div className="semana-info">
            Semana del {weekDays[0].number} de {monthNames[new Date(weekDays[0].fullDate).getMonth()]} al {weekDays[5].number} de {monthNames[new Date(weekDays[5].fullDate).getMonth()]}
          </div>
          <button onClick={() => navigateWeek(1)} className="nav-arrow"><FaChevronRight /></button>
        </div>
      </div>

      <div className="agenda-semanal-grid-wrapper">
        <table className="agenda-semanal-grid">
          <thead>
            <tr>
              <th className="col-hora">Hora</th>
              {weekDays.map(day => (
                <th key={day.fullDate} className="col-dia">
                  <div className="dia-nombre">{day.name}</div>
                  <div className="dia-numero">{day.number}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map(slot => (
              <tr key={slot.start}>
                <td className="slot-hora">{slot.label}</td>
                {weekDays.map(day => {
                  const citasEnSlot = citas.filter(c => {
                    // Normalizar horas para comparar HH:MM (manejando posibles formatos H:MM o HH:MM:SS)
                    if (!c.hora) return false;
                    const [h, m] = c.hora.split(':');
                    const citaHoraNorm = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
                    const slotHoraNorm = slot.start; // Ya viene como HH:MM desde generateTimeSlots
                    
                    return c.fecha === day.fullDate && citaHoraNorm === slotHoraNorm;
                  });

                  return (
                    <td key={day.fullDate} className="slot-dia">
                      {citasEnSlot.map(cita => (
                        <div 
                          key={cita.id} 
                          className="cita-card-semanal"
                          onClick={() => setSelectedCita(cita)}
                          title="Ver detalle"
                        >
                          <div className="cita-profesional-text">
                            <FaUserMd size={10} style={{ marginRight: '4px' }} />
                            {cita.profesional}
                          </div>
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ModalBase 
        open={!!selectedCita} 
        title="Detalle de la Cita" 
        onClose={() => setSelectedCita(null)}
      >
        {selectedCita && (
          <div className="detalle-cita-semanal">
            <div className="detalle-row">
              <label>Paciente:</label>
              <span>{selectedCita.paciente}</span>
            </div>
            <div className="detalle-row">
              <label>Documento:</label>
              <span>{selectedCita.documento}</span>
            </div>
            <div className="detalle-row">
              <label>Especialidad:</label>
              <span>{selectedCita.motivo}</span>
            </div>
            <div className="detalle-row">
              <label>Fecha:</label>
              <span>{selectedCita.fecha}</span>
            </div>
            <div className="detalle-row">
              <label>Hora:</label>
              <span>
                {selectedCita.hora?.substring(0, 5)} - {selectedCita.hora_fin?.substring(0, 5) || ''}
              </span>
            </div>
            <div className="detalle-row">
              <label>Profesional:</label>
              <span>{selectedCita.profesional}</span>
            </div>
            {selectedCita.observacion && (
              <div className="detalle-row">
                <label>Observación:</label>
                <p>{selectedCita.observacion}</p>
              </div>
            )}
          </div>
        )}
      </ModalBase>
    </div>
  );
}

