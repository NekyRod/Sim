// src/App.jsx

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  FaClipboardList, FaCalendarCheck, FaCalendarDay, FaCalendarWeek,
  FaClock, FaChartBar, FaPowerOff, FaCog, FaSearch,
  FaUser, FaUserMd, FaTags, FaFileMedical, FaCalendarTimes,
  FaIdCard, FaMapMarkerAlt, FaArrowLeft
} from 'react-icons/fa';
import Agendamiento from './pages/Agendamiento.jsx';
import ControlAgendas from './pages/ControlAgendas.jsx';
import AgendaDiaria from './pages/AgendaDiaria.jsx';
import AgendaSemanal from './pages/AgendaSemanal.jsx';
import CrearDisponibilidad from './pages/CrearDisponibilidad.jsx';
import Informes from './pages/Informes.jsx';
import LoginPage from './pages/LoginPage.jsx';
import Principal from './pages/Principal.jsx';
import logoGOI from './img/logo_goi.jpg';
import Pacientes from './pages/config/Pacientes.jsx';
import Profesionales from './pages/config/Profesionales.jsx';
import TiposServicio from './pages/config/TiposServicio.jsx';
import Especialidades from './pages/config/Especialidades.jsx';
import TiposPBS from './pages/config/TiposPBS.jsx';
import Festivos from './pages/config/Festivos.jsx';
import TiposIdentificacion from './pages/config/TiposIdentificacion.jsx';
import CiudadesResidencia from './pages/config/CiudadesResidencia.jsx';
import { apiFetch } from './api/client';

// ========== COMPONENTE DE BÚSQUEDA ==========
function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [resultados, setResultados] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim().length >= 1) {  // ← CAMBIADO: busca desde el primer carácter
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
    
    // ← CAMBIADO: Disparar evento con TODOS los datos del paciente
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
    <div className="search-container">
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Busca pacientes por nombre o documento de ID"
        />
        <FaSearch style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#999',
          fontSize: '14px'
        }} />
      </div>

      {showResults && (
        <div className="search-results">
          {loading && (
            <div className="search-loading">Buscando...</div>
          )}
          
          {!loading && resultados.length === 0 && (
            <div className="search-no-results">No se encontraron pacientes</div>
          )}

          {!loading && resultados.length > 0 && (
            <ul>
              {resultados.map((paciente) => (
                <li key={paciente.id} onClick={() => handleSelectPaciente(paciente)}>
                  <div className="search-result-name">{paciente.nombre_completo}</div>
                  <div className="search-result-doc">
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

// ========== COMPONENTE PRINCIPAL CON RUTAS ==========
function AppContent() {
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('auth_token');
    if (token) setIsAuthenticated(true);
  }, []);

  function handleLogout() {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    setIsAuthenticated(false);
    setShowConfigMenu(false); // ← Reset menú config
  }
  function handleAbrirConfiguracion() {
    setShowConfigMenu(true);
  }

  function handleRegresar() {
    setShowConfigMenu(false);
  }
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }
  return (
    <div>
      {/* BARRA DE BÚSQUEDA - ARRIBA DE TODO */}
      <div className="search-bar-wrapper">
        <SearchBar />
      </div>

      {/* HEADER ORIGINAL */}
      <header>
        <div className="logo-container">
          <img src={logoGOI} alt="GOI" className="logo-img" />
        </div>

        {/* NAVEGACIÓN */}
        <nav className={showConfigMenu ? 'config-mode' : ''}>
          {!showConfigMenu ? (
            <>
              <NavLink to="/agendamiento" className={({ isActive }) => isActive ? 'menu-btn active' : 'menu-btn'}>
                <FaClipboardList className="icon" />
                <span>Agendamiento</span>
              </NavLink>

              <NavLink to="/control-agendas" className={({ isActive }) => isActive ? 'menu-btn active' : 'menu-btn'}>
                <FaCalendarCheck className="icon" />
                <span>Control de Agendas</span>
              </NavLink>

              <NavLink to="/agenda-diaria" className={({ isActive }) => isActive ? 'menu-btn active' : 'menu-btn'}>
                <FaCalendarDay className="icon" />
                <span>Agenda diaria</span>
              </NavLink>

              <NavLink to="/agenda-semanal" className={({ isActive }) => isActive ? 'menu-btn active' : 'menu-btn'}>
                <FaCalendarWeek className="icon" />
                <span>Agenda semanal</span>
              </NavLink>

              <NavLink to="/crear-disponibilidad" className={({ isActive }) => isActive ? 'menu-btn active' : 'menu-btn'}>
                <FaClock className="icon" />
                <span>Crear Disponibilidad</span>
              </NavLink>

              <NavLink to="/informes" className={({ isActive }) => isActive ? 'menu-btn active' : 'menu-btn'}>
                <FaChartBar className="icon" />
                <span>Informes</span>
              </NavLink>

              <button onClick={handleAbrirConfiguracion} className="menu-btn">
                <FaCog className="icon" />
                <span>Configuración</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={handleRegresar} className="menu-btn">
                <FaArrowLeft className="icon" />
                <span>Regresar</span>
              </button>

              <NavLink to="/pacientes" className={({ isActive }) => isActive ? 'menu-btn active' : 'menu-btn'}>
                <FaUser className="icon" />
                <span>Pacientes</span>
              </NavLink>

              <NavLink to="/profesionales" className={({ isActive }) => isActive ? 'menu-btn active' : 'menu-btn'}>
                <FaUserMd className="icon" />
                <span>Profesionales</span>
              </NavLink>

              <NavLink to="/tipos-servicio" className={({ isActive }) => isActive ? 'menu-btn active' : 'menu-btn'}>
                <FaTags className="icon" />
                <span>Tipos de Servicio</span>
              </NavLink>

              <NavLink to="/especialidades" className={({ isActive }) => isActive ? 'menu-btn active' : 'menu-btn'}>
                <FaTags className="icon" />
                <span>Especialidades</span>
              </NavLink>

              <NavLink to="/tipos-pbs" className={({ isActive }) => isActive ? 'menu-btn active' : 'menu-btn'}>
                <FaTags className="icon" />
                <span>Tipos PBS</span>
              </NavLink>

              <NavLink to="/festivos" className={({ isActive }) => isActive ? 'menu-btn active' : 'menu-btn'}>
                <FaCalendarTimes className="icon" />
                <span>Festivos</span>
              </NavLink>

              <NavLink to="/tipos-identificacion" className={({ isActive }) => isActive ? 'menu-btn active' : 'menu-btn'}>
                <FaIdCard className="icon" />
                <span>Tipos Identificación</span>
              </NavLink>

              <NavLink to="/ciudades-residencia" className={({ isActive }) => isActive ? 'menu-btn active' : 'menu-btn'}>
                <FaMapMarkerAlt className="icon" />
                <span>Ciudades Residencia</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* LOGOUT BUTTON */}
        <div className="header-right">
          <button onClick={handleLogout} className="logout-btn" title="Cerrar sesión">
            <FaPowerOff />
          </button>
        </div>
      </header>

      {/* CONTENIDO - RUTAS */}
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/agendamiento" />} />
          <Route path="/agendamiento" element={<Agendamiento />} />
          <Route path="/control-agendas" element={<ControlAgendas />} />
          <Route path="/agenda-diaria" element={<AgendaDiaria />} />
          <Route path="/agenda-semanal" element={<AgendaSemanal />} />
          <Route path="/crear-disponibilidad" element={<CrearDisponibilidad />} />
          <Route path="/informes" element={<Informes />} />
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/profesionales" element={<Profesionales />} />
          <Route path="/tipos-servicio" element={<TiposServicio />} />
          <Route path="/especialidades" element={<Especialidades />} />
          <Route path="/tipos-pbs" element={<TiposPBS />} />
          <Route path="/festivos" element={<Festivos />} />
          <Route path="/tipos-identificacion" element={<TiposIdentificacion />} />
          <Route path="/ciudades-residencia" element={<CiudadesResidencia />} />
        </Routes>
      </main>
    </div>
  );
}

// ========== EXPORT DEFAULT ==========
export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
