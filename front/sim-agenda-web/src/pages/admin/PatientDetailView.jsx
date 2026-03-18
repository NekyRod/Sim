import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaUser, FaHistory, FaTimes, FaTooth,
  FaCapsules, FaChartLine, FaFileMedicalAlt, FaXRay, 
  FaSyringe, FaFileMedical, FaFileSignature, FaArrowLeft,
  FaCheckCircle
} from 'react-icons/fa';
import PatientForm from '../../components/admin/PatientForm';
import GenerarAlertaModal from '../../components/admin/GenerarAlertaModal';
import { apiFetch } from '../../api/client';
import { odontogramaApi } from '../../api/odontograma';
import { Input } from '../../components/ui';
import { showToast, showConfirm } from '../../utils/ui';
import { useAuth } from '../../context/AuthContext';
import { OdontogramBoard } from '../../components/odontograma/OdontogramBoard';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function PatientDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [loadingPaciente, setLoadingPaciente] = useState(true);
  const [activeTab, setActiveTab] = useState('datos');
  const [historia, setHistoria] = useState([]);
  const [loadingHistoria, setLoadingHistoria] = useState(false);
  const { user, profesional: profActual } = useAuth();
  
  // Anamnesis state
  const [anamnesis, setAnamnesis] = useState({ 
    antece_medicos: {
      enfermedad_actual: '',
      patologicos: '',
      farmacologicos: '',
      odontologicos: ''
    }, 
    observaciones: '',
    motivo_consulta: '',
    escala_dolor: 0,
    cie10_codigo: '',
    cie10_texto: ''
  });
  const [loadingAnamnesis, setLoadingAnamnesis] = useState(false);
  const [savingAnamnesis, setSavingAnamnesis] = useState(false);
  
  // CIE-10 para Anamnesis
  const [cie10SearchAnamnesis, setCie10SearchAnamnesis] = useState("");
  const [cie10ResultsAnamnesis, setCie10ResultsAnamnesis] = useState([]);

  const handleCie10SearchAnamnesis = async (val) => {
    setCie10SearchAnamnesis(val);
    if (val.length < 2) {
        setCie10ResultsAnamnesis([]);
        return;
    }
    try {
        const results = await odontogramaApi.searchCie10(val);
        setCie10ResultsAnamnesis(results);
    } catch (error) {
        console.error("Error searching CIE10 in anamnesis:", error);
    }
  };
  
  // Alertas
  const [showAlertaModal, setShowAlertaModal] = useState(false);

  // Edit History state
  const [editingCitaId, setEditingCitaId] = useState(null);
  const [tempObservacion, setTempObservacion] = useState('');

  // New Modules State
  const [consultas, setConsultas] = useState([]);
  const [loadingConsultas, setLoadingConsultas] = useState(false);
  const [evoluciones, setEvoluciones] = useState([]);
  const [loadingEvoluciones, setLoadingEvoluciones] = useState(false);
  const [recetas, setRecetas] = useState([]);
  const [loadingRecetas, setLoadingRecetas] = useState(false);
  const [documentos, setDocumentos] = useState([]);
  const [loadingDocumentos, setLoadingDocumentos] = useState(false);

  // Cargar info base del paciente
  useEffect(() => {
    async function loadPaciente() {
      setLoadingPaciente(true);
      try {
        const resp = await apiFetch(`${BACKEND_URL}/pacientes/${id}`);
        setPaciente(resp.data || resp);
      } catch (err) {
        console.error("Error cargando paciente:", err);
        showToast("Paciente no encontrado", "error");
        navigate("/dashboard");
      } finally {
        setLoadingPaciente(false);
      }
    }
    if (id) {
        loadPaciente();
    }
  }, [id, navigate]);

  // Efecto para cargar historia y anamnesis cuando se interactúa
  useEffect(() => {
    if (activeTab === 'historia' && paciente?.id) {
      fetchHistoria(paciente.id);
    }
    if (activeTab === 'anamnesis' && paciente?.id) {
      fetchAnamnesis(paciente.id);
    }
    if (activeTab === 'consulta' && paciente?.id) {
      fetchConsultas(paciente.id);
    }
    if (activeTab === 'evoluciones' && paciente?.id) {
      fetchEvoluciones(paciente.id);
    }
    if (activeTab === 'rx_docs' && paciente?.id) {
      fetchDocumentos(paciente.id);
    }
    if (activeTab === 'recetas' && paciente?.id) {
      fetchRecetas(paciente.id);
    }
  }, [activeTab, paciente]);

  async function fetchHistoria(id) {
    setLoadingHistoria(true);
    let timelineItems = [];
    try {
      // 1. Fetch Citas
      try {
        const respCitas = await apiFetch(`${BACKEND_URL}/citas/paciente/${id}`);
        const citasData = (respCitas.data || respCitas || []);
        const mapCitas = citasData.map(c => ({
           ...c,
           _tipo: 'CITA',
           _fechaStr: c.fecha_programacion + ' ' + (c.hora || '00:00:00')
        }));
        timelineItems = [...timelineItems, ...mapCitas];
      } catch (citaErr) {
        console.error("Error fetching citas:", citaErr);
      }

      // 2. Fetch Odontograma Timeline
      try {
         const respOdonto = await odontogramaApi.getTimeline(id);
         const odontoData = (respOdonto.data || respOdonto || []);
         const mapOdonto = odontoData.map(o => ({
            ...o,
            _tipo: 'ODONTOGRAMA',
            _fechaStr: o.updated_at || o.created_at || '1970-01-01 00:00:00'
         }));
         timelineItems = [...timelineItems, ...mapOdonto];
      } catch (odontoErr) {
         console.error("Error fetching odontograma timeline:", odontoErr);
      }

      // 3. Fetch Consultas
      try {
        const respConsultas = await apiFetch(`${BACKEND_URL}/pacientes/${id}/consultas`);
        const cData = respConsultas || [];
        timelineItems = [...timelineItems, ...cData.map(x => ({ ...x, _tipo: 'CONSULTA', _fechaStr: x.fecha_consulta }))];
      } catch (e) {}

      // 4. Fetch Evoluciones
      try {
        const respEvol = await apiFetch(`${BACKEND_URL}/pacientes/${id}/evoluciones`);
        const eData = respEvol || [];
        timelineItems = [...timelineItems, ...eData.map(x => ({ ...x, _tipo: 'EVOLUCION', _fechaStr: x.fecha_evolucion }))];
      } catch (e) {}

      // 5. Fetch Recetas
      try {
        const respRec = await apiFetch(`${BACKEND_URL}/pacientes/${id}/recetas`);
        const rData = respRec || [];
        timelineItems = [...timelineItems, ...rData.map(x => ({ ...x, _tipo: 'RECETA', _fechaStr: x.fecha_receta }))];
      } catch (e) {}

      // 6. Fetch Documentos
      try {
        const respDoc = await apiFetch(`${BACKEND_URL}/pacientes/${id}/documentos`);
        const dData = respDoc || [];
        timelineItems = [...timelineItems, ...dData.map(x => ({ ...x, _tipo: 'DOCUMENTO', _fechaStr: x.fecha_subida }))];
      } catch (e) {}

      // Ordenar todo descendente cronológicamente
      timelineItems.sort((a, b) => new Date(b._fechaStr) - new Date(a._fechaStr));
      setHistoria(timelineItems);
      
    } catch (err) {
      console.error("Global history fetch error:", err);
      showToast('Error cargando historia clínica', 'error');
    } finally {
      setLoadingHistoria(false);
    }
  }

  async function fetchConsultas(id) {
    setLoadingConsultas(true);
    try {
      const resp = await apiFetch(`${BACKEND_URL}/pacientes/${id}/consultas`);
      setConsultas(resp || []);
    } catch (err) { console.error(err); }
    finally { setLoadingConsultas(false); }
  }

  async function fetchEvoluciones(id) {
    setLoadingEvoluciones(true);
    try {
      const resp = await apiFetch(`${BACKEND_URL}/pacientes/${id}/evoluciones`);
      setEvoluciones(resp || []);
    } catch (err) { console.error(err); }
    finally { setLoadingEvoluciones(false); }
  }

  async function fetchDocumentos(id) {
    setLoadingDocumentos(true);
    try {
      const resp = await apiFetch(`${BACKEND_URL}/pacientes/${id}/documentos`);
      setDocumentos(resp || []);
    } catch (err) { console.error(err); }
    finally { setLoadingDocumentos(false); }
  }

  async function fetchRecetas(id) {
    setLoadingRecetas(true);
    try {
      const resp = await apiFetch(`${BACKEND_URL}/pacientes/${id}/recetas`);
      setRecetas(resp || []);
    } catch (err) { console.error(err); }
    finally { setLoadingRecetas(false); }
  }

  async function fetchAnamnesis(id) {
    setLoadingAnamnesis(true);
    try {
      const resp = await apiFetch(`${BACKEND_URL}/pacientes/${id}/anamnesis`);
      if (resp) {
          setAnamnesis({
              antece_medicos: resp.antece_medicos || {},
              observaciones: resp.observaciones || '',
              motivo_consulta: resp.motivo_consulta || '',
              escala_dolor: resp.escala_dolor || 0,
              cie10_codigo: resp.cie10_codigo || '',
              cie10_texto: resp.cie10_texto || ''
          });
          if (resp.cie10_codigo) {
            setCie10SearchAnamnesis(`${resp.cie10_codigo} - ${resp.cie10_texto}`);
          }
      }
    } catch (err) {
      console.error(err);
      // If 404/empty, we keep default state
    } finally {
      setLoadingAnamnesis(false);
    }
  }

  async function saveAnamnesis() {
    setSavingAnamnesis(true);
    try {
        await apiFetch(`${BACKEND_URL}/pacientes/${paciente.id}/anamnesis`, {
            method: 'PUT',
            body: JSON.stringify({
              ...anamnesis,
              registrado_por: user?.username || 'admin'
            })
        });
        showToast('Anamnesis guardada correctamente');
    } catch (err) {
        console.error(err);
        showToast('Error al guardar anamnesis', 'error');
    } finally {
        setSavingAnamnesis(false);
    }
  }

  async function saveObservacionCita(citaId) {
    try {
        await apiFetch(`${BACKEND_URL}/citas/${citaId}/observacion`, {
            method: 'PUT',
            body: JSON.stringify({ observacion: tempObservacion })
        });
        showToast('Observación actualizada');
        setEditingCitaId(null);
        fetchHistoria(paciente.id); // Refresh
    } catch (err) {
        console.error(err);
        showToast('Error al actualizar observación', 'error');
    }
  }

  function toggleAntecedente(key) {
      setAnamnesis(prev => ({
          ...prev,
          antece_medicos: {
              ...prev.antece_medicos,
              [key]: !prev.antece_medicos[key]
          }
      }));
  }

  async function handleEliminarCita(citaId) {
      const confirmed = await showConfirm('¿Deseas eliminar esta cita de la historia clínica?');
      if (!confirmed) return;
      try {
          await apiFetch(`${BACKEND_URL}/citas/${citaId}`, { method: 'DELETE' });
          showToast('Cita eliminada');
          fetchHistoria(paciente.id);
      } catch (err) {
          console.error(err);
          showToast('Error al eliminar cita', 'error');
      }
  }

  async function handleEliminarOdontograma(id) {
      const confirmed = await showConfirm('¿Estás seguro de eliminar este registro del odontograma? Esta acción no se puede deshacer.');
      if (!confirmed) return;

      try {
          await odontogramaApi.eliminarOdontograma(id);
          showToast('Registro eliminado');
          fetchHistoria(paciente.id);
      } catch (err) {
          console.error(err);
          showToast('Error al eliminar', 'error');
      }
  }

  // Save Handlers for New Modules
  async function handleSaveConsulta(data) {
    try {
      await apiFetch(`${BACKEND_URL}/pacientes/consultas`, {
        method: 'POST',
        body: JSON.stringify({ ...data, paciente_id: paciente.id, registrado_por: user?.username, profesional_id: profActual?.id })
      });
      showToast('Consulta guardada');
      fetchConsultas(paciente.id);
      fetchHistoria(paciente.id);
    } catch (e) { showToast('Error al guardar consulta', 'error'); }
  }

  async function handleSaveEvolucion(nota) {
    try {
      await apiFetch(`${BACKEND_URL}/pacientes/evoluciones`, {
        method: 'POST',
        body: JSON.stringify({ paciente_id: paciente.id, nota, registrado_por: user?.username, profesional_id: profActual?.id })
      });
      showToast('Evolución guardada');
      fetchEvoluciones(paciente.id);
      fetchHistoria(paciente.id);
    } catch (e) { showToast('Error al guardar evolución', 'error'); }
  }

  async function handleSaveReceta(data) {
    try {
      await apiFetch(`${BACKEND_URL}/pacientes/recetas`, {
        method: 'POST',
        body: JSON.stringify({ ...data, paciente_id: paciente.id, registrado_por: user?.username, profesional_id: profActual?.id })
      });
      showToast('Receta guardada');
      fetchRecetas(paciente.id);
      fetchHistoria(paciente.id);
    } catch (e) { showToast('Error al guardar receta', 'error'); }
  }

  async function handleUploadDoc(formData) {
    try {
      formData.append('registrado_por', user?.username || 'admin');
      if (profActual?.id) formData.append('profesional_id', profActual.id);

      const resp = await fetch(`${BACKEND_URL}/pacientes/${paciente.id}/documentos/upload`, {
        method: 'POST',
        body: formData
        // Note: apiFetch might not handle FormData correctly depending on its implementation
      });
      if (!resp.ok) throw new Error('Upload failed');
      showToast('Documento subido');
      fetchDocumentos(paciente.id);
      fetchHistoria(paciente.id);
    } catch (e) { showToast('Error al subir documento', 'error'); }
  }

  async function handleDeleteItem(tipo, id) {
    const confirmed = await showConfirm(`¿Estás seguro de eliminar este registro de ${tipo}?`);
    if (!confirmed) return;
    try {
      let url = "";
      if (tipo === 'CONSULTA') url = `${BACKEND_URL}/pacientes/consultas/${id}`;
      if (tipo === 'EVOLUCION') url = `${BACKEND_URL}/pacientes/evoluciones/${id}`;
      if (tipo === 'RECETA') url = `${BACKEND_URL}/pacientes/recetas/${id}`;
      if (tipo === 'DOCUMENTO') url = `${BACKEND_URL}/pacientes/documentos/${id}`;
      
      await apiFetch(url, { method: 'DELETE' });
      showToast('Registro eliminado');
      if (tipo === 'CONSULTA') fetchConsultas(paciente.id);
      if (tipo === 'EVOLUCION') fetchEvoluciones(paciente.id);
      if (tipo === 'RECETA') fetchRecetas(paciente.id);
      if (tipo === 'DOCUMENTO') fetchDocumentos(paciente.id);
      fetchHistoria(paciente.id);
    } catch (e) { showToast('Error al eliminar', 'error'); }
  }

  if (loadingPaciente) return <div className="p-8 text-center text-gray-500">Cargando expediente del paciente...</div>;
  if (!paciente) return <div className="p-8 text-center text-red-500">Expediente no encontrado.</div>;

  return (
    <>
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-gray-50">
          {/* Static Header: Datos Personales */}
          <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0 shadow-sm z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                 <button 
                  onClick={() => navigate(-1)}
                  className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors border border-gray-200 shadow-sm"
                  title="Volver"
                 >
                   <FaArrowLeft />
                 </button>
                 <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                   <FaUser className="text-blue-600 ml-2" />
                   Expediente Clínico
                 </h2>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
              <div className="space-y-3">
                <div>
                  <div className="text-gray-500 font-medium text-xs uppercase tracking-wider">Nombre Completo</div>
                  <div className="font-semibold text-gray-800">{paciente.nombre_completo}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-medium text-xs uppercase tracking-wider">Número Documento</div>
                  <div className="font-semibold text-gray-800">{paciente.tipo_identificacion} {paciente.numero_identificacion}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-medium text-xs uppercase tracking-wider">Fecha Nacimiento</div>
                  <div className="font-semibold text-gray-800">{paciente.fecha_nacimiento || '-'}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-gray-500 font-medium text-xs uppercase tracking-wider">Teléfono</div>
                  <div className="font-semibold text-gray-800">{paciente.telefono_fijo || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-medium text-xs uppercase tracking-wider">Teléfono Celular</div>
                  <div className="font-semibold text-gray-800">{paciente.telefono_celular || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-medium text-xs uppercase tracking-wider">Correo Electrónico</div>
                  <div className="font-semibold text-gray-800">{paciente.correo_electronico || '-'}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-gray-500 font-medium text-xs uppercase tracking-wider">Lugar de Residencia</div>
                  <div className="font-semibold text-gray-800">{paciente.lugar_residencia || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-medium text-xs uppercase tracking-wider">Segundo Celular</div>
                  <div className="font-semibold text-gray-800">{paciente.segundo_telefono_celular || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-medium text-xs uppercase tracking-wider">A quién pertenece</div>
                  <div className="font-semibold text-gray-800">{paciente.titular_segundo_celular || '-'}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-gray-500 font-medium text-xs uppercase tracking-wider">Acompañante</div>
                  <div className="font-semibold text-gray-800">{paciente.nombre_acompanante || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-medium text-xs uppercase tracking-wider">Parentesco</div>
                  <div className="font-semibold text-gray-800">{paciente.parentesco_acompanante || '-'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-white overflow-x-auto flex-shrink-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 pb-1">
             <TabButton active={activeTab === 'datos'} onClick={() => setActiveTab('datos')} icon={<FaUser />} label="Datos Personales" />
             <TabButton active={activeTab === 'historia'} onClick={() => setActiveTab('historia')} icon={<FaHistory />} label="Historia Clínica" />
             <TabButton active={activeTab === 'consulta'} onClick={() => setActiveTab('consulta')} icon={<FaCapsules />} label="Consulta de atención" />
             <TabButton active={activeTab === 'evoluciones'} onClick={() => setActiveTab('evoluciones')} icon={<FaChartLine />} label="Evoluciones" />
             <TabButton active={activeTab === 'anamnesis'} onClick={() => setActiveTab('anamnesis')} icon={<FaFileMedicalAlt />} label="Ficha Anamnesis" />
             <TabButton active={activeTab === 'odontograma'} onClick={() => setActiveTab('odontograma')} icon={<FaTooth />} label="Odontograma" />
             <TabButton active={activeTab === 'rx_docs'} onClick={() => setActiveTab('rx_docs')} icon={<FaXRay />} label="Rx y Documentos" />
             <TabButton active={activeTab === 'recetas'} onClick={() => setActiveTab('recetas')} icon={<FaSyringe />} label="Recetas" />
             <TabButton active={activeTab === 'docs_clinicos'} onClick={() => setActiveTab('docs_clinicos')} icon={<FaFileMedical />} label="Documentos clínicos" />
             <TabButton active={activeTab === 'consentimientos'} onClick={() => setActiveTab('consentimientos')} icon={<FaFileSignature />} label="Consentimientos" />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
            
            {activeTab === 'datos' && (
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-fadeIn">
                <PatientForm 
                  initialData={paciente} 
                  onSuccess={() => showToast('Datos actualizados')}
                  ismodal
                />
              </div>
            )}

            {activeTab === 'historia' && (
              <div className="space-y-4 animate-fadeIn">
                {loadingHistoria ? (
                  <div className="text-center p-8 text-gray-500">Cargando historia...</div>
                ) : historia.length === 0 ? (
                  <div className="text-center p-12 bg-white rounded-xl border border-gray-100 text-gray-400">
                    <FaHistory className="text-4xl mx-auto mb-3 opacity-20" />
                    <p>No hay registros clínicos para este paciente.</p>
                  </div>
                ) : (
                  <div className="relative border-l-2 border-blue-100 ml-3 space-y-8 py-2">
                    {historia.map((item, index) => {
                      if (item._tipo === 'ODONTOGRAMA') {
                        // ==== CARD DE ODONTOGRAMA ====
                        const dateObj = new Date(item.updated_at || item.created_at);
                        const displayDate = dateObj.toLocaleDateString();
                        const displayTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const isFinal = item.estado?.toUpperCase() === 'FINALIZADO';
                        
                        return (
                          <div key={`odonto-${item.id || index}`} className="relative pl-8">
                            {/* Dot Odontograma */}
                            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                              isFinal ? 'bg-purple-600' : 'bg-yellow-400'
                            }`} />
                            <div className="bg-gradient-to-br from-white to-purple-50 p-4 rounded-xl border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                        isFinal ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        ODONTOGRAMA {isFinal ? 'FINALIZADO' : 'BORRADOR'}
                                      </span>
                                      <h4 className="font-bold text-gray-800 mt-1 flex items-center gap-2">
                                        <FaTooth className="text-purple-400" />
                                        Evolución Dental
                                      </h4>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <div className="text-right text-xs text-gray-500">
                                        <div className="font-semibold">{displayDate}</div>
                                        <div>{displayTime}</div>
                                      </div>
                                      <button 
                                        onClick={() => handleEliminarOdontograma(item.id)}
                                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                        title="Eliminar registro"
                                      >
                                          <FaTimes />
                                      </button>
                                  </div>
                                </div>
                                
                                <div className="mt-3 pt-3 border-t border-purple-100/50">
                                   {item.dientes && item.dientes.length > 0 ? (
                                      <ul className="text-sm text-gray-700 space-y-1">
                                        {item.dientes.map((d, dIdx) => (
                                          <li key={dIdx} className="flex items-center gap-2">
                                            <span className="font-bold bg-white text-gray-600 px-1.5 rounded text-xs border">FDI {d.fdi}</span>
                                            <span>
                                               Cara {d.cara_nombre || d.cara ? <span className="text-blue-600 font-semibold">{d.cara_nombre || d.cara}</span> : <span className="text-purple-600 font-semibold text-xs">DIENTE COMPLETO</span>}: 
                                               {" "} {d.procedimiento_nombre}
                                            </span>
                                            {d.evolucion_porcentaje !== undefined && (
                                              <span className="text-[10px] px-1.5 py-0.5 rounded-full border ${d.evolucion_porcentaje === 100 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'} ml-1 font-bold">
                                                {d.evolucion_porcentaje}%
                                              </span>
                                            )}
                                          </li>
                                        ))}
                                      </ul>
                                   ) : (
                                     <p className="text-sm text-gray-500 italic">No hay tratamientos aplicados en esta sesión.</p>
                                   )}
                                </div>
                                <div className="text-xs text-gray-400 flex gap-4 mt-2">
                                  <span>Médico Tratante: <span className="text-gray-600 font-medium">{item.profesional_nombre || item.medico_id || item.profesional_id}</span></span>
                                </div>
                            </div>
                          </div>
                        );
                      }

                      // ==== CARD DE CITA NORMAL ====
                      if (item._tipo === 'CITA') {
                        return (
                        <div key={`cita-${item.id}`} className="relative pl-8">
                          <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                            item.estado === 'ATENDIDA' ? 'bg-green-500' : 
                            item.estado === 'CANCELADA' ? 'bg-red-400' : 'bg-blue-400'
                          }`} />
                          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                    item.estado === 'ATENDIDA' ? 'bg-green-100 text-green-700' :
                                    item.estado === 'CANCELADA' ? 'bg-red-100 text-red-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>{item.estado || 'PROGRAMADA'}</span>
                                  <h4 className="font-bold text-gray-800 mt-1">Cita Odontológica - {item.motivo_cita || 'Consulta General'}</h4>
                              </div>
                              <div className="flex items-center gap-4">
                                  <div className="text-right text-xs text-gray-500">
                                    <div className="font-semibold">{item.fecha_programacion}</div>
                                    <div>{item.hora}</div>
                                  </div>
                                  <button onClick={() => handleEliminarCita(item.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1"><FaTimes /></button>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-50">
                               {editingCitaId === item.id ? (
                                   <div className="animate-fadeIn">
                                       <textarea className="w-full border rounded p-2 text-sm" rows={2} value={tempObservacion} onChange={e => setTempObservacion(e.target.value)} />
                                       <div className="flex justify-end gap-2 mt-2">
                                           <button onClick={() => setEditingCitaId(null)} className="text-xs text-gray-500">Cancelar</button>
                                           <button onClick={() => saveObservacionCita(item.id)} className="text-xs bg-blue-600 text-white px-3 py-1 rounded">Guardar</button>
                                       </div>
                                   </div>
                               ) : (
                                   <div className="group cursor-pointer hover:bg-blue-50 p-2 -mx-2 rounded transition-colors" onClick={() => { setEditingCitaId(item.id); setTempObservacion(item.observacion || ''); }}>
                                      <p className="text-sm text-gray-600 min-h-[1.5em]">{item.observacion || <span className="text-gray-400 italic">Clic para agregar notas clínicas...</span>}</p>
                                   </div>
                               )}
                            </div>
                          </div>
                        </div>
                      )}

                      // ==== CARD DE CONSULTA ====
                      if (item._tipo === 'CONSULTA') {
                        return (
                          <div key={`cons-${item.id}`} className="relative pl-8">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm bg-blue-600" />
                            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                              <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase mb-1">
                                <span>Consulta de Atención</span>
                                <span>{new Date(item.fecha_consulta).toLocaleString()}</span>
                              </div>
                              <h4 className="font-bold text-gray-800 text-sm">Motivo: {item.motivo}</h4>
                              <p className="text-xs text-gray-600 mt-2">{item.plan_tratamiento}</p>
                              <div className="mt-2 text-[9px] text-gray-400">Dr. {item.profesional_nombre}</div>
                            </div>
                          </div>
                        )
                      }

                      // ==== CARD DE EVOLUCION ====
                      if (item._tipo === 'EVOLUCION') {
                        return (
                          <div key={`evol-${item.id}`} className="relative pl-8">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm bg-indigo-500" />
                            <div className="bg-gradient-to-r from-indigo-50 to-white p-4 rounded-xl border border-indigo-100 shadow-sm border-l-4 border-l-indigo-400">
                               <div className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mb-1">Evolución Clínica / Nota de Progreso</div>
                               <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{item.nota}</p>
                               <div className="mt-3 flex justify-between items-center text-[10px] text-gray-400">
                                  <span className="font-bold">{new Date(item.fecha_evolucion).toLocaleString()}</span>
                                  <span>{item.profesional_nombre}</span>
                               </div>
                            </div>
                          </div>
                        )
                      }

                      // ==== CARD DE RECETA ====
                      if (item._tipo === 'RECETA') {
                        return (
                          <div key={`rec-${item.id}`} className="relative pl-8">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm bg-green-500" />
                            <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm">
                               <div className="flex items-center gap-2 mb-2">
                                  <FaCapsules className="text-green-500" />
                                  <span className="text-[10px] font-bold text-green-700">RECETA MÉDICA</span>
                               </div>
                               <ul className="text-xs space-y-1">
                                  {(item.medicamentos || []).map((m, mi) => (
                                    <li key={mi} className="border-b border-gray-50 pb-1"><strong>{m.nombre}</strong> — {m.dosis}</li>
                                  ))}
                               </ul>
                               <div className="mt-2 text-[10px] text-gray-400 text-right">{new Date(item.fecha_receta).toLocaleDateString()}</div>
                            </div>
                          </div>
                        )
                      }

                      // ==== CARD DE DOCUMENTO ====
                      if (item._tipo === 'DOCUMENTO') {
                        return (
                          <div key={`doc-${item.id}`} className="relative pl-8">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm bg-gray-400" />
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center gap-3">
                               <div className="bg-white p-2 rounded shadow-sm"><FaXRay className="text-gray-400" /></div>
                               <div>
                                  <div className="text-[10px] font-bold text-gray-500 uppercase">{item.tipo_documento}</div>
                                  <div className="text-xs font-bold text-blue-600 cursor-pointer hover:underline" onClick={() => window.open(`${BACKEND_URL}${item.url_archivo}`, '_blank')}>
                                    {item.nombre_archivo}
                                  </div>
                               </div>
                               <div className="ml-auto text-[9px] text-gray-400">{new Date(item.fecha_subida).toLocaleDateString()}</div>
                            </div>
                          </div>
                        )
                      }

                      return null;
})}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'anamnesis' && (
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-fadeIn">
                 {loadingAnamnesis ? (
                     <div className="text-center py-12 text-gray-500">Cargando anamnesis...</div>
                 ) : (
                     <div className="space-y-6">
                        <div className="flex justify-between items-center border-b pb-4">
                           <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2 uppercase tracking-wide">
                               ANAMNESIS
                           </h3>
                        </div>
                        
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Columna Izquierda: Motivo y Antecedentes */}
                            <div className="space-y-4">
                              <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 flex items-center gap-1.5">
                                    MOTIVO DE CONSULTA *
                                </label>
                                <textarea 
                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                                    placeholder="Describa el motivo principal..."
                                    value={anamnesis.motivo_consulta}
                                    onChange={e => setAnamnesis(prev => ({ ...prev, motivo_consulta: e.target.value }))}
                                ></textarea>
                              </div>

                              <div>
                                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">ENFERMEDAD ACTUAL *</label>
                                 <textarea 
                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                                    value={anamnesis.antece_medicos?.enfermedad_actual || ''}
                                    onChange={e => setAnamnesis(prev => ({ ...prev, antece_medicos: { ...prev.antece_medicos, enfermedad_actual: e.target.value } }))}
                                 ></textarea>
                              </div>
                            </div>

                            {/* Columna Derecha: Dolor y CIE-10 */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-3 flex justify-between">
                                        <span>Escala de Dolor (EVA) *</span>
                                        <span className={`text-sm font-black ${(anamnesis.escala_dolor || 0) > 7 ? 'text-red-500' : (anamnesis.escala_dolor || 0) > 3 ? 'text-orange-500' : 'text-green-500'}`}>
                                            {anamnesis.escala_dolor || 0} / 10
                                        </span>
                                    </label>
                                    <input 
                                        type="range" min="0" max="10" 
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        value={anamnesis.escala_dolor || 0}
                                        onChange={(e) => setAnamnesis({ ...anamnesis, escala_dolor: parseInt(e.target.value) })}
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase mt-1">
                                        <span>Sin Dolor</span>
                                        <span>Moderado</span>
                                        <span>Severo</span>
                                    </div>
                                </div>

                                <div className="relative">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">DIAGNÓSTICO CIE-10 *</label>
                                    <div className="relative">
                                        <Input 
                                            placeholder="Buscar código CIE-10..."
                                            value={cie10SearchAnamnesis}
                                            onChange={(e) => handleCie10SearchAnamnesis(e.target.value)}
                                            className="text-sm"
                                        />
                                        {anamnesis.cie10_codigo && (
                                            <FaCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                                        )}
                                    </div>
                                    {cie10ResultsAnamnesis.length > 0 && (
                                        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-[180px] overflow-y-auto">
                                            {cie10ResultsAnamnesis.map(item => (
                                                <div 
                                                    key={item.codigo}
                                                    onClick={() => {
                                                        setAnamnesis({ ...anamnesis, cie10_codigo: item.codigo, cie10_texto: item.nombre });
                                                        setCie10ResultsAnamnesis([]);
                                                        setCie10SearchAnamnesis(`${item.codigo} - ${item.nombre}`);
                                                    }}
                                                    className="p-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-50"
                                                >
                                                    <div className="font-bold text-blue-600 text-[10px]">{item.codigo}</div>
                                                    <div className="text-xs text-gray-700">{item.nombre}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">PATOLÓGICOS</label>
                                <textarea className="w-full border rounded p-2 text-sm min-h-[80px]" value={anamnesis.antece_medicos?.patologicos || ''} onChange={e => setAnamnesis(prev => ({ ...prev, antece_medicos: { ...prev.antece_medicos, patologicos: e.target.value } }))}></textarea>
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">FARMACOLÓGICOS</label>
                                <textarea className="w-full border rounded p-2 text-sm min-h-[80px]" value={anamnesis.antece_medicos?.farmacologicos || ''} onChange={e => setAnamnesis(prev => ({ ...prev, antece_medicos: { ...prev.antece_medicos, farmacologicos: e.target.value } }))}></textarea>
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">ODONTOLÓGICOS</label>
                                <textarea className="w-full border rounded p-2 text-sm min-h-[80px]" value={anamnesis.antece_medicos?.odontologicos || ''} onChange={e => setAnamnesis(prev => ({ ...prev, antece_medicos: { ...prev.antece_medicos, odontologicos: e.target.value } }))}></textarea>
                             </div>
                          </div>
                        </div>
    
                        <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                           <button 
                                onClick={() => setShowAlertaModal(true)}
                                className="px-6 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 font-bold transition-colors"
                           >
                              Generar Alerta
                           </button>
                           <button 
                                onClick={saveAnamnesis}
                                disabled={savingAnamnesis}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all"
                           >
                              {savingAnamnesis ? 'Guardando...' : 'Agregar a la Historia clínica'}
                           </button>
                        </div>
                     </div>
                 )}
              </div>
            )}

            {activeTab === 'odontograma' && (
              <div className="bg-white p-12 rounded-xl border border-gray-100 shadow-sm animate-fadeIn text-center flex flex-col items-center justify-center">
                 <div className="bg-blue-50 p-6 rounded-full mb-6">
                    <FaTooth className="text-6xl text-blue-500" />
                 </div>
                 <h3 className="text-2xl font-bold text-gray-800 mb-2">Panel de Odontograma</h3>
                 <p className="text-gray-500 max-w-md mb-8">
                    Para una mejor experiencia y cumplimiento de los estándares clínicos, el odontograma se gestiona en una vista dedicada a pantalla completa.
                 </p>
                 <button 
                  onClick={() => navigate(`/pacientes/${paciente.id}/odontograma`)}
                  className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center gap-3 transform hover:scale-105 active:scale-95"
                 >
                    <FaTooth />
                    Abrir Odontograma
                 </button>
              </div>
            )}
            
            {activeTab === 'consulta' && (
              <ConsultaTab 
                consultas={consultas} 
                onSave={handleSaveConsulta} 
                onDelete={handleDeleteItem}
                loading={loadingConsultas}
              />
            )}

            {activeTab === 'evoluciones' && (
              <EvolucionTab 
                evoluciones={evoluciones} 
                onSave={handleSaveEvolucion} 
                onDelete={handleDeleteItem}
                loading={loadingEvoluciones}
              />
            )}

            {activeTab === 'rx_docs' && (
              <DocumentosTab 
                documentos={documentos} 
                onUpload={handleUploadDoc} 
                onDelete={handleDeleteItem}
                loading={loadingDocumentos}
              />
            )}

            {activeTab === 'recetas' && (
              <RecetaTab 
                recetas={recetas} 
                onSave={handleSaveReceta} 
                onDelete={handleDeleteItem}
                loading={loadingRecetas}
              />
            )}

            {['docs_clinicos', 'consentimientos'].includes(activeTab) && (
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-fadeIn text-center py-20 flex flex-col items-center justify-center">
                 <div className="text-gray-300 text-6xl mb-4">
                    {activeTab === 'docs_clinicos' && <FaFileMedical />}
                    {activeTab === 'consentimientos' && <FaFileSignature />}
                 </div>
                 <h3 className="text-2xl font-bold text-gray-400 mb-2 uppercase tracking-wider">Módulo en Desarrollo</h3>
                 <p className="text-gray-500 max-w-md">Esta sección estará disponible en próximas versiones del sistema.</p>
              </div>
            )}

          </div>
    </div>
      
    {showAlertaModal && (
      <GenerarAlertaModal 
        pacienteId={paciente.id} 
        onClose={() => setShowAlertaModal(false)}
      />
    )}
    </>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
        active 
          ? 'border-blue-600 text-blue-700 bg-blue-50/80 shadow-inner' 
          : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100 hover:border-gray-300'
      }`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  );
}

// --- SUB-COMPONENTS FOR TABS ---

function ConsultaTab({ consultas, onSave, onDelete, loading }) {
  const [formData, setFormData] = useState({ motivo: '', enfermedad_actual: '', diagnostico_cie10_codigo: '', diagnostico_cie10_texto: '', plan_tratamiento: '', observaciones: '' });
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async (val) => {
    setSearch(val);
    if (val.length < 2) { setResults([]); return; }
    try {
      const res = await odontogramaApi.searchCie10(val);
      setResults(res);
    } catch (e) { console.error(e); }
  };
  
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">Nueva Consulta / Atención</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">MOTIVO DE CONSULTA</label>
              <textarea className="w-full border rounded-lg p-2 text-sm" rows={2} value={formData.motivo} onChange={e => setFormData({...formData, motivo: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 text-blue-600">DIAGNÓSTICO CIE-10</label>
              <div className="relative">
                <input 
                  className="w-full border rounded-lg p-2 text-sm" 
                  placeholder="Buscar código o nombre..." 
                  value={search} 
                  onChange={e => handleSearch(e.target.value)} 
                />
                {results.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border rounded-lg shadow-xl max-h-40 overflow-y-auto">
                    {results.map(r => (
                      <div 
                        key={r.codigo} 
                        className="p-2 hover:bg-blue-50 cursor-pointer border-b text-xs"
                        onClick={() => {
                          setFormData({ ...formData, diagnostico_cie10_codigo: r.codigo, diagnostico_cie10_texto: r.nombre });
                          setSearch(`${r.codigo} - ${r.nombre}`);
                          setResults([]);
                        }}
                      >
                        <span className="font-bold text-blue-600">{r.codigo}</span> - {r.nombre}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">PLAN DE TRATAMIENTO</label>
              <textarea className="w-full border rounded-lg p-2 text-sm" rows={2} value={formData.plan_tratamiento} onChange={e => setFormData({...formData, plan_tratamiento: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">OBSERVACIONES</label>
              <textarea className="w-full border rounded-lg p-2 text-sm" rows={2} value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} />
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button 
            onClick={() => { onSave(formData); setFormData({ motivo: '', enfermedad_actual: '', diagnostico_cie10_codigo: '', diagnostico_cie10_texto: '', plan_tratamiento: '', observaciones: '' }); setSearch(""); }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700"
          >
            Guardar Consulta
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-gray-600">Historial de Consultas</h3>
        {loading ? <p>Cargando...</p> : consultas.map(c => (
          <div key={c.id} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm relative group">
            <button onClick={() => onDelete('CONSULTA', c.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 hidden group-hover:block"><FaTimes /></button>
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>{new Date(c.fecha_consulta).toLocaleString()}</span>
              <span>Dr. {c.profesional_nombre || 'No asignado'}</span>
            </div>
            <p className="text-sm font-bold text-gray-700">Motivo: {c.motivo}</p>
            <p className="text-sm text-gray-600 mt-1">{c.plan_tratamiento}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EvolucionTab({ evoluciones, onSave, onDelete, loading }) {
  const [nota, setNota] = useState('');
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">Nueva Nota de Evolución</h3>
        <textarea 
          className="w-full border rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
          rows={4} 
          placeholder="Describa el progreso del tratamiento o hallazgos en la cita de hoy..."
          value={nota}
          onChange={e => setNota(e.target.value)}
        />
        <div className="mt-4 flex justify-end">
          <button 
            disabled={!nota.trim()}
            onClick={() => { onSave(nota); setNota(''); }}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50"
          >
            Registrar Evolución
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? <p>Cargando...</p> : evoluciones.map(e => (
          <div key={e.id} className="bg-white p-5 rounded-xl border-l-4 border-l-indigo-500 border-gray-100 shadow-sm relative group">
            <button onClick={() => onDelete('EVOLUCION', e.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 hidden group-hover:block"><FaTimes /></button>
            <div className="flex justify-between text-xs text-gray-500 mb-3">
              <span className="font-bold">{new Date(e.fecha_evolucion).toLocaleString()}</span>
              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase tracking-tighter">Registrado por: {e.profesional_nombre || e.registrado_por}</span>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{e.nota}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentosTab({ documentos, onUpload, onDelete, loading }) {
  const [file, setFile] = useState(null);
  const [tipo, setTipo] = useState('RX');
  const [obs, setObs] = useState('');

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleSubmit = () => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('tipo', tipo);
    fd.append('observaciones', obs);
    onUpload(fd);
    setFile(null);
    setObs('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2">
          <label className="block text-xs font-bold text-gray-500 uppercase">Subir Documento (RX, Resultados, etc)</label>
          <input type="file" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        </div>
        <div className="w-full md:w-32">
          <label className="block text-xs font-bold text-gray-500 mb-1">TIPO</label>
          <select className="w-full border rounded p-2 text-sm" value={tipo} onChange={e => setTipo(e.target.value)}>
            <option value="RX">Radiografía</option>
            <option value="CONSENTIMIENTO">Consentimiento</option>
            <option value="LAB">Laboratorio</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 mb-1">OBSERVACIONES</label>
          <input className="w-full border rounded p-2 text-sm" value={obs} onChange={e => setObs(e.target.value)} />
        </div>
        <button onClick={handleSubmit} disabled={!file} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50">Subir</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? <p>Cargando...</p> : documentos.map(d => (
          <div key={d.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm group relative">
             <button onClick={() => onDelete('DOCUMENTO', d.id)} className="absolute top-1 right-1 text-gray-300 hover:text-red-500 z-10 hidden group-hover:block"><FaTimes /></button>
             <div className="aspect-square bg-gray-100 rounded mb-2 overflow-hidden flex items-center justify-center">
                {d.url_archivo.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <img src={`${BACKEND_URL}${d.url_archivo}`} alt={d.nombre_archivo} className="w-full h-full object-cover cursor-pointer" onClick={() => window.open(`${BACKEND_URL}${d.url_archivo}`, '_blank')} />
                ) : (
                  <FaXRay className="text-4xl text-gray-300" />
                )}
             </div>
             <div className="text-[10px] font-bold text-blue-600 uppercase mb-1">{d.tipo_documento}</div>
             <p className="text-xs font-bold truncate text-gray-700">{d.nombre_archivo}</p>
             <p className="text-[10px] text-gray-400 mt-1 italic">{d.observaciones}</p>
             <div className="mt-2 text-[9px] text-gray-400 flex justify-between">
                <span>{new Date(d.fecha_subida).toLocaleDateString()}</span>
                <a href={`${BACKEND_URL}${d.url_archivo}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Ver archivo</a>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecetaTab({ recetas, onSave, onDelete, loading }) {
  const [meds, setMeds] = useState([{ nombre: '', dosis: '', frecuencia: '', duracion: '' }]);
  const [obs, setObs] = useState('');

  const addMed = () => setMeds([...meds, { nombre: '', dosis: '', frecuencia: '', duracion: '' }]);
  const removeMed = (idx) => setMeds(meds.filter((_, i) => i !== idx));
  const updateMed = (idx, field, val) => {
    const newMeds = [...meds];
    newMeds[idx][field] = val;
    setMeds(newMeds);
  };

  const handleSave = () => {
    onSave({ medicamentos: meds, indicaciones_generales: obs });
    setMeds([{ nombre: '', dosis: '', frecuencia: '', duracion: '' }]);
    setObs('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2 flex justify-between">
          Generar Nueva Receta
          <button onClick={addMed} className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors">+ Agregar Medicamento</button>
        </h3>
        
        <div className="space-y-3">
          {meds.map((m, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-[2]">
                {i === 0 && <label className="block text-[10px] font-bold text-gray-400">MEDICAMENTO</label>}
                <input className="w-full border rounded p-2 text-sm" value={m.nombre} onChange={e => updateMed(i, 'nombre', e.target.value)} placeholder="Ej: Amoxicilina 500mg" />
              </div>
              <div className="flex-1">
                {i === 0 && <label className="block text-[10px] font-bold text-gray-400">DOSIS</label>}
                <input className="w-full border rounded p-2 text-sm" value={m.dosis} onChange={e => updateMed(i, 'dosis', e.target.value)} placeholder="Ej: 1 tableta" />
              </div>
              <div className="flex-1">
                {i === 0 && <label className="block text-[10px] font-bold text-gray-400">FRECUENCIA</label>}
                <input className="w-full border rounded p-2 text-sm" value={m.frecuencia} onChange={e => updateMed(i, 'frecuencia', e.target.value)} placeholder="Ej: Cada 8 horas" />
              </div>
              <div className="flex-1">
                {i === 0 && <label className="block text-[10px] font-bold text-gray-400">DURACIÓN</label>}
                <input className="w-full border rounded p-2 text-sm" value={m.duracion} onChange={e => updateMed(i, 'duracion', e.target.value)} placeholder="Ej: 7 días" />
              </div>
              {meds.length > 1 && (
                <button onClick={() => removeMed(i)} className="text-red-400 p-2 hover:text-red-600"><FaTimes /></button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4">
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Indicaciones Generales / Recomendaciones</label>
          <textarea className="w-full border rounded-lg p-2 text-sm" rows={2} value={obs} onChange={e => setObs(e.target.value)} />
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={handleSave} className="bg-green-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-green-700 shadow-md">Guardar y Generar PDF</button>
        </div>
      </div>

      <div className="space-y-4">
         <h3 className="font-bold text-gray-500 uppercase text-xs tracking-widest">Recetas Previas</h3>
         {loading ? <p>Cargando...</p> : recetas.map(r => (
           <div key={r.id} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm relative group">
              <button onClick={() => onDelete('RECETA', r.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 hidden group-hover:block"><FaTimes /></button>
              <div className="flex justify-between items-start mb-3">
                 <div className="text-xs font-bold text-green-600">{new Date(r.fecha_receta).toLocaleDateString()} - Dr. {r.profesional_nombre}</div>
              </div>
              <ul className="text-sm space-y-1">
                {(r.medicamentos || []).map((m, mi) => (
                  <li key={mi} className="border-b border-gray-50 pb-1">
                    <strong>{m.nombre}</strong> — {m.dosis}, {m.frecuencia} por {m.duracion}
                  </li>
                ))}
              </ul>
              {r.indicaciones_generales && <p className="text-xs text-gray-500 mt-2 italic">{r.indicaciones_generales}</p>}
           </div>
         ))}
      </div>
    </div>
  );
}
