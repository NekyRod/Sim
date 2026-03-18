import React, { useState, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { chatApi } from '../../api/chat'; // Adjust path if needed

/**
 * NotificationBell
 * Shows badge count of unread notifications.
 * Opens a popover with list.
 * Props: 
 *  - onSelectSession: callback when clicking a notification to open chat management
 */
export default function NotificationBell({ onSelectSession }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Poll notifications
    const fetchNotifs = async () => {
       try {
         const resp = await chatApi.getNotifications(); // get unread
         // Returns array of objects {id, type, session_id, payload, created_at}
         // Filter or just use length
         // Assuming getNotifications returns UNREAD ones only as per backend.
         if (Array.isArray(resp)) {
             setNotifications(resp);
             setUnreadCount(resp.length);
         }
       } catch (err) {
         console.error("Notif poll error", err);
       }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000); // 10s polling
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (n) => {
    try {
      await chatApi.markRead(n.id);
      // Remove from list
      setNotifications(prev => prev.filter(x => x.id !== n.id));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Navigate/Open chat
      if (onSelectSession) {
          onSelectSession(n.session_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    try {
      await chatApi.clearNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Clear all notifs error", err);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative transition-colors"
      >
        <FaBell className="text-lg" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0 }}
              className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Popover */}
      <AnimatePresence>
        {open && (
           <>
             {/* Backdrop */}
             <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
             
             <motion.div 
               initial={{ opacity: 0, y: 10, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
             >
               <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                 <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-gray-700">Notificaciones</h3>
                    <span className="text-[10px] text-blue-600 font-medium">{unreadCount} nuevas</span>
                 </div>
                 {unreadCount > 0 && (
                   <button 
                    onClick={handleClearAll}
                    className="text-[10px] px-2 py-1 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-gray-500 hover:text-red-500 transition-colors shadow-sm font-medium"
                   >
                     Limpiar todas
                   </button>
                 )}
               </div>
               
               <div className="max-h-80 overflow-y-auto">
                 {notifications.length === 0 ? (
                   <div className="p-8 text-center text-gray-400 text-sm">
                     No hay notificaciones
                   </div>
                 ) : (
                   <ul className="divide-y divide-gray-50">
                     {notifications.map(n => {
                       const payload = n.payload || {}; // e.g. { documento: "123"}
                       const isValidation = n.type === 'validation_required';
                       const isHandoff = n.type === 'handoff_required';
                       
                       return (
                         <li 
                           key={n.id} 
                           onClick={() => handleMarkRead(n)}
                           className="p-3 hover:bg-blue-50 cursor-pointer transition-colors"
                         >
                           <div className="flex gap-3">
                             <div className={`
                               w-2 h-2 mt-2 rounded-full shrink-0
                               ${isValidation ? 'bg-yellow-400' : isHandoff ? 'bg-red-400' : 'bg-blue-400'}
                             `} />
                             <div>
                               <p className="text-sm font-medium text-gray-800">
                                 {isValidation ? 'Validación Requerida' : isHandoff ? 'Atención Asesor' : 'Nuevo Mensaje'}
                               </p>
                               <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                 {isValidation && `Paciente Doc: ${payload.documento}`}
                                 {isHandoff && `Motivo: ${payload.reason || 'Soporte'}`}
                                 {!isValidation && !isHandoff && 'Tienes un nuevo mensaje'}
                               </p>
                               <p className="text-[10px] text-gray-400 mt-1">
                                 {new Date(n.created_at).toLocaleTimeString()}
                               </p>
                             </div>
                           </div>
                         </li>
                       );
                     })}
                   </ul>
                 )}
               </div>
             </motion.div>
           </>
        )}
      </AnimatePresence>
    </div>
  );
}
