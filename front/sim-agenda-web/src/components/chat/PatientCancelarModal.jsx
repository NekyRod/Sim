import { useState, useEffect } from 'react';
import { FaTimes, FaTrash, FaChevronLeft } from 'react-icons/fa';
import { apiFetch } from '../../api/client';
import { Button } from '../ui';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function PatientCancelarModal({
  open,
  onClose,
  onSuccess
}) {
  const [step, setStep] = useState(1);
  const [docType, setDocType] = useState('CC');
  const [docNum, setDocNum] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form for cancellation details (Step 3)
  const [selectedCita, setSelectedCita] = useState(null);
  const [cancelName, setCancelName] = useState('');
  const [cancelDoc, setCancelDoc] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (open) {
      setStep(1);
      setDocNum('');
      setAppointments([]);
      setError(null);
      setSelectedCita(null);
      setCancelName('');
      setCancelDoc('');
      setCancelReason('');
    }
  }, [open]);

  async function searchAppointments() {
    if (!docNum) {
      setError("Ingresa tu número de documento");
      return;
    }
    setLoading(true);
    try {
      // We need an endpoint to get appointments by Document.
      // We can use the same logic as chat bot: POST to find patient then list appointments?
      // Or GET /citas/paciente/doc?type=..&num=..
      // If such endpoint doesn't exist, we might need to modify backend or search logic.
      // Chat control used internal Repo calls. 
      // FRONTEND: We don't have a specific `get_citas_by_doc` public endpoint I saw in `citas_routes.py`.
      // `citas_routes` has `/profesional/...` and `{id}`. 
      // We might need to add one OR use `chat_control` logic.
      // Wait, `chat_control` is for websocket/chat messages.
      // The frontend needs an HTTP endpoint.
      // I should add an endpoint `GET /citas/search?doc=...` to `citas_routes.py`?
      // Or I can use `POST /auth/login` to get token then list? No, patient is anonymous here basically.
      // I'll assume for now I should add a simple search endpoint or use an existing one I missed.
      // The user wants "igual a la visual del admin". Admin sees all.
      // I'll create a `GET /citas/buscar?doc=XYZ` endpoint in backend if verified missing.
      // `citas_routes` showed `crear_cita`, `get_citas_rango`, `get_cita`, `eliminar_cita`.
      // I need to add `buscar_citas_paciente`.
      // Let's implement the frontend assuming the endpoint exists (I will add it in next step).
      const resp = await apiFetch(`${BACKEND_URL}/patient-api/citas/buscar?doc=${docNum}`);
      if (resp.data && resp.data.length > 0) {
        setAppointments(resp.data);
        setStep(2);
        setError(null);
      } else {
        setError("No se encontraron citas activas para este documento.");
      }
    } catch(err) {
      console.error(err);
      setError("Error al buscar citas. Verifique el documento.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!selectedCita) return;
    setLoading(true);
    try {
        await apiFetch(`${BACKEND_URL}/patient-api/citas/${selectedCita.id}/cancelar`, {
            method: 'PUT',
            body: JSON.stringify({
                cancelado_por_nombre: cancelName,
                cancelado_por_documento: cancelDoc,
                cancelado_motivo: cancelReason
            })
        });

        // SUCCESS: Sync identity with chat session if available
        const sessionId = localStorage.getItem('chat_session_id');
        if (sessionId) {
            try {
                await apiFetch(`${BACKEND_URL}/patient/chat/sessions`, {
                    method: 'POST',
                    body: JSON.stringify({
                        session_id: parseInt(sessionId),
                        name: cancelName,
                        documento: cancelDoc
                    })
                });
            } catch (chatErr) {
                console.warn("Could not sync identity with chat session", chatErr);
            }
        }

        setStep(4); // Success step
    } catch(err) {
        setError("No se pudo cancelar la cita. " + (err.message || ""));
    } finally {
        setLoading(false);
    }
  }

  function confirmSelected(cita) {
      setSelectedCita(cita);
      setStep(3);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        <div className="bg-red-600 text-white p-4 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold">Cancelar Cita</h3>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
            <FaTimes />
          </button>
        </div>

        <div className="p-6 space-y-6">
           {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

           {step === 1 && (
             <div className="space-y-4">
               <p className="text-sm text-gray-600">Para encontrar tu cita, ingresa tu documento.</p>
               <div>
                 <label className="block text-xs font-bold text-gray-700 mb-1">Tipo Identificación</label>
                 <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full p-2 border rounded">
                    <option value="CC">Cédula de Ciudadanía</option>
                    <option value="TI">Tarjeta Identidad</option>
                    <option value="CE">Cédula Extranjería</option>
                 </select>
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Número Documento</label>
                  <input 
                    className="w-full p-2 border rounded" 
                    value={docNum} 
                    onChange={e => setDocNum(e.target.value)}
                    placeholder="Ej. 123456789"
                  />
               </div>
               <Button onClick={searchAppointments} disabled={!docNum || loading} className="w-full bg-red-600 hover:bg-red-700">
                  {loading ? 'Buscando...' : 'Buscar Citas'}
               </Button>
             </div>
           )}

           {step === 2 && (
             <div className="space-y-4">
                <button onClick={() => setStep(1)} className="text-xs text-blue-600 flex items-center gap-1"><FaChevronLeft/> Volver</button>
                <h4 className="font-bold text-gray-700">Tus Citas Encontradas</h4>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {appointments.map(cita => (
                        <div key={cita.id} className="border border-red-100 bg-red-50 p-3 rounded-lg flex justify-between items-center">
                            <div>
                                <div className="text-sm font-bold text-gray-800">{cita.fecha_programacion} - {cita.hora}</div>
                                <div className="text-xs text-gray-600">{cita.profesional_nombre}</div>
                                <div className="text-xs text-gray-500">{cita.tipo_servicio}</div>
                            </div>
                            <button 
                                onClick={() => confirmSelected(cita)}
                                className="text-red-500 hover:bg-red-100 p-2 rounded-full"
                                title="Cancelar Cita"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    ))}
                </div>
             </div>
           )}

           {step === 3 && (
             <div className="space-y-4 animate-fadeIn">
                <button onClick={() => setStep(2)} className="text-xs text-blue-600 flex items-center gap-1"><FaChevronLeft/> Volver a la lista</button>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cita a cancelar:</p>
                    <p className="text-sm font-semibold text-gray-800">{selectedCita?.fecha_programacion} - {selectedCita?.hora}</p>
                    <p className="text-xs text-gray-600">{selectedCita?.profesional_nombre}</p>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Nombre de quien cancela</label>
                        <input 
                            className="w-full p-2 border rounded text-sm" 
                            value={cancelName} 
                            onChange={e => setCancelName(e.target.value)}
                            placeholder="Nombre completo"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Documento de quien cancela</label>
                        <input 
                            className="w-full p-2 border rounded text-sm" 
                            value={cancelDoc} 
                            onChange={e => setCancelDoc(e.target.value)}
                            placeholder="Número de documento"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Motivo de cancelación</label>
                        <textarea 
                            className="w-full p-2 border rounded text-sm h-20 resize-none" 
                            value={cancelReason} 
                            onChange={e => setCancelReason(e.target.value)}
                            placeholder="Ej: Compromiso laboral, enfermedad, etc."
                        />
                    </div>
                </div>

                <Button 
                    onClick={handleCancel} 
                    disabled={!cancelName || !cancelDoc || !cancelReason || loading} 
                    className="w-full bg-red-600 hover:bg-red-700"
                >
                    {loading ? 'Cancelando...' : 'Confirmar Cancelación'}
                </Button>
             </div>
           )}

           {step === 4 && (
               <div className="py-8 text-center space-y-4 animate-scaleIn">
                   <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                       ✓
                   </div>
                   <h4 className="text-xl font-bold text-gray-800">¡Cita Cancelada!</h4>
                   <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                       <p className="text-blue-800 font-medium">
                           Solo podrá reprogramar su cita hasta dentro de 24 horas
                       </p>
                   </div>
                   <Button onClick={() => { onSuccess(); onClose(); }} className="w-full bg-gray-800">
                       Entendido
                   </Button>
               </div>
           )}
        </div>
      </div>
    </div>
  );
}
