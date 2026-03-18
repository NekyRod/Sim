import React, { useState, useEffect, useRef } from 'react';
import { chatApi } from '../../api/chat';
import ChatBubble from '../chat/ChatBubble';
import { 
  FaPaperPlane, FaSpinner, FaCheck, FaTimes, FaBan, 
  FaSearch, FaChevronLeft, FaTrashAlt, FaCommentDots 
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminChatDrawer({ isOpen, onClose, initialSessionId }) {
  const [sessions, setSessions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState('all');
  const [inputValue, setInputValue] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [showList, setShowList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  const messagesEndRef = useRef(null);
  const selectedSession = sessions.find(s => s.id === selectedId);
  const isWaiting = selectedSession?.status === 'waiting_receptionist';

  // Handle initial session from notifications
  useEffect(() => {
    if (initialSessionId) {
      setSelectedId(initialSessionId);
      setShowList(false);
    }
  }, [initialSessionId]);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingList(true); // Show loader immediately on open/filter change
    fetchSessions();
    const interval = setInterval(fetchSessions, 10000);
    return () => clearInterval(interval);
  }, [isOpen, filter]);

  useEffect(() => {
    if (isOpen && selectedId) {
      setLoadingMessages(true);
      fetchMessages(selectedId);
      const interval = setInterval(() => fetchMessages(selectedId), 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen, selectedId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchSessions = async () => {
    try {
      const status = filter === 'all' ? null : filter;
      const data = await chatApi.getSessions(status);
      if (Array.isArray(data)) {
        setSessions(data.filter(s => s.status !== 'bot'));
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchMessages = async (id) => {
    try {
      const data = await chatApi.getAdminMessages(id);
      if (Array.isArray(data)) {
        setMessages(data);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectSession = (id) => {
    setLoadingMessages(true);
    setSelectedId(id);
    setMessages([]);
    setShowList(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !selectedId) return;

    try {
      await chatApi.sendAdminMessage(selectedId, inputValue);
      setInputValue('');
      fetchMessages(selectedId);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleValidate = async (action) => {
    if (!selectedId) return;
    try {
      await chatApi.validateSession(selectedId, action);
      fetchSessions();
    } catch (err) {
      console.error("Error validating session:", err);
    }
  };

  const handleCloseSession = async () => {
    if (!selectedId || !window.confirm("¿Cerrar esta conversación?")) return;
    try {
      await chatApi.closeSession(selectedId);
      fetchSessions();
      setSelectedId(null);
      setShowList(true);
      setMessages([]);
    } catch (err) {
      console.error("Error closing session:", err);
    }
  };

  const toggleSelection = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === sessions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sessions.map(s => s.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`¿Eliminar ${selectedIds.length} conversaciones?`)) return;
    try {
      await chatApi.deleteSessions(selectedIds);
      setSelectedIds([]);
      setIsSelectionMode(false);
      fetchSessions();
    } catch (err) {
      console.error("Error deleting sessions:", err);
      alert("Error eliminando conversaciones");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (Slightly dimmed) */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-[9998]"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-screen w-full max-w-[400px] bg-white shadow-2xl z-[9999] flex flex-col border-l border-gray-100"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-blue-600 text-white shrink-0">
               <div className="flex items-center gap-2">
                 {!showList && selectedId && (
                   <button 
                     onClick={() => {
                       setShowList(true);
                       setSelectedId(null);
                       setMessages([]);
                     }}
                     className="p-2 hover:bg-white/20 rounded-full transition-colors"
                   >
                     <FaChevronLeft />
                   </button>
                 )}
                 <h2 className="font-bold flex items-center gap-2">
                   <FaCommentDots className="text-blue-200" />
                   {showList ? 'Chats Administrativos' : (selectedSession?.patient_name || 'Conversación')}
                 </h2>
               </div>
               <button 
                 onClick={onClose}
                 className="p-2 hover:bg-white/20 rounded-full transition-colors"
               >
                 <FaTimes />
               </button>
            </div>

            {/* Selection Actions (If any) */}
            {showList && isSelectionMode && (
              <div className="bg-blue-700 px-4 py-2 flex justify-between items-center text-xs text-white border-t border-blue-500">
                 <div className="flex items-center gap-2">
                   <input 
                     type="checkbox" 
                     checked={sessions.length > 0 && selectedIds.length === sessions.length}
                     onChange={handleSelectAll}
                     className="w-3 h-3 cursor-pointer"
                   />
                   <span>{selectedIds.length} seleccionados</span>
                 </div>
                 <div className="flex gap-3">
                   <button 
                     onClick={handleDeleteSelected}
                     disabled={!selectedIds.length}
                     className="font-bold flex items-center gap-1 hover:text-red-200 disabled:opacity-50 transition-all cursor-pointer"
                   >
                     <FaTrashAlt size={10} /> Eliminar
                   </button>
                   <button 
                     onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }}
                     className="opacity-80 hover:opacity-100 transition-all font-medium cursor-pointer"
                   >
                     Cancelar
                   </button>
                 </div>
              </div>
            )}

            {/* List View */}
            {showList ? (
              <div className="flex flex-1 flex-col overflow-hidden relative">
                {/* Internal Tabs/Filters */}
                <div className="p-3 bg-gray-50 flex gap-2 border-b border-gray-100 items-center">
                  <div className="flex-1 flex gap-1">
                    {['all', 'open', 'waiting_receptionist'].map(f => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`flex-1 text-[9px] uppercase font-bold py-1.5 rounded-md transition-all ${
                          filter === f ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                        }`}
                      >
                        {f === 'waiting_receptionist' ? 'Validar' : f === 'all' ? 'Todos' : 'Abiertos'}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setIsSelectionMode(!isSelectionMode)}
                    className={`p-1.5 rounded transition-colors ${isSelectionMode ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:bg-gray-200'}`}
                    title="Selección múltiple"
                  >
                    <FaCheck />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto relative">
                  {loadingList && (
                    <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center text-gray-400">
                      <FaSpinner className="animate-spin text-3xl mb-4 text-blue-500" />
                      <p className="text-sm font-medium text-gray-600">Actualizando conversaciones...</p>
                    </div>
                  )}
                  
                  {!loadingList && sessions.length === 0 && (
                    <div className="p-10 text-center">
                       <p className="text-gray-400 text-sm italic">No hay conversaciones activas</p>
                    </div>
                  )}

                  {sessions.map(s => (
                    <div 
                      key={s.id}
                      onClick={() => {
                        if (isSelectionMode) toggleSelection(s.id);
                        else handleSelectSession(s.id);
                      }}
                      className={`p-4 border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition-colors relative flex gap-3 items-center ${
                        selectedIds.includes(s.id) ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      {isSelectionMode && (
                        <div className="shrink-0 flex items-center">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.includes(s.id)}
                            readOnly
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 pointer-events-none"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-gray-800 text-sm">{s.patient_name || `Paciente #${s.patient_id}`}</span>
                          <span className="text-[10px] text-gray-400">
                             {new Date(s.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-xs text-gray-500 truncate max-w-[200px]">CC: {s.document_number || 'N/A'}</span>
                           <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                             s.status === 'waiting_receptionist' ? 'bg-amber-100 text-amber-700' : 
                             s.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                           }`}>
                             {s.status === 'waiting_receptionist' ? 'Por Validar' : s.status}
                           </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Chat View */
              <div className="flex flex-1 flex-col overflow-hidden bg-slate-50 relative">
                {/* Chat Details Header (Mini) */}
                <div className="px-4 py-2 bg-white border-b border-gray-100 flex justify-between items-center text-xs text-gray-500">
                   <span>ID: {selectedId} | CC: {selectedSession?.document_number || 'N/A'}</span>
                   <div className="flex gap-1">
                      {isWaiting && (
                        <button onClick={() => handleValidate('ACTIVO')} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Validar Activo"><FaCheck /></button>
                      )}
                      <button onClick={handleCloseSession} className="p-1 text-red-400 hover:bg-red-50 rounded" title="Cerrar"><FaTrashAlt /></button>
                   </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
                  {loadingMessages && messages.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10">
                       <FaSpinner className="animate-spin text-2xl text-blue-500 mb-2" />
                       <p className="text-xs text-gray-400">Cargando mensajes...</p>
                    </div>
                  )}
                  
                  {messages.map((m, i) => (
                    <div key={m.id || i}>
                       <ChatBubble message={m} />
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Validation Banner */}
                {isWaiting && (
                  <div className="p-3 bg-amber-50 border-t border-amber-100 flex flex-col gap-2">
                    <p className="text-xs font-semibold text-amber-800 text-center">Validación de paciente requerida</p>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => handleValidate('ACTIVO')}
                         className="flex-1 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                       >
                         <FaCheck /> Es Activo
                       </button>
                       <button 
                         onClick={() => handleValidate('NO_ACTIVO')}
                         className="flex-1 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                       >
                         <FaBan /> No Activo
                       </button>
                    </div>
                  </div>
                )}

                {/* Input Area */}
                {!isWaiting && (
                  <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 flex gap-2 items-end">
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
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden min-h-[40px] bg-gray-50"
                      placeholder="Responde aquí..."
                      rows={1}
                    />
                    <button 
                      type="submit" 
                      className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200 flex-shrink-0"
                    >
                      <FaPaperPlane />
                    </button>
                  </form>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
