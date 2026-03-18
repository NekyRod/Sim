import { useState, useEffect } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { apiFetch } from '../api/client';
import { Button, Select } from './ui'; // Assuming these exist in generic UI
// If using specific UI components, imports might need adjustment based on project structure
// Reverting to standard HTML/Tailwind for layout specifics to avoid circular deps if UI components use Modals

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
  citaEdicion = null,
  lockSelection = false
}) {
  const [especialidadId, setEspecialidadId] = useState(especialidadInicial || '');
  const [profesionales, setProfesionales] = useState([]);
  const [profesionalSeleccionado, setProfesionalSeleccionado] = useState(null);
  const [duracionSeleccionada, setDuracionSeleccionada] = useState(duracionBase || 20);
  
  const [disponibilidades, setDisponibilidades] = useState({});
  const [citasOcupadas, setCitasOcupadas] = useState([]);
  const [rangosBloqueados, setRangosBloqueados] = useState([]);
  
  const [fechaInicioSemana, setFechaInicioSemana] = useState(new Date());
  
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [horaSeleccionada, setHoraSeleccionada] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      if (citaEdicion) {
        setEspecialidadId(citaEdicion.motivo_cita || '');
        setFechaSeleccionada(citaEdicion.fecha_programacion || '');
        setHoraSeleccionada(citaEdicion.hora ? citaEdicion.hora.substring(0, 5) : '');
        
        if (citaEdicion.fecha_programacion) {
          setFechaInicioSemana(new Date(citaEdicion.fecha_programacion + 'T00:00:00'));
        }
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

  useEffect(() => {
    if (open && especialidadId) {
      cargarProfesionales();
    } else {
      setProfesionales([]);
    }
  }, [open, especialidadId]);

  useEffect(() => {
    if (open && citaEdicion && profesionales.length > 0) {
      const prof = profesionales.find(p => p.id === citaEdicion.profesional_id);
      if (prof) setProfesionalSeleccionado(prof);
    }
  }, [profesionales, citaEdicion, open]);

  useEffect(() => {
    setDuracionSeleccionada(duracionBase || 20);
  }, [duracionBase]);

  useEffect(() => {
    if (profesionalSeleccionado) {
      cargarDatosCalendario();
    } else {
      setDisponibilidades({});
      setCitasOcupadas([]);
      setRangosBloqueados([]);
    }
  }, [profesionalSeleccionado, fechaInicioSemana]);

  async function cargarProfesionales() {
    setLoading(true);
    try {
      const resp = await apiFetch(`${BACKEND_URL}/profesionales/especialidad/${especialidadId}`);
      setProfesionales(resp.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Error al cargar profesionales');
    } finally {
      setLoading(false);
    }
  }

  async function cargarDatosCalendario() {
    if (!profesionalSeleccionado) return;
    setLoading(true);
    try {
      const respDisp = await apiFetch(`${BACKEND_URL}/disponibilidades/profesional/${profesionalSeleccionado.id}`);
      setDisponibilidades(respDisp.data || {});

      const dias = generarDiasSemana(fechaInicioSemana);
      const inicio = dias[0].fechaFull;
      const fin = dias[6].fechaFull;

      const respCitas = await apiFetch(`${BACKEND_URL}/citas/profesional/${profesionalSeleccionado.id}/rango?inicio=${inicio}&fin=${fin}`);
      setCitasOcupadas(respCitas.data || []);
      
      try {
        const respBloq = await apiFetch(`${BACKEND_URL}/rangos-bloqueados/rango?profesional_id=${profesionalSeleccionado.id}&inicio=${inicio}&fin=${fin}`);
        setRangosBloqueados(respBloq.data || []);
      } catch (err) {
        console.warn("No se pudieron cargar los bloqueos", err);
        setRangosBloqueados([]);
      }
      
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Error al cargar disponibilidad');
    } finally {
      setLoading(false);
    }
  }

  function generarDiasSemana(fechaReferencia) {
    const dias = [];
    const fecha = new Date(fechaReferencia);
    fecha.setHours(0, 0, 0, 0);
    const day = fecha.getDay(); 
    const diff = fecha.getDate() - day + (day === 0 ? -6 : 1); 
    const lunes = new Date(fecha.setDate(diff));

    for (let i = 0; i < 7; i++) {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      
      const anio = d.getFullYear();
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const dia = String(d.getDate()).padStart(2, '0');
      
      dias.push({
        nombre: DIAS_SEMANA_NOMBRES[d.getDay()],
        numero: d.getDate(),
        mes: MESES[d.getMonth()],
        fechaFull: `${anio}-${mes}-${dia}`,
        diaSemanaIndex: d.getDay()
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
        
        const now = new Date();
        const fechaSlot = new Date(`${fechaFull}T${horaStr}:00`);
        const fechaHoyStr = now.toISOString().split('T')[0];
        
        if (fechaFull < fechaHoyStr) {
           minutosActual += duracionSeleccionada;
           continue; 
        }
        if (fechaFull === fechaHoyStr && fechaSlot < now) {
            minutosActual += duracionSeleccionada;
            continue;
        }

        const slotStart = minutosActual;
        const slotEnd = minutosActual + duracionSeleccionada;
        const ocupado = citasOcupadas.some(c => {
          if (c.fecha !== fechaFull && c.fecha_programacion !== fechaFull) return false;
          if (citaEdicion && c.id === citaEdicion.id) return false;
          const [hC, mC] = c.hora.split(':').map(Number);
          const citaStart = hC * 60 + mC;
          let citaEnd = citaStart + 20;
          if (c.hora_fin) {
            const [hF, mF] = c.hora_fin.split(':').map(Number);
            citaEnd = hF * 60 + mF;
          }
          return (slotStart < citaEnd) && (slotEnd > citaStart);
        });

        const bloqueado = rangosBloqueados.some(b => {
          if (b.fecha !== fechaFull) return false;
          const [hB, mB] = b.hora_inicio.substring(0, 5).split(':').map(Number);
          const [hF, mF] = b.hora_fin.substring(0, 5).split(':').map(Number);
          const blockStart = hB * 60 + mB;
          const blockEnd = hF * 60 + mF;
          return (slotStart < blockEnd) && (slotEnd > blockStart);
        });

        if (!ocupado && !bloqueado) slots.push(horaStr);
        minutosActual += duracionSeleccionada; 
      }
    });
    return slots;
  }

  function handleConfirmar() {
    if (!profesionalSeleccionado || !fechaSeleccionada || !horaSeleccionada) return;
    
    const [h, m] = horaSeleccionada.split(':').map(Number);
    const totalMin = h * 60 + m + duracionSeleccionada;
    const hFin = Math.floor(totalMin / 60);
    const mFin = totalMin % 60;
    const horaFin = `${String(hFin).padStart(2, '0')}:${String(mFin).padStart(2, '0')}`;

    onConfirmar({
      profesional_id: profesionalSeleccionado.id,
      profesional_nombre: profesionalSeleccionado.nombre_completo,
      especialidad_id: especialidadId,
      fecha: fechaSeleccionada,
      hora_inicio: horaSeleccionada,
      hora_fin: horaFin,
      duracion: duracionSeleccionada
    });
    // Don't close immediately here, let parent handle or assume parent will close. 
    // Usually onConfirmar triggers something. But to be safe we can clear local state.
    setFechaSeleccionada('');
    setHoraSeleccionada('');
  }

  function limpiarYCerrar() {
    setProfesionalSeleccionado(null);
    setFechaSeleccionada('');
    setHoraSeleccionada('');
    setDisponibilidades({});
    setCitasOcupadas([]);
    setRangosBloqueados([]);
    onClose();
  }

  if (!open) return null;

  const diasSemana = generarDiasSemana(fechaInicioSemana);
  const opcionesDuracion = [];
  const duracion = duracionBase || 20;
  for (let i = 1; i <= 6; i++) opcionesDuracion.push({ valor: duracion * i, texto: `${duracion * i} min` });

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn" onClick={limpiarYCerrar}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[var(--color-brand-primary)] text-white p-4 flex justify-between items-center shrink-0">
          <h3 className="tex-lg font-bold">Agendar Nueva Cita</h3>
          <button onClick={limpiarYCerrar} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <label className="flex flex-col gap-2">
               <span className="text-sm font-bold text-gray-700">Motivo (Especialidad)</span>
               <select
                  value={especialidadId}
                  onChange={(e) => {
                    setEspecialidadId(e.target.value);
                    if (onChangeMotivo) onChangeMotivo(e.target.value);
                    setProfesionalSeleccionado(null);
                  }}
                  disabled={lockSelection}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 text-slate-800"
               >
                 <option value="">Seleccione...</option>
                 {motivosOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                 {especialidadId && !motivosOptions.find(o => o.value === especialidadId) && <option value={especialidadId}>{especialidadId}</option>}
               </select>
            </label>

            <label className="flex flex-col gap-2">
               <span className="text-sm font-bold text-gray-700">Profesional</span>
               <select
                  value={profesionalSeleccionado?.id || ''}
                  onChange={(e) => {
                    const prof = profesionales.find(p => p.id === parseInt(e.target.value));
                    setProfesionalSeleccionado(prof);
                    setFechaSeleccionada('');
                    setHoraSeleccionada('');
                  }}
                  disabled={!especialidadId || lockSelection}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 text-slate-800"
               >
                 <option value="">Seleccione...</option>
                 {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre_completo}</option>)}
               </select>
            </label>

            <label className="flex flex-col gap-2">
               <span className="text-sm font-bold text-gray-700">Duración Estimetada</span>
               <select
                  value={duracionSeleccionada}
                  onChange={(e) => setDuracionSeleccionada(parseInt(e.target.value))}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 text-slate-800"
               >
                 {opcionesDuracion.map(o => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
               </select>
            </label>
          </div>

          {/* Calendar */}
          {profesionalSeleccionado ? (
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 p-3 flex justify-between items-center border-b border-gray-200">
                <button onClick={() => cambiarSemana(-1)} className="p-2 hover:bg-white rounded-lg text-gray-500 hover:text-blue-600 transition-all shadow-sm">
                  <FaChevronLeft />
                </button>
                <div className="font-bold text-gray-700 text-sm md:text-base">
                  {diasSemana[0].numero} {diasSemana[0].mes} - {diasSemana[6].numero} {diasSemana[6].mes}
                </div>
                <button onClick={() => cambiarSemana(1)} className="p-2 hover:bg-white rounded-lg text-gray-500 hover:text-blue-600 transition-all shadow-sm">
                  <FaChevronRight />
                </button>
              </div>

              <div className="grid grid-cols-7 divide-x divide-gray-100 overflow-x-auto min-w-[700px]">
                {diasSemana.map((dia, idx) => (
                  <div key={idx} className="flex flex-col">
                    <div className={`p-2 text-center border-b border-gray-100 ${dia.fechaFull === fechaSeleccionada ? 'bg-blue-100 text-blue-800' : 'bg-white'} ${dia.fechaFull === new Date().toISOString().split('T')[0] ? 'bg-blue-50' : ''}`}>
                      <div className="text-xs text-gray-400 font-bold uppercase">{dia.nombre.substring(0,3)}</div>
                      <div className={`text-lg font-bold ${dia.fechaFull === new Date().toISOString().split('T')[0] ? 'text-blue-600' : 'text-gray-700'}`}>{dia.numero}</div>
                    </div>
                    <div className="p-2 space-y-2 max-h-[300px] overflow-y-auto">
                      {generarSlots(dia).length > 0 ? (
                        generarSlots(dia).map(hora => (
                           <button
                             key={hora}
                             onClick={() => { setFechaSeleccionada(dia.fechaFull); setHoraSeleccionada(hora); }}
                             className={`w-full text-xs py-2 px-1 rounded border transition-all ${
                               fechaSeleccionada === dia.fechaFull && horaSeleccionada === hora
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                             }`}
                           >
                             {hora}
                           </button>
                        ))
                      ) : (
                        <div className="text-[10px] text-center text-gray-300 italic py-4">No disp.</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-400">
               Seleccione un profesional para ver su disponibilidad en tiempo real.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
          <div className="text-sm text-gray-600">
             {fechaSeleccionada && horaSeleccionada ? (
               <span>
                 Asignar para el <strong className="text-blue-700">{fechaSeleccionada}</strong> a las <strong className="text-blue-700">{horaSeleccionada}</strong>
               </span>
             ) : (
               <span>Seleccione fecha y hora...</span>
             )}
          </div>
          <div className="flex gap-3">
             <Button variant="ghost" onClick={limpiarYCerrar}>Cancelar</Button>
             <Button 
                onClick={handleConfirmar} 
                disabled={!profesionalSeleccionado || !fechaSeleccionada || !horaSeleccionada}
                className="px-6"
             >
               Confirmar Cita
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
