import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OdontogramBoard } from '../components/odontograma/OdontogramBoard';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeft, FaUser, FaTooth } from 'react-icons/fa';
import { apiFetch } from '../api/client';

export default function OdontogramPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profesional } = useAuth();
  const [paciente, setPaciente] = useState(null);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  
  const profesionalId = profesional?.id;

  useEffect(() => {
    async function loadPaciente() {
      try {
        const data = await apiFetch(`${BACKEND_URL}/pacientes/${id}`);
        setPaciente(data);
      } catch (err) {
        console.error("Error loading patient info for odontogram:", err);
      }
    }
    if (id) loadPaciente();
  }, [id, BACKEND_URL]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Premium Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all border border-transparent hover:border-gray-200 shadow-sm md:shadow-none"
              title="Volver al Expediente"
            >
              <FaArrowLeft size={16} />
            </button>
            <div className="h-10 w-[1px] bg-gray-200 hidden md:block"></div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <FaTooth className="text-blue-600" />
                <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">Odontograma</h1>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-gray-500 uppercase tracking-widest">
                <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                  <FaUser className="text-[10px]" /> {paciente?.nombre_completo || `Paciente #${id}`}
                </span>
                <span className="hidden md:inline">•</span>
                <span className="hidden md:inline text-gray-400">ID: {paciente?.numero_identificacion || '-'}</span>
              </div>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
             <div className="text-right">
                <div className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Profesional en Sesión</div>
                <div className="text-sm font-bold text-gray-700">{profesional?.nombre || 'Administrador'}</div>
             </div>
             <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xs">
                {(profesional?.nombre || 'A').charAt(0)}
             </div>
          </div>
        </div>
      </div>
      
      <div className="p-6 max-w-7xl mx-auto">
        <OdontogramBoard 
          pacienteId={parseInt(id, 10)} 
          profesionalId={profesionalId} 
          onCancel={() => navigate(-1)}
          onFinalizado={() => navigate(-1)}
        />
      </div>
    </div>
  );
}
