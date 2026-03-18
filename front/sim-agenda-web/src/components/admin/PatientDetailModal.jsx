import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaHistory, FaTimes, FaTooth,
  FaCapsules, FaChartLine, FaFileMedicalAlt, FaXRay, 
  FaSyringe, FaFileMedical, FaFileSignature 
} from 'react-icons/fa';
import PatientForm from './PatientForm';
import GenerarAlertaModal from './GenerarAlertaModal';
import { apiFetch } from '../../api/client';
import { showToast } from '../../utils/ui';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function PatientDetailModal({ paciente, onClose }) {
  const [activeTab, setActiveTab] = useState('datos');
  const [historia, setHistoria] = useState([]);
  const [loadingHistoria, setLoadingHistoria] = useState(false);
  
  // Anamnesis state
  const [anamnesis, setAnamnesis] = useState({ 
    antece_medicos: {
      enfermedad_actual: '',
      patologicos: '',
      farmacologicos: '',
      odontologicos: ''
    }, 
    observaciones: '' // Usado como Motivo de Consulta
  });
  const [loadingAnamnesis, setLoadingAnamnesis] = useState(false);
  const [savingAnamnesis, setSavingAnamnesis] = useState(false);
  
  // Alertas
  const [showAlertaModal, setShowAlertaModal] = useState(false);

  // Edit History state
  const [editingCitaId, setEditingCitaId] = useState(null);
  const [tempObservacion, setTempObservacion] = useState('');

  // Efecto para cargar historia cuando se abre el tab
  useEffect(() => {
    if (activeTab === 'historia' && paciente?.id) {
      fetchHistoria(paciente.id);
    }
    if (activeTab === 'anamnesis' && paciente?.id) {
      fetchAnamnesis(paciente.id);
    }
  }, [activeTab, paciente]);

  async function fetchHistoria(id) {
    setLoadingHistoria(true);
    try {
      const resp = await apiFetch(`${BACKEND_URL}/citas/paciente/${id}`);
      const pacienteCitas = (resp.data || [])
        .sort((a, b) => new Date(b.fecha_programacion + ' ' + b.hora) - new Date(a.fecha_programacion + ' ' + a.hora));
      setHistoria(pacienteCitas);
    } catch (err) {
      console.error(err);
      showToast('Error cargando historia', 'error');
    } finally {
      setLoadingHistoria(false);
    }
  }

  async function fetchAnamnesis(id) {
    setLoadingAnamnesis(true);
    try {
      const resp = await apiFetch(`${BACKEND_URL}/pacientes/${id}/anamnesis`);
      if (resp) {
          setAnamnesis({
              antece_medicos: resp.antece_medicos || {},
              observaciones: resp.observaciones || ''
          });
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
            body: JSON.stringify(anamnesis)
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

  if (!paciente) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Static Header: Datos Personales */}
          <div className="bg-gray-50 border-b border-gray-200 p-6 flex-shrink-0">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                <FaUser className="text-blue-600" />
                Datos Personales
              </h2>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-200 p-2 rounded-full transition-colors"
              >
                <FaTimes />
              </button>
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
                    {historia.map((cita) => (
                      <div key={cita.id} className="relative pl-8">
                        {/* Dot */}
                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                          cita.estado === 'ATENDIDA' ? 'bg-green-500' : 
                          cita.estado === 'CANCELADA' ? 'bg-red-400' : 'bg-blue-400'
                        }`} />
                        
                        {/* Card */}
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                  cita.estado === 'ATENDIDA' ? 'bg-green-100 text-green-700' :
                                  cita.estado === 'CANCELADA' ? 'bg-red-100 text-red-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>{cita.estado || 'PROGRAMADA'}</span>
                                <h4 className="font-bold text-gray-800 mt-1">Cita Odontológica - {cita.motivo_cita || 'Consulta General'}</h4>
                            </div>
                            <div className="text-right text-xs text-gray-500">
                              <div className="font-semibold">{cita.fecha_programacion}</div>
                              <div>{cita.hora}</div>
                            </div>
                          </div>
                          
                          {/* Editable Observation */}
                          <div className="mt-3 pt-3 border-t border-gray-50">
                             {editingCitaId === cita.id ? (
                                 <div className="animate-fadeIn">
                                     <textarea
                                        className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        rows={2}
                                        value={tempObservacion}
                                        onChange={e => setTempObservacion(e.target.value)}
                                        placeholder="Escriba la evolución o notas clínicas..."
                                     />
                                     <div className="flex justify-end gap-2 mt-2">
                                         <button 
                                            onClick={() => setEditingCitaId(null)}
                                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                                         >
                                            Cancelar
                                         </button>
                                         <button 
                                            onClick={() => saveObservacionCita(cita.id)}
                                            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                         >
                                            Guardar Nota
                                         </button>
                                     </div>
                                 </div>
                             ) : (
                                 <div 
                                    className="group cursor-pointer hover:bg-blue-50 p-2 -mx-2 rounded transition-colors"
                                    onClick={() => {
                                        setEditingCitaId(cita.id);
                                        setTempObservacion(cita.observacion || '');
                                    }}
                                 >
                                    <p className="text-sm text-gray-600 min-h-[1.5em]">
                                      {cita.observacion || <span className="text-gray-400 italic">Clic para agregar notas clínicas...</span>}
                                    </p>
                                 </div>
                             )}
                          </div>
                          
                          <div className="text-xs text-gray-400 flex gap-4 mt-2">
                            <span>Prof. ID: {cita.profesional_id}</span>
                            <span>Servicio: {cita.tipo_servicio}</span>
                          </div>
                        </div>
                      </div>
                    ))}
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
                        
                        <div className="space-y-5">
                          <div>
                             <label className="block text-sm font-bold text-gray-700 mb-1 uppercase">Motivo de Consulta: *</label>
                             <textarea 
                                className="w-full border border-gray-300 rounded p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                rows={3}
                                required
                                value={anamnesis.observaciones}
                                onChange={e => setAnamnesis(prev => ({ ...prev, observaciones: e.target.value }))}
                                placeholder="Ingresa el motivo de consulta"
                             ></textarea>
                          </div>

                          <div>
                             <label className="block text-sm font-bold text-gray-700 mb-1 uppercase">Enfermedad Actual: *</label>
                             <textarea 
                                className="w-full border border-gray-300 rounded p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                rows={3}
                                required
                                value={anamnesis.antece_medicos?.enfermedad_actual || ''}
                                onChange={e => setAnamnesis(prev => ({ ...prev, antece_medicos: { ...prev.antece_medicos, enfermedad_actual: e.target.value } }))}
                                placeholder="Ingresa la enfermedad actual"
                             ></textarea>
                          </div>

                          <h4 className="font-bold text-gray-800 pt-4 border-t uppercase">Antecedentes Personales</h4>

                          <div>
                             <label className="block text-sm font-bold text-gray-700 mb-1 uppercase">Antecedentes Patológicos: *</label>
                             <textarea 
                                className="w-full border border-gray-300 rounded p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                rows={3}
                                required
                                value={anamnesis.antece_medicos?.patologicos || ''}
                                onChange={e => setAnamnesis(prev => ({ ...prev, antece_medicos: { ...prev.antece_medicos, patologicos: e.target.value } }))}
                                placeholder="Ingresa los antecedentes patológicos"
                             ></textarea>
                          </div>

                          <div>
                             <label className="block text-sm font-bold text-gray-700 mb-1 uppercase">Antecedentes Farmacológicos: *</label>
                             <textarea 
                                className="w-full border border-gray-300 rounded p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                rows={3}
                                required
                                value={anamnesis.antece_medicos?.farmacologicos || ''}
                                onChange={e => setAnamnesis(prev => ({ ...prev, antece_medicos: { ...prev.antece_medicos, farmacologicos: e.target.value } }))}
                                placeholder="Ingresa los antecedentes farmacológicos"
                             ></textarea>
                          </div>

                          <div>
                             <label className="block text-sm font-bold text-gray-700 mb-1 uppercase">Antecedentes Odontológicos: *</label>
                             <textarea 
                                className="w-full border border-gray-300 rounded p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                rows={3}
                                required
                                value={anamnesis.antece_medicos?.odontologicos || ''}
                                onChange={e => setAnamnesis(prev => ({ ...prev, antece_medicos: { ...prev.antece_medicos, odontologicos: e.target.value } }))}
                                placeholder="Ingresa los antecedentes odontológicos"
                             ></textarea>
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

            {/* Placeholder Tabs */}
            {['consulta', 'evoluciones', 'odontograma', 'rx_docs', 'recetas', 'docs_clinicos', 'consentimientos'].includes(activeTab) && (
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-fadeIn text-center py-20 flex flex-col items-center justify-center">
                 <div className="text-gray-300 text-6xl mb-4">
                    {activeTab === 'consulta' && <FaCapsules />}
                    {activeTab === 'evoluciones' && <FaChartLine />}
                    {activeTab === 'odontograma' && <FaTooth />}
                    {activeTab === 'rx_docs' && <FaXRay />}
                    {activeTab === 'recetas' && <FaSyringe />}
                    {activeTab === 'docs_clinicos' && <FaFileMedical />}
                    {activeTab === 'consentimientos' && <FaFileSignature />}
                 </div>
                 <h3 className="text-2xl font-bold text-gray-400 mb-2 uppercase tracking-wider">Módulo en Desarrollo</h3>
                 <p className="text-gray-500 max-w-md">Esta sección estará disponible en próximas versiones del sistema.</p>
              </div>
            )}

          </div>
        </motion.div>
      </motion.div>
      
      {showAlertaModal && (
        <GenerarAlertaModal 
          pacienteId={paciente.id} 
          onClose={() => setShowAlertaModal(false)}
        />
      )}
    </AnimatePresence>
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
