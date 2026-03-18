import React, { useEffect, useCallback, useRef, useState } from 'react';
import debounce from 'lodash.debounce';
import { Tooth } from './Tooth';
import { Toolbar } from './Toolbar';
import { useOdontogramStore } from '../../store/useOdontogramStore';
import { odontogramaApi } from '../../api/odontograma';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { ProcedureDrawer } from './ProcedureDrawer';
import { FaList, FaCheckCircle, FaFileMedicalAlt } from 'react-icons/fa';
import { MicroFormModal } from './MicroFormModal';
import { QuickAnamnesisModal } from './QuickAnamnesisModal';

// Fallback para crypto.randomUUID (no disponible en HTTP / contextos no seguros)
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback manual compatible con cualquier navegador
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Constantes de FDI
const CUADRANTE_1 = [18, 17, 16, 15, 14, 13, 12, 11]; // Arriba Derecha
const CUADRANTE_2 = [21, 22, 23, 24, 25, 26, 27, 28]; // Arriba Izquierda
const CUADRANTE_4 = [48, 47, 46, 45, 44, 43, 42, 41]; // Abajo Derecha
const CUADRANTE_3 = [31, 32, 33, 34, 35, 36, 37, 38]; // Abajo Izquierda

export const OdontogramBoard = ({ pacienteId, profesionalId, autoGuardarId, onFinalizado, onCancel }) => {
  const dientesStore = useOdontogramStore((state) => state.dientes);
  const sessionChanges = useOdontogramStore((state) => state.sessionChanges);
  const hidratarOdontograma = useOdontogramStore((state) => state.hidratarOdontograma);
  const aplicarProcedimiento = useOdontogramStore((state) => state.aplicarProcedimiento);
  const { user, profesional: profActual } = useAuth();
  
  // Usar el profesional de la sesión si no se pasa uno por props
  const effectiveProfesionalId = profesionalId || profActual?.id;
  
  const [evaluacionIdDraft, setEvaluacionIdDraft] = useState(() => autoGuardarId || generateUUID());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFinalizando, setIsFinalizando] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [procedimientos, setProcedimientos] = useState([]);
  const [anamnesis, setAnamnesis] = useState(null);
  const [loadingAnamnesis, setLoadingAnamnesis] = useState(false);

  // Validación de cumplimiento normativo (Anamnesis)
  const isFichaCompleta = useCallback(() => {
    if (!anamnesis) return false;
    return (
        (anamnesis.motivo_consulta?.trim() || '').length > 0 &&
        typeof anamnesis.escala_dolor === 'number' &&
        (anamnesis.cie10_codigo?.trim() || '').length > 0
    );
  }, [anamnesis]);

  const [microModal, setMicroModal] = useState({ 
    isOpen: false, 
    fdi: null, 
    cara: null, 
    initialData: null 
  });

  const [quickAnamnesisModal, setQuickAnamnesisModal] = useState({
    isOpen: false,
    initialData: null
  });

  // Cargar lista de procedimientos del backend
  useEffect(() => {
    async function loadProcs() {
      try {
        const resp = await odontogramaApi.getProcedimientos();
        const data = Array.isArray(resp) ? resp : (resp.data || []);
        setProcedimientos(data);
      } catch (err) { console.error(err); }
    }
    loadProcs();
  }, []);

  // Cargar Anamnesis para validación de cumplimiento
  useEffect(() => {
    async function fetchAnamnesis() {
        setLoadingAnamnesis(true);
        try {
            const resp = await odontogramaApi.getAnamnesis(pacienteId);
            setAnamnesis(resp.data || resp);
        } catch (err) {
            console.error("Error fetching anamnesis for validation:", err);
        } finally {
            setLoadingAnamnesis(false);
        }
    }
    if (pacienteId) fetchAnamnesis();
  }, [pacienteId]);

  // 0. Listener para clics en dientes (Interceptar para abrir el Micro Form)
  const handleToothClick = (fdi, cara) => {
    const { procedimientoActivo } = useOdontogramStore.getState();
    
    if (procedimientoActivo) {
        // SI hay un procedimiento seleccionado, lo aplicamos directamente (Pintar)
        aplicarProcedimiento(fdi, cara);
    } else {
        // SI NO hay nada seleccionado, abrimos el modal para ver/editar detalles
        const dienteData = dientesStore[fdi];
        const initialData = cara === 'Completo' ? dienteData?.completo : dienteData?.caras?.[cara];
        
        setMicroModal({
          isOpen: true,
          fdi,
          cara,
          initialData
        });
    }
  };

  const handleSaveMicroForm = (datos) => {
    aplicarProcedimiento(microModal.fdi, microModal.cara, datos);
  };

  // Usamos ref para evitar dependencias innecesarias en el useCallback del debounce
  const sessionRef = useRef(sessionChanges);
  useEffect(() => {
    sessionRef.current = sessionChanges;
  }, [sessionChanges]);

  const storeRef = useRef(dientesStore);
  useEffect(() => {
    storeRef.current = dientesStore;
  }, [dientesStore]);

  // Si nos pasan un histórico, lo cargamos (opcional según si es modo visualización o edición nueva)
  useEffect(() => {
    async function fetchTimeline() {
        try {
            const resp = await odontogramaApi.getTimeline(pacienteId);
            const data = (resp.data || resp || []);
            hidratarOdontograma(data);
        } catch (err) { console.error(err); }
    }
    if (pacienteId) fetchTimeline();
  }, [pacienteId, hidratarOdontograma]);

  // 1. Lógica de Autoguardado Silencioso (Sync to Backend)
  const saveToServer = async () => {
    const payloadDetalles = [];
    const currentSession = sessionRef.current;

    Object.entries(currentSession).forEach(([pieza_dental, datos]) => {
      if (datos.completo) {
        payloadDetalles.push({
          pieza_dental: parseInt(pieza_dental),
          procedimiento_id: datos.completo.id,
          cara: 'Completo',
          estado_completado: true,
          evolucion_porcentaje: datos.completo.evolucion_porcentaje || 100,
          hallazgo: datos.completo.hallazgo,
          plan_tratamiento: datos.completo.plan_tratamiento,
          cie10_codigo: datos.completo.cie10_codigo,
          cie10_texto: datos.completo.cie10_texto,
          aplica_diente_completo: true
        });
      } else if (datos.caras) {
        Object.entries(datos.caras).forEach(([cara, infoCara]) => {
          payloadDetalles.push({
            pieza_dental: parseInt(pieza_dental),
            procedimiento_id: infoCara.id,
            cara: cara,
            estado_completado: true,
            evolucion_porcentaje: infoCara.evolucion_porcentaje || 100,
            hallazgo: infoCara.hallazgo,
            plan_tratamiento: infoCara.plan_tratamiento,
            cie10_codigo: infoCara.cie10_codigo,
            cie10_texto: infoCara.cie10_texto,
            aplica_diente_completo: false
          });
        });
      }
    });

    if (payloadDetalles.length === 0) return;

    const payloadBackend = {
      paciente_id: parseInt(pacienteId),
      profesional_id: effectiveProfesionalId || null,
      registrado_por: user?.nombre || user?.username || 'admin',
      detalles: payloadDetalles
    };

    setIsSyncing(true);
    try {
      await odontogramaApi.autoguardarDraft(evaluacionIdDraft, payloadBackend);
    } catch (error) {
      console.error("Error en autoguardado de odontograma", error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const syncToBackend = useCallback(
    debounce(() => saveToServer(), 2000),
    [pacienteId, effectiveProfesionalId, evaluacionIdDraft, user]
  );
// ... Resto del componente (al final)

  useEffect(() => {
    syncToBackend();
  }, [sessionChanges, syncToBackend]);

  useEffect(() => {
    return () => {
      syncToBackend.cancel();
    };
  }, [syncToBackend]);

  // 2. Acción Final del Usuario (Cerrar Consulta/Borrador)
  const handleFinalizarEvaluacion = async () => {
    // Validar que no esté vacío
    const currentSession = sessionRef.current;
    if (Object.keys(currentSession).length === 0) {
      if(toast) {
          toast.error("Debe registrar al menos un hallazgo clínico en esta sesión antes de finalizar.");
      } else {
          alert("Debe registrar al menos un hallazgo clínico.");
      }
      return;
    }

    setIsFinalizando(true);
    try {
      // 1. Asegurar persistencia del borrador actual antes de sellar
      syncToBackend.cancel(); // Ahora sí cancelamos el debounce porque vamos a llamar manualmente
      await saveToServer();   // Llamada directa y esperada (await)

      // 2. Sellar el registro
      await odontogramaApi.finalizarEvaluacion(evaluacionIdDraft);
      
      if(toast) toast.success("Odontograma finalizado y bloqueado correctamente.");
      if (onFinalizado) onFinalizado(evaluacionIdDraft);
    } catch (error) {
      console.error(error);
      const errorMsg = error.message?.includes("sin tratamientos") 
        ? "No se puede guardar un odontograma vacío."
        : "No se pudo sellar la historia clínica. Verifique conexión.";
      if (toast) toast.error(errorMsg);
    } finally {
      setIsFinalizando(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto p-4 animate-fade-in relative overflow-hidden">
      {/* Drawer Overlay/Slide */}
      <ProcedureDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        procedimientos={procedimientos} 
      />

      {/* 1. Paleta de Tratamientos + Botón Catálogo */}
      <div className="flex justify-between items-center gap-4 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
        <Toolbar />
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg font-semibold text-sm transition-colors border border-indigo-100"
        >
          <FaList />
          Catálogo Extendido
        </button>
      </div>

      {/* Micro Form Modal */}
      <MicroFormModal 
        isOpen={microModal.isOpen} 
        onClose={() => setMicroModal({ ...microModal, isOpen: false })}
        onSave={handleSaveMicroForm}
        fdiNumber={microModal.fdi}
        cara={microModal.cara}
        initialData={microModal.initialData}
      />

      <QuickAnamnesisModal 
        isOpen={quickAnamnesisModal.isOpen}
        onClose={() => setQuickAnamnesisModal({ ...quickAnamnesisModal, isOpen: false })}
        pacienteId={pacienteId}
        initialData={anamnesis}
        onSaveSuccess={(newAnamnesis) => setAnamnesis(newAnamnesis)}
      />

      {/* 2. Área Interactiva */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 overflow-x-auto relative min-h-[400px]">
        {/* Sync Indicator */}
        <div className="absolute top-4 right-6 text-xs text-gray-400 flex items-center gap-1.5 font-medium bg-gray-50 px-2 py-1 rounded-full">
           <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`}></span>
           {isSyncing ? 'Guardando...' : 'Sincronizado'}
        </div>

        {/* Maxilar Superior */}
        <div className="flex justify-center mb-8 mt-4">
          <div className="flex gap-1 border-r-2 border-dashed border-gray-300 pr-2 mr-2">
            {CUADRANTE_1.map(num => <Tooth key={num} fdiNumber={num} onSurfaceClick={handleToothClick} />)}
          </div>
          <div className="flex gap-1 pl-2">
            {CUADRANTE_2.map(num => <Tooth key={num} fdiNumber={num} onSurfaceClick={handleToothClick} />)}
          </div>
        </div>

        {/* Línea Oclusal Media */}
        <div className="w-full h-px bg-gray-200 mb-8 relative">
          <span className="absolute left-1/2 -top-3 -translate-x-1/2 bg-white px-3 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
            Línea Oclusal Media
          </span>
        </div>

        {/* Maxilar Inferior */}
        <div className="flex justify-center mb-4">
          <div className="flex gap-1 border-r-2 border-dashed border-gray-300 pr-2 mr-2">
            {CUADRANTE_4.map(num => <Tooth key={num} fdiNumber={num} isLowerJaw onSurfaceClick={handleToothClick} />)}
          </div>
          <div className="flex gap-1 pl-2">
            {CUADRANTE_3.map(num => <Tooth key={num} fdiNumber={num} isLowerJaw onSurfaceClick={handleToothClick} />)}
          </div>
        </div>
      </div>

       {/* 3. Acciones */}
      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center gap-3">
            {!loadingAnamnesis && !isFichaCompleta() && (
                <button 
                  onClick={() => setQuickAnamnesisModal({ isOpen: true, initialData: anamnesis })}
                  className="flex items-center gap-3 bg-red-50 text-red-600 px-4 py-2 rounded-xl border border-red-200 hover:bg-red-100 transition-all group shadow-sm"
                >
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse group-hover:scale-125 transition-transform"></div>
                    <div className="text-left">
                        <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Ficha Incompleta</div>
                        <div className="text-xs font-bold">Completar Anamnesis Obligatoria</div>
                    </div>
                    <FaFileMedicalAlt className="ml-2 opacity-50" />
                </button>
            )}
            {!loadingAnamnesis && isFichaCompleta() && (
                <div className="flex items-center gap-3 bg-green-50 text-green-700 px-4 py-2 rounded-xl border border-green-200 shadow-sm">
                    <div className="bg-green-500 text-white p-1 rounded-full shadow-sm">
                        <FaCheckCircle size={14} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Rigor Normativo</div>
                        <div className="text-xs font-bold">Cumplimiento OK</div>
                    </div>
                    <button 
                      onClick={() => setQuickAnamnesisModal({ isOpen: true, initialData: anamnesis })}
                      className="ml-4 text-[10px] font-bold underline opacity-50 hover:opacity-100"
                    >
                        Editar
                    </button>
                </div>
            )}
        </div>

        <div className="flex gap-4">
            <button 
                onClick={onCancel}
                className="px-5 py-2.5 text-sm text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg font-medium transition-colors shadow-sm"
            >
                {Object.keys(sessionRef.current).length > 0 ? "Descartar Cambios" : "Volver"}
            </button>
            <button 
                onClick={handleFinalizarEvaluacion}
                disabled={isFinalizando}
                className={`flex items-center gap-2 px-6 py-2.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all shadow border border-transparent hover:shadow-md ${isFinalizando ? 'opacity-50 cursor-not-allowed grayscale-[0.5]' : ''}`}
                title={!isFichaCompleta() ? "Aviso: La anamnesis está incompleta, pero puede guardar el registro" : "Guardar y sellar registro clínico"}
            >
                {isFinalizando ? (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )}
                Firmar y Guardar Odontograma
            </button>
        </div>
      </div>
    </div>
  );
};
