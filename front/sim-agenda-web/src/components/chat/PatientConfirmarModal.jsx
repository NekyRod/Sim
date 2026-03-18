import { useState, useEffect } from 'react';
import { FaTimes, FaCheck, FaChevronLeft } from 'react-icons/fa';
import { apiFetch } from '../../api/client';
import { Button } from '../ui';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function PatientConfirmarModal({
  open,
  onClose,
  onSuccess
}) {
  const [step, setStep] = useState(1);
  const [docNum, setDocNum] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setStep(1);
      setDocNum('');
      setAppointments([]);
      setError(null);
    }
  }, [open]);

  async function searchAppointments() {
    if (!docNum) {
      setError("Ingresa tu número de documento");
      return;
    }
    setLoading(true);
    try {
      const resp = await apiFetch(`${BACKEND_URL}/patient-api/citas/buscar?doc=${docNum}`);
      if (resp.data && resp.data.length > 0) {
        // SUCCESS: Sync identity with chat session if available
        const sessionId = localStorage.getItem('chat_session_id');
        if (sessionId) {
            try {
                await apiFetch(`${BACKEND_URL}/patient/chat/sessions`, {
                    method: 'POST',
                    body: JSON.stringify({
                        session_id: parseInt(sessionId),
                        documento: docNum
                    })
                });
            } catch (chatErr) {
                console.warn("Could not sync identity with chat session", chatErr);
            }
        }

        setAppointments(resp.data);
        setStep(2);
        setError(null);
      } else {
        setError("No se encontraron citas para confirmar.");
      }
    } catch(err) {
      setError("Error al buscar citas.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(citaId) {
    setLoading(true);
    try {
        // We need an endpoint to confirm. Usually PUT /citas/{id}/estado
        await apiFetch(`${BACKEND_URL}/patient-api/citas/${citaId}/confirmar`, {
             method: 'PUT'
        });
        onSuccess("¡Cita confirmada exitosamente!");
        onClose();
    } catch(err) {
        setError("No se pudo confirmar la cita.");
    } finally {
        setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        <div className="bg-green-600 text-white p-4 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold">Confirmar Cita</h3>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
            <FaTimes />
          </button>
        </div>

        <div className="p-6 space-y-6">
           {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

           {step === 1 && (
             <div className="space-y-4">
               <p className="text-sm text-gray-600">Ingresa tu documento para confirmar tus citas.</p>
               <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Número Documento</label>
                  <input 
                    className="w-full p-2 border rounded" 
                    value={docNum} 
                    onChange={e => setDocNum(e.target.value)}
                    placeholder="Ej. 123456789"
                  />
               </div>
               <Button onClick={searchAppointments} disabled={!docNum || loading} className="w-full bg-green-600 hover:bg-green-700">
                  {loading ? 'Buscando...' : 'Buscar'}
               </Button>
             </div>
           )}

           {step === 2 && (
             <div className="space-y-4">
                <button onClick={() => setStep(1)} className="text-xs text-blue-600 flex items-center gap-1"><FaChevronLeft/> Volver</button>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {appointments.map(cita => (
                        <div key={cita.id} className={`border p-3 rounded-lg flex justify-between items-center ${cita.estado === 'CONFIRMADA' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                            <div>
                                <div className="text-sm font-bold text-gray-800">{cita.fecha_programacion} - {cita.hora}</div>
                                <div className="text-xs text-gray-600">{cita.profesional_nombre}</div>
                                <div className="text-xs font-semibold mt-1">
                                    Estado: {cita.estado || 'PENDIENTE'}
                                </div>
                            </div>
                            {cita.estado !== 'CONFIRMADA' && (
                                <button 
                                    onClick={() => handleConfirm(cita.id)}
                                    className="text-green-600 hover:bg-green-100 p-2 rounded-full"
                                    title="Confirmar"
                                >
                                    <FaCheck />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
