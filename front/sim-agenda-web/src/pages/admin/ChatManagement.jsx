import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { chatApi } from '../../api/chat';
import ChatBubble from '../../components/chat/ChatBubble';
import { FaPaperPlane, FaSpinner, FaCheck, FaTimes, FaBan, FaSearch } from 'react-icons/fa';

export default function ChatManagement() {
  const [sessions, setSessions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState('all');
  const [inputValue, setInputValue] = useState('');
  const [loadingList, setLoadingList] = useState(true);

  // Selection state for deletion
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  const messagesEndRef = useRef(null);
  const location = useLocation();

  const selectedSession = sessions.find(s => s.id === selectedId);
  const isWaiting = selectedSession?.status === 'waiting_receptionist';

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, [filter]);

  useEffect(() => {
    if (selectedId) {
      fetchMessages(selectedId);
      const interval = setInterval(() => fetchMessages(selectedId), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedId]);



  const fetchSessions = async () => {
    try {
      const status = filter === 'all' ? null : filter;
      const data = await chatApi.getSessions(status);
      if (Array.isArray(data)) {
        // Filter out "bot" status unless specifically requested?
        // User wants to hide them. "bot" is not "open" nor "waiting".
        // If filter is 'all', maybe show them? No, user said "no le aparezca al admin".
        // So we filter excludes 'bot'.
        const visible = data.filter(s => s.status !== 'bot');
        setSessions(visible);
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
    }
  };

  function toggleSelection(id) {
      if (selectedIds.includes(id)) {
          setSelectedIds(selectedIds.filter(i => i !== id));
      } else {
          setSelectedIds([...selectedIds, id]);
      }
  }

  function handleSelectAll() {
      if (selectedIds.length === sessions.length) {
          setSelectedIds([]);
      } else {
          setSelectedIds(sessions.map(s => s.id));
      }
  }

  async function handleDeleteSelected() {
      if (!selectedIds.length) return;
      if (!confirm(`¿Eliminar ${selectedIds.length} conversaciones?`)) return;
      
      try {
          await chatApi.deleteSessions(selectedIds);
          setSelectedIds([]);
          setIsSelectionMode(false);
          // If current selected chat was deleted, clear it
          if (selectedIds.includes(selectedId)) {
              setSelectedId(null);
              setMessages([]);
          }
          fetchSessions();
      } catch (err) {
          console.error(err);
          alert("Error eliminando conversaciones");
      }
  }

  const handleSelectSession = (session) => {
    setSelectedId(session.id);
    setMessages([]);
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
      alert("Error enviando mensaje");
    }
  };

  const handleValidate = async (action) => {
    if (!selectedId) return;
    try {
      await chatApi.validateSession(selectedId, action);
      fetchSessions();
    } catch (err) {
      console.error("Error validating session:", err);
      alert("Error validando sesión");
    }
  };

  const handleClose = async () => {
    if (!selectedId) return;
    if (!confirm("¿Cerrar esta conversación?")) return;

    try {
      await chatApi.closeSession(selectedId);
      fetchSessions();
      setSelectedId(null);
      setMessages([]);
    } catch (err) {
      console.error("Error closing session:", err);
      alert("Error cerrando sesión");
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Sidebar List */}
      <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/50">
        <div className="p-4 border-b border-gray-100">
          <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold text-gray-700">Chats Activos</h2>
              
              <div className="flex gap-2">
                  {isSelectionMode ? (
                      <>
                        <button 
                            onClick={handleDeleteSelected}
                            disabled={!selectedIds.length}
                            className="text-red-500 hover:bg-red-50 p-1.5 rounded text-xs font-bold disabled:opacity-50"
                        >
                            Eliminar ({selectedIds.length})
                        </button>
                        <button 
                            onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }}
                            className="text-gray-500 hover:bg-gray-100 p-1.5 rounded text-xs"
                        >
                            Cancelar
                        </button>
                      </>
                  ) : (
                    <button 
                        onClick={() => setIsSelectionMode(true)}
                        className="text-blue-600 hover:bg-blue-50 p-1.5 rounded text-xs"
                    >
                        Seleccionar
                    </button>
                  )}
              </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setFilter('open')}
              className={`flex-1 text-xs py-1 rounded ${filter==='open' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}
            >
              Abiertos
            </button>
            <button 
              onClick={() => setFilter('waiting_receptionist')}
              className={`flex-1 text-xs py-1 rounded ${filter==='waiting_receptionist' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'}`}
            >
              Validación
            </button>
            <button
               onClick={() => setFilter('all')} 
               className={`flex-1 text-xs py-1 rounded ${filter==='all' ? 'bg-gray-300 text-gray-800' : 'bg-gray-200 text-gray-600'}`}
            >
               Todos
            </button>
          </div>
          
          {isSelectionMode && (
              <div className="mt-2 flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={sessions.length > 0 && selectedIds.length === sessions.length}
                    onChange={handleSelectAll}
                    id="selectAll"
                  />
                  <label htmlFor="selectAll" className="text-xs text-gray-500 cursor-pointer">Seleccionar todos</label>
              </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loadingList && <div className="p-4 text-center"><FaSpinner className="animate-spin" /></div>}
          {!loadingList && sessions.length === 0 && <div className="p-4 text-center text-gray-400 text-sm">No hay chats</div>}
          
          {sessions.map(s => (
            <div 
              key={s.id} 
              onClick={() => {
                  if (isSelectionMode) toggleSelection(s.id);
                  else handleSelectSession(s);
              }}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-white transition-colors flex gap-3 ${selectedId === s.id && !isSelectionMode ? 'bg-white border-l-4 border-l-blue-500 shadow-sm' : ''}`}
            >
              {isSelectionMode && (
                  <div className="flex items-center">
                    <input 
                        type="checkbox" 
                        checked={selectedIds.includes(s.id)}
                        onChange={() => toggleSelection(s.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
              )}
              <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                     <div>
                        <span className="font-bold text-gray-800 text-sm block">{s.patient_name || `Paciente #${s.patient_id}`}</span>
                        {s.document_number && <span className="text-xs text-gray-500 block">CC: {s.document_number}</span>}
                     </div>
                     <span className="text-[10px] text-gray-400">{new Date(s.last_message_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                       s.status === 'waiting_receptionist' ? 'bg-yellow-100 text-yellow-700' : 
                       s.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                     }`}>
                       {s.status}
                     </span>
                  </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white relative">
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center text-gray-300 flex-col gap-2">
            <FaSearch className="text-4xl" />
            <span>Selecciona una conversación</span>
          </div>
        ) : (
          <>
            {/* Header Chat */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
              <div>
                <h3 className="font-bold text-gray-800">{selectedSession?.patient_name}</h3>
                <div className="text-xs text-gray-500 flex flex-col">
                    <span>ID Sesión: {selectedId}</span>
                    {selectedSession?.document_number && <span>CC: {selectedSession.document_number}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                {isWaiting && (
                  <>
                    <button 
                      onClick={() => handleValidate('ACTIVO')}
                      className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 flex items-center gap-1"
                    >
                      <FaCheck /> Activo
                    </button>
                    <button 
                      onClick={() => handleValidate('NO_ACTIVO')}
                      className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 flex items-center gap-1"
                    >
                      <FaBan /> No Activo
                    </button>
                  </>
                )}
                <button 
                  onClick={handleClose}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                  title="Cerrar Chat"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
              {messages.map((m, i) => <ChatBubble key={m.id || i} message={m} />)}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
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
                 className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden min-h-[40px]"
                 placeholder="Escribe una respuesta... (Shift+Enter para salto de línea)"
                 rows={1}
                 style={{ height: 'auto' }}
               />
               <button type="submit" className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 h-10 w-10 flex items-center justify-center">
                 <FaPaperPlane />
               </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
