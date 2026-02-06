// src/components/ModalAgendarCita.jsx

import { useState, useEffect } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { apiFetch } from '../api/client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const DIAS_SEMANA_NOMBRES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function ModalAgendarCita({
  open,
  especialidadId: especialidadInicial,
  motivosOptions = [],
  onChangeMotivo,
  duracionBase,
  onClose,
  onConfirmar,
  citaEdicion = null, // ← NUEVO: Objeto de la cita si estamos editando
  lockSelection = false // ← NUEVO: Bloquear especialidad y profesional
}) {
  const [especialidadId, setEspecialidadId] = useState(especialidadInicial || '');
  const [profesionales, setProfesionales] = useState([]);
  const [profesionalSeleccionado, setProfesionalSeleccionado] = useState(null);
  const [duracionSeleccionada, setDuracionSeleccionada] = useState(duracionBase || 20);
  
  // Disponibilidad
  const [disponibilidades, setDisponibilidades] = useState({});
  const [citasOcupadas, setCitasOcupadas] = useState([]);
  
  // Semana actual de visualización
  const [fechaInicioSemana, setFechaInicioSemana] = useState(new Date());

  // Selección
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [horaSeleccionada, setHoraSeleccionada] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Inicializar si cambia desde props o si es edición
  useEffect(() => {
    if (open) {
      if (citaEdicion) {
        console.log("Editando cita:", citaEdicion);
        setEspecialidadId(citaEdicion.motivo_cita || '');
        setFechaSeleccionada(citaEdicion.fecha_programacion || '');
        // El backend devuelve HH:MM:SS, necesitamos HH:MM para el matching de slots
        const horaHHMM = citaEdicion.hora ? citaEdicion.hora.substring(0, 5) : '';
        setHoraSeleccionada(horaHHMM);
        
        // Ajustar la semana del calendario a la fecha de la cita
        if (citaEdicion.fecha_programacion) {
          setFechaInicioSemana(new Date(citaEdicion.fecha_programacion + 'T00:00:00'));
        }
        // Duración (calculada si es posible, o usar la base)
        if (citaEdicion.hora && citaEdicion.hora_fin) {
          const [h1, m1] = citaEdicion.hora.split(':').map(Number);
          const [h2, m2] = citaEdicion.hora_fin.split(':').map(Number);
          const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
          setDuracionSeleccionada(diff > 0 ? diff : (duracionBase || 20));
        } else {
          setDuracionSeleccionada(duracionBase || 20);
        }
      } else {
        setEspecialidadId(especialidadInicial || '');
        setFechaSeleccionada('');
        setHoraSeleccionada('');
        setFechaInicioSemana(new Date());
        setDuracionSeleccionada(duracionBase || 20);
      }
    }
  }, [open, especialidadInicial, citaEdicion]);

  // Cargar profesionales cuando cambia la especialidad
  useEffect(() => {
    if (open && especialidadId) {
      cargarProfesionales();
    } else {
      setProfesionales([]);
    }
  }, [open, especialidadId]);

  // Una vez cargados los profesionales, si es edición, seleccionar el profesional actual
  useEffect(() => {
    if (open && citaEdicion && profesionales.length > 0) {
      const prof = profesionales.find(p => p.id === citaEdicion.profesional_id);
      if (prof) setProfesionalSeleccionado(prof);
    }
  }, [profesionales, citaEdicion, open]);

  // Actualizar duración cuando cambia la base
  useEffect(() => {
    setDuracionSeleccionada(duracionBase || 20);
  }, [duracionBase]);

  // Cargar datos del calendario cuando cambia profesional o semana
  useEffect(() => {
    if (profesionalSeleccionado) {
      cargarDatosCalendario();
    } else {
      setDisponibilidades({});
      setCitasOcupadas([]);
    }
  }, [profesionalSeleccionado, fechaInicioSemana]);

  async function cargarProfesionales() {
    setLoading(true);
    try {
      // Usar especialidadId tal cual si es string (ej: "IMPL"), no parseInt
      const resp = await apiFetch(`${BACKEND_URL}/profesionales/especialidad/${especialidadId}`);
      console.log("Profesionales cargados:", resp.data); // Debug
      setProfesionales(resp.data || []);
      setError(null);
    } catch (err) {
      console.error('Error cargando profesionales:', err);
      setError('Error al cargar profesionales');
    } finally {
      setLoading(false);
    }
  }

  async function cargarDatosCalendario() {
    if (!profesionalSeleccionado) return;
    setLoading(true);
    try {
      // 1. Disponibilidades (Reglas)
      const respDisp = await apiFetch(`${BACKEND_URL}/disponibilidades/profesional/${profesionalSeleccionado.id}`);
      setDisponibilidades(respDisp.data || {});

      // 2. Citas existentes (Ocupado)
      // Calcular rango de fechas de la semana actual
      const dias = generarDiasSemana(fechaInicioSemana);
      const inicio = dias[0].fechaFull;
      const fin = dias[6].fechaFull;

      const respCitas = await apiFetch(`${BACKEND_URL}/citas/profesional/${profesionalSeleccionado.id}/rango?inicio=${inicio}&fin=${fin}`);
      setCitasOcupadas(respCitas.data || []);
      
      setError(null);
    } catch (err) {
      console.error('Error cargando calendario:', err);
      setError('Error al cargar disponibilidad');
    } finally {
      setLoading(false);
    }
  }

  function generarDiasSemana(fechaReferencia) {
    const dias = [];
    // Ajustar al lunes de la semana actual (o anterior si es domingo)
    const fecha = new Date(fechaReferencia);
    fecha.setHours(0, 0, 0, 0); // Asegurar que trabajamos desde el inicio del día
    const day = fecha.getDay(); 
    const diff = fecha.getDate() - day + (day === 0 ? -6 : 1); // Lunes
    const lunes = new Date(fecha.setDate(diff));

    for (let i = 0; i < 7; i++) {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      
      // Construir fecha YYYY-MM-DD en tiempo local para evitar desfases por zona horaria
      const anio = d.getFullYear();
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const dia = String(d.getDate()).padStart(2, '0');
      const fechaFullLocal = `${anio}-${mes}-${dia}`;

      dias.push({
        nombre: DIAS_SEMANA_NOMBRES[d.getDay()],
        numero: d.getDate(),
        mes: MESES[d.getMonth()],
        fechaFull: fechaFullLocal,
        diaSemanaIndex: d.getDay() // 0=Dom, 1=Lun...
      });
    }
    return dias;
  }

  function cambiarSemana(delta) {
    const nuevaFecha = new Date(fechaInicioSemana);
    nuevaFecha.setDate(nuevaFecha.getDate() + (delta * 7));
    setFechaInicioSemana(nuevaFecha);
  }

  function generarSlots(diaInfo) {
    const { diaSemanaIndex, fechaFull } = diaInfo;
    const reglas = disponibilidades[diaSemanaIndex] || [];
    
    if (reglas.length === 0) return [];

    const slots = [];
    reglas.forEach(regla => {
      const [hIni, mIni] = regla.hora_inicio.split(':').map(Number);
      const [hFin, mFin] = regla.hora_fin.split(':').map(Number);
      
      let minutosActual = hIni * 60 + mIni;
      const minutosFin = hFin * 60 + mFin;

      while (minutosActual + duracionSeleccionada <= minutosFin) {
        const h = Math.floor(minutosActual / 60);
        const m = minutosActual % 60;
        const horaStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        
        // --- NUEVA LÓGICA DE FILTRADO TEMPORAL ---
        const now = new Date();
        const fechaSlot = new Date(`${fechaFull}T${horaStr}:00`);
        
        // Si la fecha del slot es anterior a hoy (sin contar hora), no mostrar
        // (Aunque generarDiasSemana ya maneja la semana, esto es doble seguridad)
        const fechaHoyStr = now.toISOString().split('T')[0];
        if (fechaFull < fechaHoyStr) {
           minutosActual += duracionSeleccionada;
           continue; 
        }

        // Si es el día de hoy, filtrar horas pasadas
        if (fechaFull === fechaHoyStr) {
            // Comparar timestamps completos
            if (fechaSlot < now) {
                minutosActual += duracionSeleccionada;
                continue;
            }
        }
        // -----------------------------------------

        // Verificar conflicto con citas (Superposición de rangos)
        const slotStart = minutosActual;
        const slotEnd = minutosActual + duracionSeleccionada;

        const ocupado = citasOcupadas.some(c => {
          if (c.fecha !== fechaFull) return false;
          
          // Si estamos editando, NO considerar ocupado el slot de la cita original
          if (citaEdicion && c.id === citaEdicion.id) return false;

          const [hC, mC] = c.hora.split(':').map(Number);
          const citaStart = hC * 60 + mC;
          
          let citaEnd;
          if (c.hora_fin) {
            const [hF, mF] = c.hora_fin.split(':').map(Number);
            citaEnd = hF * 60 + mF;
          } else {
            // Fallback si no hay hora_fin: asumimos 20 min (o deberíamos saber la duración real)
            citaEnd = citaStart + 20; 
          }

          // Condición de solapamiento: (StartA < EndB) && (EndA > StartB)
          return (slotStart < citaEnd) && (slotEnd > citaStart);
        });

        if (!ocupado) {
            slots.push(horaStr);
        }
        
        minutosActual += duracionSeleccionada; 
      }
    });
    return slots;
  }

  function handleSlotClick(fecha, hora) {
    setFechaSeleccionada(fecha);
    setHoraSeleccionada(hora);
  }

  function handleConfirmar() {
    if (!profesionalSeleccionado || !fechaSeleccionada || !horaSeleccionada) return;

    // Calcular hora fin
    const [h, m] = horaSeleccionada.split(':').map(Number);
    const totalMin = h * 60 + m + duracionSeleccionada;
    const hFin = Math.floor(totalMin / 60);
    const mFin = totalMin % 60;
    const horaFin = `${String(hFin).padStart(2, '0')}:${String(mFin).padStart(2, '0')}`;

    onConfirmar({
      profesional_id: profesionalSeleccionado.id,
      profesional_nombre: profesionalSeleccionado.nombre_completo,
      especialidad_id: especialidadId, // ← NUEVO
      fecha: fechaSeleccionada,
      hora_inicio: horaSeleccionada,
      hora_fin: horaFin,
      duracion: duracionSeleccionada
    });
    limpiarYCerrar();
  }

  function limpiarYCerrar() {
    setProfesionalSeleccionado(null);
    setFechaSeleccionada('');
    setHoraSeleccionada('');
    setDisponibilidades({});
    setCitasOcupadas([]);
    onClose();
  }

  function generarOpcionesDuracion() {
    const opciones = [];
    const duracion = duracionBase || 20;
    for (let i = 1; i <= 6; i++) { // Hasta 6x duracion base
      opciones.push({
        valor: duracion * i,
        texto: `${duracion * i} minutos`
      });
    }
    return opciones;
  }

  if (!open) return null;

  const diasSemana = generarDiasSemana(fechaInicioSemana);
  const opcionesDuracion = generarOpcionesDuracion();

  return (
    <div className="modal-overlay" onClick={limpiarYCerrar}>
      <div className="modal-content-agendar" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1000px', width: '95%' }}>
        {/* HEADER */}
        <div className="modal-header-agendar">
          <h3>Agendar Cita</h3>
          <button className="modal-close-x" onClick={limpiarYCerrar}>
            <FaTimes />
          </button>
        </div>

        {/* BODY */}
        <div className="modal-body-agendar" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && <div className="error-mensaje">{error}</div>}

          {/* CONTROLES SUPERIORES */}
          <div className="agendar-controles-grid">
            
            {/* 1. Motivo (Especialidad) */}
            <label className="agendar-input-group">
              <strong>Motivo Cita (Especialidad)</strong>
              <select
                value={especialidadId}
                onChange={(e) => {
                  const val = e.target.value;
                  setEspecialidadId(val);
                  if (onChangeMotivo) onChangeMotivo(val);
                  setProfesionalSeleccionado(null);
                }}
                disabled={lockSelection}
              >
                <option value="">Seleccione...</option>
                {motivosOptions.map((o) => (
                  <option key={o.v} value={o.v}>{o.t}</option>
                ))}
                {/* Fallback por si la especialidad no está en los options (ej: IMPL vs Implante) */}
                {especialidadId && !motivosOptions.find(o => o.v === especialidadId) && (
                     <option value={especialidadId}>{especialidadId}</option>
                )}
              </select>
            </label>

            {/* 2. Profesional */}
            <label className="agendar-input-group">
              <strong>Profesional</strong>
              <select
                value={profesionalSeleccionado?.id || ''}
                onChange={(e) => {
                  const profId = parseInt(e.target.value);
                  const prof = profesionales.find(p => p.id === profId);
                  setProfesionalSeleccionado(prof);
                  setFechaSeleccionada('');
                  setHoraSeleccionada('');
                }}
                disabled={!especialidadId || lockSelection}
              >
                <option value="">Seleccione...</option>
                {profesionales.map(prof => (
                  <option key={prof.id} value={prof.id}>{prof.nombre_completo}</option>
                ))}
              </select>
            </label>

            {/* 3. Duración */}
            <label className="agendar-input-group">
              <strong>Duración</strong>
              <select
                value={duracionSeleccionada}
                onChange={(e) => setDuracionSeleccionada(parseInt(e.target.value))}
              >
                {opcionesDuracion.map(opt => (
                  <option key={opt.valor} value={opt.valor}>{opt.texto}</option>
                ))}
              </select>
            </label>
          </div>

          {/* CALENDARIO SEMANAL */}
          {profesionalSeleccionado ? (
            <div className="agendar-calendario-container">
              {/* Navegación Semana */}
              <div className="agendar-nav-semana">
                <button onClick={() => cambiarSemana(-1)} className="agendar-nav-btn">
                  <FaChevronLeft /> Semana anterior
                </button>
                <span className="agendar-rango-fechas">
                    {diasSemana[0].numero} {diasSemana[0].mes} - {diasSemana[6].numero} {diasSemana[6].mes}
                </span>
                <button onClick={() => cambiarSemana(1)} className="agendar-nav-btn">
                  Semana siguiente <FaChevronRight />
                </button>
              </div>

              {/* Grid Días */}
              <div className="agendar-grid-dias">
                {diasSemana.map((dia, idx) => (
                  <div key={idx} className="agendar-dia-columna">
                    {/* Header Día */}
                    <div className={`agendar-dia-header ${dia.fechaFull === fechaSeleccionada ? 'selected' : ''} ${dia.fechaFull === new Date().toISOString().split('T')[0] ? 'today' : ''}`}>
                      <div className="agendar-dia-nombre">{dia.nombre}</div>
                      <div className="agendar-dia-numero">{dia.numero}</div>
                      <div className="agendar-dia-mes">{dia.mes}</div>
                    </div>

                    {/* Slots */}
                    <div className="agendar-slots-container">
                        {generarSlots(dia).length > 0 ? (
                            generarSlots(dia).map(hora => (
                                <button
                                    key={`${dia.fechaFull}-${hora}`}
                                    onClick={() => handleSlotClick(dia.fechaFull, hora)}
                                    className={`agendar-slot-btn ${fechaSeleccionada === dia.fechaFull && horaSeleccionada === hora ? 'selected' : ''}`}
                                >
                                    {hora}
                                </button>
                            ))
                        ) : (
                            <div className="agendar-no-disponible">
                                No disponible
                            </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="agendar-mensaje-vacio">
              Seleccione un profesional para ver su disponibilidad
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="modal-footer-agendar" style={{ justifyContent: 'space-between' }}>
          <div className="agendar-footer-info">
            {fechaSeleccionada && horaSeleccionada ? (
                <span>Seleccionado: <strong>{fechaSeleccionada}</strong> a las <strong>{horaSeleccionada}</strong></span>
            ) : 'Seleccione una fecha y hora'}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-cancelar" onClick={limpiarYCerrar}>
                Cerrar
            </button>
            <button
                className="btn-guardar"
                onClick={handleConfirmar}
                disabled={!profesionalSeleccionado || !fechaSeleccionada || !horaSeleccionada}
            >
                Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
