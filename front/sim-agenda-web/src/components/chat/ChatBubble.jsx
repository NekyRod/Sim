import React from 'react';
import { motion } from 'framer-motion';
import { FaRobot, FaUser, FaUserNurse } from 'react-icons/fa';

export default function ChatBubble({ message }) {
  const isSystem = message.sender_type === 'system';
  const isReceptionist = message.sender_type === 'receptionist';
  const isPatient = message.sender_type === 'patient';
  
  // Align: System/Receptionist -> Left, Patient -> Right
  const isLeft = isSystem || isReceptionist;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex w-full mb-4 ${isLeft ? 'justify-start' : 'justify-end'}`}
    >
      <div className={`flex max-w-[80%] ${isLeft ? 'flex-row' : 'flex-row-reverse'} gap-2`}>
        {/* Avatar */}
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs shadow-sm
          ${isSystem ? 'bg-indigo-500' : isReceptionist ? 'bg-pink-500' : 'bg-blue-600'}
        `}>
          {isSystem && <FaRobot />}
          {isReceptionist && <FaUserNurse />}
          {isPatient && <FaUser />}
        </div>
        
        {/* Bubble */}
        <div className={`
          p-3 rounded-2xl text-sm shadow-sm whitespace-pre-wrap
          ${isSystem ? 'bg-white border border-gray-100 text-gray-700 rounded-tl-none' : ''}
          ${isReceptionist ? 'bg-pink-50 border border-pink-100 text-pink-900 rounded-tl-none' : ''}
          ${isPatient ? 'bg-blue-600 text-white rounded-tr-none' : ''}
        `}>
          {message.content}
          <div className={`text-[10px] mt-1 ${isPatient ? 'text-blue-200' : 'text-gray-400'}`}>
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
