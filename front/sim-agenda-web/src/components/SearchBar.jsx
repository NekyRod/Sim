import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { apiFetch } from '../api/client';

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [resultados, setResultados] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim().length >= 1) {
        buscarPacientes(searchTerm);
      } else {
        setResultados([]);
        setShowResults(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  async function buscarPacientes(termino) {
    setLoading(true);
    try {
      const resp = await apiFetch(`${BACKEND_URL}/pacientes/buscar?q=${encodeURIComponent(termino)}`);
      setResultados(resp.data || []);
      setShowResults(true);
    } catch (err) {
      console.error('Error buscando pacientes:', err);
      setResultados([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectPaciente(paciente) {
    const currentPath = location.pathname;
    
    const event = new CustomEvent('pacienteSeleccionado', {
      detail: paciente
    });
    window.dispatchEvent(event);

    if (!currentPath.includes('/agendamiento') && !currentPath.includes('/pacientes')) {
      navigate('/agendamiento');
    }

    setSearchTerm('');
    setShowResults(false);
    setResultados([]);
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (!e.target.closest('.search-container')) {
        setShowResults(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="search-container relative w-full max-w-2xl mx-auto mb-4 z-50">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Busca pacientes por nombre o documento de ID"
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
        />
        <FaSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50">
          {loading && (
            <div className="p-4 text-center text-gray-500">Buscando...</div>
          )}
          
          {!loading && resultados.length === 0 && (
            <div className="p-4 text-center text-gray-500">No se encontraron pacientes</div>
          )}

          {!loading && resultados.length > 0 && (
            <ul>
              {resultados.map((paciente) => (
                <li 
                  key={paciente.id} 
                  onClick={() => handleSelectPaciente(paciente)}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                >
                  <div className="font-medium text-gray-800">{paciente.nombre_completo}</div>
                  <div className="text-sm text-gray-500">
                    {paciente.tipo_identificacion} - {paciente.numero_identificacion}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
