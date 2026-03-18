import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaComments } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { chatApi } from '../../api/chat';

export default function ChatFab({ onToggleDrawer }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifs = async () => {
       try {
         const resp = await chatApi.getNotifications();
         if (Array.isArray(resp)) {
             setUnreadCount(resp.length);
         }
       } catch (err) {
         console.error("ChatFab poll error", err);
       }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleDrawer();
        }}
        className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-600/40 hover:bg-blue-700 transition-all cursor-pointer border-none outline-none group active:bg-blue-800"
        aria-label="Chat con administrador"
      >
        <div className="pointer-events-none">
          <FaComments className="text-3xl" />
        </div>
        
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md ring-2 ring-white pointer-events-none z-10"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
