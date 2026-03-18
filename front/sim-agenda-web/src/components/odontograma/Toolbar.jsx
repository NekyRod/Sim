import React, { useEffect, useState } from 'react';
import { useOdontogramStore } from '../../store/useOdontogramStore';
import { odontogramaApi } from '../../api/odontograma';

export const Toolbar = () => {
  const { procedimientoActivo, setProcedimientoActivo, evolucionPorcentajeActivo, setEvolucionPorcentaje } = useOdontogramStore();
  const [procedimientos, setProcedimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProcedimientos = async () => {
      try {
        const response = await odontogramaApi.getProcedimientos();
        setProcedimientos(response.data);
      } catch (error) {
        console.error("Error al cargar procedimientos", error);
        // Opcional: mostrar un toast de error si usas react-hot-toast
      } finally {
        setLoading(false);
      }
    };
    fetchProcedimientos();
  }, []);

  const borrador = { 
    id: 'eraser', 
    nombre: 'Borrador (Limpiar)', 
    es_borrador: true 
  };

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="w-full flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-gray-700">Selecciona un Hallazgo/Procedimiento:</span>
        
        {/* Selector de Porcentaje */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500 uppercase">Evolución:</label>
          <select 
            value={evolucionPorcentajeActivo}
            onChange={(e) => setEvolucionPorcentaje(e.target.value)}
            disabled={procedimientoActivo?.es_borrador}
            className="text-sm border border-gray-300 rounded-md py-1 px-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400 font-medium"
          >
            <option value="25">25% (Iniciado)</option>
            <option value="50">50% (En curso)</option>
            <option value="75">75% (Avanzado)</option>
            <option value="100">100% (Completado)</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <span className="text-sm text-gray-500">Cargando paleta clínica...</span>
      ) : (
        procedimientos.map((proc) => (
          <button
            key={proc.id}
            onClick={() => setProcedimientoActivo(proc)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm font-medium border ${
              procedimientoActivo?.id === proc.id 
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            {/* Indicador de Color */}
            <span 
              className="w-4 h-4 rounded-full border border-gray-300 shadow-sm" 
              style={{ backgroundColor: proc.color_hex || '#FFFFFF' }}
            ></span>
            {proc.nombre}
          </button>
        ))
      )}

      {/* Herramienta Borrador */}
      <button
        onClick={() => setProcedimientoActivo(borrador)}
        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm font-medium border ml-auto ${
          procedimientoActivo?.id === borrador.id 
            ? 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-200' 
            : 'border-gray-200 hover:bg-gray-50 text-gray-600'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Borrador
      </button>
    </div>
  );
};
