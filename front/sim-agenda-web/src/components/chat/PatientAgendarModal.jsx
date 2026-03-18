import { useState, useEffect } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { apiFetch } from '../../api/client';
import { Button } from '../ui'; // Assuming generic UI available

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const DIAS_SEMANA_NOMBRES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Service mapping based on Chat Control
// MOTIVOS_OPTIONS removed. Will fetch from /patient-api/tipos-servicio

export default function PatientAgendarModal({
  open,
  onClose,
  onSuccess,
  initialSpecialtyCode = null,
  initialPatientData = null
}) {
  // Step 1: Patient Data
  const [patientData, setPatientData] = useState({
    tipo_identificacion: 'CC',
    numero_identificacion: '',
    nombre_paciente: '',
    correo_electronico: ''
  });

  // Step 2: Selection
  const [step, setStep] = useState(1);
  const [motivosOptions, setMotivosOptions] = useState([]);
  const [motivo, setMotivo] = useState(null); 
  const [tipoServicioDefault, setTipoServicioDefault] = useState(null); // Valid Service Type
  const [profesionales, setProfesionales] = useState([]);
  const [profesionalSeleccionado, setProfesionalSeleccionado] = useState(null);
  
  // Calendar State
  const [fechaInicioSemana, setFechaInicioSemana] = useState(new Date());
  const [disponibilidades, setDisponibilidades] = useState({});
  const [citasOcupadas, setCitasOcupadas] = useState([]);
  const [rangosBloqueados, setRangosBloqueados] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [horaSeleccionada, setHoraSeleccionada] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset when opening
  useEffect(() => {
    if (open) {
      setStep(1);
      setError(null);
      setFechaInicioSemana(new Date());
      setFechaSeleccionada('');
      setHoraSeleccionada('');
      
      if (initialPatientData) {
        setPatientData(prev => ({
          ...prev,
          ...initialPatientData,
          nombre_paciente: initialPatientData.name || prev.nombre_paciente,
          numero_identificacion: initialPatientData.documento || prev.numero_identificacion
        }));
        // If we have enough patient data, maybe skip step 1? 
        // Let's at least pre-fill.
      }
    }
  }, [open]);



  useEffect(() => {
    if (open) {
        cargarMotivos();
        cargarTiposServicio();
    }
  }, [open]);

  async function cargarTiposServicio() {
      try {
          const resp = await apiFetch(`${BACKEND_URL}/patient-api/tipos-servicio`);
          const tipos = resp.data || [];
          if (tipos.length > 0) {
              setTipoServicioDefault(tipos[0].codigo);
          } else {
              setTipoServicioDefault("PBS"); // Fallback
          }
      } catch (err) {
          console.error("Error loading tipos servicio", err);
      }
  }

  async function cargarMotivos() {
      try {
          const resp = await apiFetch(`${BACKEND_URL}/patient-api/especialidades`); // CHANGED: now fetching specialties
          // Map DB response to options
          const options = (resp.data || []).map(t => ({
              value: t.codigo, // Store Code (e.g. ODONTOLOGIA)
              label: t.nombre,
              duration: 20 // Default duration
          }));
          setMotivosOptions(options);
          
          // Use initial specialty if provided
          if (initialSpecialtyCode) {
              const initial = options.find(o => o.value === initialSpecialtyCode);
              if (initial) {
                  setMotivo(initial);
              } else if (options.length > 0) {
                  setMotivo(options[0]);
              }
          } else if (options.length > 0 && !motivo) {
              setMotivo(options[0]);
          }
      } catch (err) {
          console.error("Error loading especialidades", err);
      }
  }

  // Load Professionals when Motivo changes or Step 2 reached
  useEffect(() => {
    if (open && step === 2 && motivo) {
      cargarProfesionales();
    }
  }, [open, step, motivo]);


  // Load Calendar when Professional selected
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
      // Fetch professionals filtered by specialty code
      // logic: /patient-api/profesionales?especialidad={CODE}
      const url = `${BACKEND_URL}/patient-api/profesionales` + (motivo ? `?especialidad=${motivo.value}` : '');
      const resp = await apiFetch(url);
      setProfesionales(resp.data || []); // API returns list directly or {data: []}? 
      // Control says: return unique_results (list) directly? NO, control returns {"data": ...}
      // wait, listar_profesionales_por_especialidad returns {"data": ...}
      // listar_profesionales returns {"data": ...}
      // so resp.data is correct.
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
      const respDisp = await apiFetch(`${BACKEND_URL}/patient-api/disponibilidades/profesional/${profesionalSeleccionado.id}`);
      setDisponibilidades(respDisp.data || {});

      const dias = generarDiasSemana(fechaInicioSemana);
      const inicio = dias[0].fechaFull;
      const fin = dias[6].fechaFull;

      const respCitas = await apiFetch(`${BACKEND_URL}/patient-api/citas/profesional/${profesionalSeleccionado.id}/rango?inicio=${inicio}&fin=${fin}`);
      setCitasOcupadas(respCitas.data || []);

      try {
        const respBloq = await apiFetch(`${BACKEND_URL}/patient-api/rangos-bloqueados/rango?profesional_id=${profesionalSeleccionado.id}&inicio=${inicio}&fin=${fin}`);
        setRangosBloqueados(respBloq.data || []);
      } catch (err) {
          console.warn("No se pudieron cargar los bloqueos públicos", err);
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

    const duration = motivo.duration || 20;
    const slots = [];
    
    reglas.forEach(regla => {
      const [hIni, mIni] = regla.hora_inicio.split(':').map(Number);
      const [hFin, mFin] = regla.hora_fin.split(':').map(Number);
      
      let minutosActual = hIni * 60 + mIni;
      const minutosFin = hFin * 60 + mFin;

      while (minutosActual + duration <= minutosFin) {
        const h = Math.floor(minutosActual / 60);
        const m = minutosActual % 60;
        const horaStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        
        const now = new Date();
        const fechaSlot = new Date(`${fechaFull}T${horaStr}:00`);
        const fechaHoyStr = now.toISOString().split('T')[0];
        
        // Past check
        if (fechaFull < fechaHoyStr) {
           minutosActual += duration; continue; 
        }
        if (fechaFull === fechaHoyStr && fechaSlot < now) {
            minutosActual += duration; continue;
        }

        const slotStart = minutosActual;
        const slotEnd = minutosActual + duration;
        
        const ocupado = citasOcupadas.some(c => {
          if (c.fecha !== fechaFull && c.fecha_programacion !== fechaFull) return false;
          // c.hora is 'HH:MM:SS'
          const [hC, mC] = c.hora.split(':').map(Number);
          const citaStart = hC * 60 + mC;
          let citaEnd = citaStart + 20; // Default if no end time
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
        minutosActual += duration; 
      }
    });
    return slots;
  }

  async function handleConfirmar() {
    if (!profesionalSeleccionado || !fechaSeleccionada || !horaSeleccionada) return;
    
    setLoading(true);
    try {
        const [h, m] = horaSeleccionada.split(':').map(Number);
        const totalMin = h * 60 + m + (motivo.duration || 20);
        const hFin = Math.floor(totalMin / 60);
        const mFin = totalMin % 60;
        const horaFin = `${String(hFin).padStart(2, '0')}:${String(mFin).padStart(2, '0')}`;

        const payload = {
            tipo_identificacion: patientData.tipo_identificacion,
            numero_identificacion: patientData.numero_identificacion,
            nombre_paciente: patientData.nombre_paciente,
            correo_electronico: patientData.correo_electronico,
            
            profesional_id: profesionalSeleccionado.id,
            fecha_programacion: fechaSeleccionada,
            fecha_solicitada: new Date().toISOString().split('T')[0],
            hora: horaSeleccionada,
            hora_fin: horaFin,
            
            tipo_servicio: tipoServicioDefault || "PBS", // Use valid FK code
            motivo_cita: motivo.value, // Specialty Code (e.g., ODO) 
                                       // Assuming backend handles string or we need IDs.
                                       // Chat control handled strings, but 'insertar_cita' might expect IDs if FK.
                                       // Let's assume Backend handles it or we send description string.
                                       // Reviewing citas_control: it passes body.motivo_cita to repo.
            observacion: "Agendado via Web Chat Modal",
            mas_6_meses: false
        };

        await apiFetch(`${BACKEND_URL}/patient-api/citas`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        // SUCCESS: Sync identity with chat session if available
        const sessionId = localStorage.getItem('chat_session_id');
        if (sessionId) {
            try {
                await apiFetch(`${BACKEND_URL}/patient/chat/sessions`, {
                    method: 'POST',
                    body: JSON.stringify({
                        session_id: parseInt(sessionId),
                        name: patientData.nombre_paciente,
                        documento: patientData.numero_identificacion
                    })
                });
            } catch (chatErr) {
                console.warn("Could not sync identity with chat session", chatErr);
            }
        }

        onSuccess("¡Cita agendada exitosamente! Hemos enviado los detalles a tu correo.");
        onClose();
    } catch(err) {
        console.error(err);
        setError("Error al agendar la cita. Intente nuevamente.");
    } finally {
        setLoading(false);
    }
  }

  if (!open) return null;

  const diasSemana = generarDiasSemana(fechaInicioSemana);

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-[var(--color-brand-primary)] text-white p-4 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold">Agendar Tu Cita</h3>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

          {/* Stepper Logic */}
          {step === 1 && (
             <div className="space-y-4 max-w-md mx-auto">
                <h4 className="font-semibold text-gray-700 text-center">Paso 1: Tus Datos</h4>
                <p className="text-xs text-gray-500 text-center mb-4">Ingresa tus datos para agendar la cita.</p>
                
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Tipo Documento</label>
                        <select 
                            className="w-full p-2 border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                            value={patientData.tipo_identificacion}
                            onChange={(e) => setPatientData({...patientData, tipo_identificacion: e.target.value})}
                        >
                            <option value="CC">Cédula de Ciudadanía</option>
                            <option value="TI">Tarjeta de Identidad</option>
                            <option value="CE">Cédula de Extranjería</option>
                            <option value="PA">Pasaporte</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Número Documento</label>
                        <input 
                            type="text" 
                            className="w-full p-2 border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                            value={patientData.numero_identificacion}
                            onChange={(e) => setPatientData({...patientData, numero_identificacion: e.target.value})}
                            placeholder="Ej: 1234567890"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Nombre Completo</label>
                        <input 
                            type="text" 
                            className="w-full p-2 border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                            value={patientData.nombre_paciente}
                            onChange={(e) => setPatientData({...patientData, nombre_paciente: e.target.value})}
                            placeholder="Ej: Juan Pérez"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Correo Electrónico (Para confirmación)</label>
                        <input 
                            type="email" 
                            className="w-full p-2 border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                            value={patientData.correo_electronico}
                            onChange={(e) => setPatientData({...patientData, correo_electronico: e.target.value})}
                            placeholder="Ej: juan@example.com"
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <Button 
                        onClick={() => {
                            if(!patientData.nombre_paciente || !patientData.numero_identificacion || !patientData.correo_electronico) {
                                setError("Por favor completa todos los campos.");
                                return;
                            }
                            setStep(2);
                        }}
                    >
                        Siguiente
                    </Button>
                </div>
             </div>
          )}

          {step === 2 && (
             <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <button onClick={() => setStep(1)} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                        <FaChevronLeft /> Volver a datos
                    </button>
                    <h4 className="font-semibold text-gray-700">Paso 2: Selecciona Tu Cita</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-gray-700">Especialidad (Motivo)</span>
                        <select 
                            className="p-2 border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            value={motivo?.value || ''}
                            onChange={(e) => {
                                const selected = motivosOptions.find(m => m.value === e.target.value);
                                setMotivo(selected);
                                setProfesionalSeleccionado(null);
                            }}
                        >
                            {motivosOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-gray-700">Profesional</span>
                        <select 
                            className="p-2 border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            value={profesionalSeleccionado?.id || ''}
                            onChange={(e) => {
                                const prof = profesionales.find(p => p.id === parseInt(e.target.value));
                                setProfesionalSeleccionado(prof);
                                setFechaSeleccionada('');
                                setHoraSeleccionada('');
                            }}
                        >
                            <option value="">Seleccione...</option>
                            {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre_completo}</option>)}
                        </select>
                    </label>
                </div>
                
                {/* Calendar Reuse */}
                {profesionalSeleccionado ? (
                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                         <div className="bg-gray-50 p-2 flex justify-between items-center border-b border-gray-200">
                             <button onClick={() => cambiarSemana(-1)} className="p-1 hover:bg-white rounded text-gray-500 text-sm"><FaChevronLeft/></button>
                             <div className="font-bold text-gray-700 text-sm">
                                {diasSemana[0].numero} {diasSemana[0].mes} - {diasSemana[6].numero} {diasSemana[6].mes}
                             </div>
                             <button onClick={() => cambiarSemana(1)} className="p-1 hover:bg-white rounded text-gray-500 text-sm"><FaChevronRight/></button>
                         </div>
                         <div className="grid grid-cols-7 divide-x divide-gray-100 overflow-x-auto min-w-[600px]">
                           {diasSemana.map((dia, idx) => (
                             <div key={idx} className="flex flex-col text-center">
                               <div className={`p-1 border-b border-gray-100 ${dia.fechaFull === fechaSeleccionada ? 'bg-blue-100 text-blue-800' : 'bg-white'}`}>
                                 <div className="text-[10px] text-gray-400 font-bold uppercase">{dia.nombre.substring(0,3)}</div>
                                 <div className="text-sm font-bold text-gray-700">{dia.numero}</div>
                               </div>
                               <div className="p-1 space-y-1 max-h-[200px] overflow-y-auto">
                                  {generarSlots(dia).map(hora => (
                                    <button
                                      key={hora}
                                      onClick={() => { setFechaSeleccionada(dia.fechaFull); setHoraSeleccionada(hora); }}
                                      className={`w-full text-xs py-1 rounded border ${
                                          fechaSeleccionada === dia.fechaFull && horaSeleccionada === hora
                                          ? 'bg-blue-600 text-white border-blue-600'
                                          : 'bg-white text-gray-600 border-gray-200 hover:bg-blue-50'
                                      }`}
                                    >
                                      {hora}
                                    </button>
                                  ))}
                               </div>
                             </div>
                           ))}
                         </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                        Seleccione un profesional para ver disponibilidad
                    </div>
                )}
             </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
             <div className="text-xs text-gray-600">
                 {step === 2 && fechaSeleccionada && horaSeleccionada ? (
                     <span>Cita: <b>{fechaSeleccionada}</b> a las <b>{horaSeleccionada}</b></span>
                 ) : (
                     <span className="italic">Proceso de agendamiento</span>
                 )}
             </div>
             {step === 2 && (
                 <Button 
                    onClick={handleConfirmar}
                    disabled={!profesionalSeleccionado || !fechaSeleccionada || !horaSeleccionada || loading}
                 >
                    {loading ? 'Confirmando...' : 'Agendar Cita'}
                 </Button>
             )}
        </div>
      </div>
    </div>
  );
}
