import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatApi } from '../../api/chat';
import ChatBubble from '../../components/chat/ChatBubble';
import { FaPaperPlane, FaSpinner, FaPowerOff } from 'react-icons/fa';
import PatientAgendarModal from '../../components/chat/PatientAgendarModal';
import PatientCancelarModal from '../../components/chat/PatientCancelarModal';
import logoGOI from '../../img/logo_goi.jpg';
import PatientConfirmarModal from '../../components/chat/PatientConfirmarModal';
import { motion, AnimatePresence } from 'framer-motion';

export default function PatientChat() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const [status, setStatus] = useState('bot'); // bot, waiting, active, closed
  const [activeModal, setActiveModal] = useState(null); // 'cancelar', 'confirmar', 'agendar'
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [registrationData, setRegistrationData] = useState(null);
  
  // Init Session
  useEffect(() => {
    // Only try to restore session, do NOT auto-create if not found
    const storedSession = localStorage.getItem('chat_session_id');
    if (storedSession) {
        setSessionId(parseInt(storedSession));
        resumeChat(parseInt(storedSession));
    } else {
        setLoading(false); // Ready to show form
    }
  }, []);

  // Polling
  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

  async function resumeChat(id) {
      try {
          setLoading(true);
          const res = await chatApi.startSession(id);
          setSessionId(res.session_id);
          setStatus(res.status);
          localStorage.setItem('chat_session_id', res.session_id);
          await fetchMessages(res.session_id);
      } catch (err) {
          console.error("Failed to resume", err);
          localStorage.removeItem('chat_session_id');
          setSessionId(null);
      } finally {
          setLoading(false);
      }
  }

  async function handleRegister(data) {
    try {
      setLoading(true);
      setRegistrationData(data);
      // Start NEW session with data
      const res = await chatApi.startSession(null, data); 
      setSessionId(res.session_id);
      setStatus(res.status);
      localStorage.setItem('chat_session_id', res.session_id);
      await fetchMessages(res.session_id);
    } catch (err) {
      console.error(err);
      alert("Error iniciando chat");
    } finally {
      setLoading(false);
    }
  }

  // Track processed command IDs to avoid re-opening modals endlessly
  const processedCmdIds = useRef(new Set());

  async function fetchMessages(sessId = sessionId) {
    if (!sessId) return;
    try {
      let msgs = await chatApi.getPatientMessages(sessId);
      if (!Array.isArray(msgs)) msgs = [];
      
      // Filter out CMD messages and trigger modals
      const filteredMsgs = [];
      let foundCmd = false;
      
      for (const m of msgs) {
         if (m.sender_type === 'system' && m.content.startsWith('CMD:')) {
             if (!processedCmdIds.current.has(m.id)) {
                 if (m.content.includes('OPEN_MODAL_CANCELAR')) {
                     if (activeModal !== 'cancelar') setActiveModal('cancelar');
                     processedCmdIds.current.add(m.id);
                 } else if (m.content.includes('OPEN_MODAL_CONFIRMAR')) {
                     if (activeModal !== 'confirmar') setActiveModal('confirmar');
                     processedCmdIds.current.add(m.id);
                 } else if (m.content.includes('OPEN_MODAL_AGENDAR')) {
                     // Format: CMD:OPEN_MODAL_AGENDAR:CODE
                     const parts = m.content.split(':');
                     const code = parts[2] || null;
                     setSelectedSpecialty(code);
                     if (activeModal !== 'agendar') setActiveModal('agendar');
                     processedCmdIds.current.add(m.id);
                 }
                 foundCmd = true;
             }
         } else {
             filteredMsgs.push(m);
         }
      }
      
      setMessages(filteredMsgs);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSend(e) {
    if (e) e.preventDefault();
    if (!inputValue.trim() || sending) return;

    const content = inputValue.trim();
    setInputValue('');
    setSending(true);

    try {
      await chatApi.sendPatientMessage(sessionId, content);
      await fetchMessages();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  // Menu logic
  // Menu logic
  // Main Menu options (Hardcoded fallback)
  const defaultMenuOptions = [
    { id: '1', label: '1. Agendar' },
    { id: '2', label: '2. Cancelar' },
    { id: '3', label: '3. Consultar Citas' },
    { id: '4', label: '4. Ubicación' },
    { id: '5', label: '5. Cuota' },
    { id: '6', label: '6. Historia' },
    { id: '7', label: '7. PQR' },
  ];

  // Helper to extract options from text if it's a numeric list (1. ..., 2. ...)
  function getDynamicOptions(text) {
    const lines = text.split('\n');
    const options = [];
    const regex = /^(\d+)\.\s+(.*)/;
    lines.forEach(line => {
        const match = line.trim().match(regex);
        if (match) {
            options.push({ id: match[1], label: match[0] });
        }
    });
    return options;
  }

  function handleQuickReply(id) {
    setInputValue(id);
    setTimeout(() => {
        chatApi.sendPatientMessage(sessionId, id).then(() => fetchMessages());
        setInputValue('');
    }, 100);
  }

  if (loading) {
    return <div className="flex justify-center items-center h-full"><FaSpinner className="animate-spin text-4xl text-blue-500" /></div>;
  }

  if (!sessionId) {
      return <RegistrationForm onSubmit={handleRegister} />;
  }

  async function handleReset() {
    try {
        setSending(true);
        await chatApi.sendPatientMessage(sessionId, "0");
        await fetchMessages();
        setActiveModal(null);
        setSelectedSpecialty(null);
    } catch (err) {
        console.error("Error resetting chat", err);
    } finally {
        setSending(false);
    }
  }

  async function handleEndChat() {
    if (!confirm("¿Estás seguro de que deseas finalizar el chat?")) return;
    try {
        await chatApi.closePatientSession(sessionId);
        localStorage.removeItem('chat_session_id');
        setSessionId(null);
        setMessages([]);
        setStatus('closed');
    } catch (err) {
        console.error("Error ending chat", err);
        localStorage.removeItem('chat_session_id');
        setSessionId(null);
    }
  }

  // Determine input state
  const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
  const isSystem = lastMsg?.sender_type === 'system';
  const isMenu = isSystem && (
    lastMsg?.content.includes('Seleccione una opción:') || 
    lastMsg?.content.includes('digite el número de su opción') ||
    lastMsg?.content.includes('Elija una opción:')
  );

  const currentMenuOptions = isMenu ? 
    (getDynamicOptions(lastMsg.content).length > 0 ? getDynamicOptions(lastMsg.content) : defaultMenuOptions) 
    : [];

  const isClosed = status === 'closed' || status === 'terminated';
  const isWaiting = status === 'waiting_receptionist';
  const inputDisabled = isWaiting || sending || isMenu || isClosed;

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header Updated */}
      <div className="bg-white border-b border-gray-200 shadow-sm px-6 py-4 flex justify-between items-center h-20 shrink-0 z-10 relative">
        <div className="flex items-center gap-4">
          <img src={logoGOI} alt="GOI" className="h-10 w-auto object-contain" />
          <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 leading-tight">Chat de Atención</h2>
            <p className="text-xs text-slate-500 font-medium">Wolf Medic - Estamos contigo</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border ${
                isWaiting ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                isClosed ? 'bg-gray-100 text-gray-500 border-gray-200' : 
                'bg-green-50 text-green-700 border-green-200'
            }`}>
               <span className={`w-2 h-2 rounded-full ${
                   isWaiting ? 'bg-yellow-500' : 
                   isClosed ? 'bg-gray-400' : 
                   'bg-green-500 animate-pulse'
               }`}></span>
               {isWaiting ? 'Validando...' : (isClosed ? 'Finalizado' : 'En Línea')}
            </div>

            {!isClosed && (
                <>
                    <button 
                        onClick={handleReset}
                        className="px-3 py-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 bg-white border border-blue-100 rounded-full transition-all duration-200 shadow-sm whitespace-nowrap"
                        title="Volver al Menú Principal"
                    >
                        Volver al Menú
                    </button>
                    <button 
                        onClick={handleEndChat}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200"
                        title="Finalizar Chat"
                    >
                        <FaPowerOff className="text-lg" />
                    </button>
                </>
            )}
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        {isMenu && !isWaiting && (
           <div className="grid grid-cols-2 gap-2 mt-2">
             {currentMenuOptions.map(opt => (
               <button 
                 key={opt.id} 
                 onClick={() => handleQuickReply(opt.id)}
                 className="p-2 text-left px-3 text-xs bg-white border border-blue-100 text-blue-600 rounded-lg hover:bg-blue-50 transition shadow-sm font-medium"
               >
                 {opt.label}
               </button>
             ))}
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

       <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2 items-end">
        <textarea
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
          placeholder={
            isWaiting ? "Esperando validación..." : 
            isMenu ? "Seleccione una opción arriba..." : 
            isClosed ? "Chat finalizado" :
            "Escribe tu mensaje..."
          }
          disabled={inputDisabled}
          rows={1}
          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 resize-none overflow-hidden min-h-[44px]"
          style={{ height: 'auto' }}
        />
        <button 
          type="submit" 
          disabled={!inputValue.trim() || inputDisabled}
          className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
        >
          {sending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
        </button>
      </form>

      {/* Modals */}
      <PatientCancelarModal
         open={activeModal === 'cancelar'} 
         onClose={() => { setActiveModal(null); handleReset(); }} 
         onSuccess={(msg) => { if(msg) alert(msg); setActiveModal(null); handleReset(); }}
      />
      <PatientConfirmarModal
         open={activeModal === 'confirmar'}
         onClose={() => { setActiveModal(null); handleReset(); }}
         onSuccess={(msg) => { alert(msg); setActiveModal(null); handleReset(); }}
      />
      <PatientAgendarModal
         open={activeModal === 'agendar'}
         onClose={() => { setActiveModal(null); setSelectedSpecialty(null); handleReset(); }}
         onSuccess={(msg) => { if(msg) alert(msg); setActiveModal(null); setSelectedSpecialty(null); handleReset(); }}
         initialSpecialtyCode={selectedSpecialty}
         initialPatientData={registrationData}
      />
    </div>
  );
}

function RegistrationForm({ onSubmit }) {
    const [name, setName] = useState('');
    const [doc, setDoc] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if(!name.trim() || !doc.trim()) return;
        onSubmit({ name, documento: doc });
    };

    return (
        <div className="bg-white h-full flex flex-col relative overflow-hidden">
            
            {/* Minimalist Background Element */}
            <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-blue-50/30 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 bg-brand-accent-50/20 rounded-full blur-3xl -z-10" />

            {/* Admin Login Button - Premium Style */}
            <div className="flex justify-end p-6 z-20">
                <button 
                    type="button"
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-2.5 px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-600 text-[13px] font-bold rounded-full border border-slate-100 shadow-sm transition-all duration-300 group active:scale-95"
                >
                    <span className="opacity-70 group-hover:opacity-100 transition-opacity">Soy Administrativo</span>
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </div>
                </button>
            </div>

            <div className="flex-1 flex flex-col justify-center px-8 sm:px-12">
                <div className="max-w-md mx-auto w-full">
                    
                    {/* Logo & Welcome */}
                    <div className="mb-10 text-center">
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center justify-center p-4 bg-white rounded-3xl shadow-xl shadow-slate-200/50 mb-8 border border-slate-50"
                        >
                            <img src={logoGOI} alt="GOI" className="h-14 object-contain" />
                        </motion.div>
                        
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">¡Hola!</h2>
                        <p className="text-slate-500 text-lg">Ingresa tus datos para comenzar tu atención.</p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Nombre Completo</label>
                            <div className="relative group">
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all duration-300 text-slate-800 placeholder:text-slate-400"
                                    placeholder="Ej: Juan Pérez"
                                    required 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Número de Documento</label>
                             <input 
                                type="text" 
                                value={doc}
                                onChange={e => setDoc(e.target.value)}
                                className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all duration-300 text-slate-800 placeholder:text-slate-400"
                                placeholder="Ej: 123456789"
                                required 
                            />
                        </div>

                        <button 
                            type="submit"
                            className="w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-2xl hover:bg-blue-700 transition-all active:scale-[0.97] shadow-lg shadow-blue-500/30 flex justify-center items-center gap-2 mt-4 group"
                        >
                            Iniciar Chat 
                            <FaPaperPlane className="text-sm group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                        </button>
                    </form>

                    <p className="mt-12 text-center text-[11px] text-slate-400 px-4 leading-relaxed">
                        Al continuar, aceptas nuestra política de tratamiento de datos personales de acuerdo a la Ley 1581.
                    </p>
                </div>
            </div>
        </div>
    );
}
