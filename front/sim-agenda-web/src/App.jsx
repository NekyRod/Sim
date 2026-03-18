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
import Dashboard from './pages/Dashboard.jsx';
import Manual from './pages/Manual.jsx';
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
import Procedimientos from './pages/config/Procedimientos.jsx';
import PatientChat from './pages/chat/PatientChat.jsx';
import ChatManagement from './pages/admin/ChatManagement.jsx';
import SmtpSettings from './pages/admin/SmtpSettings.jsx';
import RoleManager from './pages/admin/RoleManager.jsx';
import UserManager from './pages/admin/UserManager.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import OdontogramPage from './pages/OdontogramPage.jsx';
import PatientLayout from './layouts/PatientLayout.jsx';
import PatientDetailView from './pages/admin/PatientDetailView.jsx';

import { apiFetch } from './api/client';
import PremiumLayout from './layouts/PremiumLayout.jsx';
import { AuthProvider, useAuth } from './context/AuthContext';
import HasPermission from './components/auth/HasPermission.jsx';

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
    // const currentPath = location.pathname; // No longer needed for logic here
    
    const event = new CustomEvent('pacienteSeleccionado', {
      detail: paciente
    });
    window.dispatchEvent(event);

    // We do NOT navigate automatically anymore. 
    // AppContent listener decides if it opens Modal or if current page handles it.
    // Exception: If we are in public pages? SearchBar only exists in PremiumLayout (Admin).
    
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
  const { isAuthenticated, logout: authLogout, role } = useAuth();
  const navigate = useNavigate();
  
  console.log("AppContent Render. Auth:", isAuthenticated, "Role:", role);

  // Listen for global search selection
  useEffect(() => {
    function handlePacienteSeleccionado(e) {
      if (!isAuthenticated) return;
      const currentPath = window.location.pathname;

      // Redirect to Patient Detail Page unless we are in Agendamiento (where we populate a form)
      if (!currentPath.includes('/agendamiento')) {
         navigate(`/admin/pacientes/${e.detail.id}`);
      }
    }
    window.addEventListener('pacienteSeleccionado', handlePacienteSeleccionado);
    return () => window.removeEventListener('pacienteSeleccionado', handlePacienteSeleccionado);
  }, [isAuthenticated]);

  function handleLogout() {
    console.log("Logging out...");
    authLogout();
  }

  // 1. Routes for Authenticated Admins/Receptionists
  if (isAuthenticated) {
    if (role === 'PATIENT') {
        handleLogout();
        return <Navigate to="/" />;
    }

    return (
      <>
        <PremiumLayout 
          searchBar={<SearchBar />}
          onLogout={handleLogout}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            <Route path="/agendamiento" element={
              <HasPermission group="AGENDAMIENTO" action="view" fallback={<Navigate to="/dashboard" />}>
                <Agendamiento />
              </HasPermission>
            } />

            {/* Módulo de Agendas */}
            <Route path="/control-agendas" element={
              <HasPermission group="AGENDAS" action="view" fallback={<Navigate to="/dashboard" />}>
                <ControlAgendas />
              </HasPermission>
            } />
            <Route path="/agenda-diaria" element={
              <HasPermission group="AGENDAS" action="view" fallback={<Navigate to="/dashboard" />}>
                <AgendaDiaria />
              </HasPermission>
            } />
            <Route path="/agenda-semanal" element={
              <HasPermission group="AGENDAS" action="view" fallback={<Navigate to="/dashboard" />}>
                <AgendaSemanal />
              </HasPermission>
            } />

            <Route path="/crear-disponibilidad" element={
              <HasPermission group="DISPONIBILIDAD" action="view" fallback={<Navigate to="/dashboard" />}>
                <CrearDisponibilidad />
              </HasPermission>
            } />

            <Route path="/informes" element={
              <HasPermission group="INFORMES" action="view" fallback={<Navigate to="/dashboard" />}>
                <Informes />
              </HasPermission>
            } />
            <Route path="/manual" element={<Manual />} />
            <Route path="/pacientes" element={
              <HasPermission group="PACIENTES" action="view" fallback={<Navigate to="/dashboard" />}>
                <Pacientes />
              </HasPermission>
            } />
            <Route path="/pacientes/:id/odontograma" element={
              <HasPermission group="PACIENTES" action="view" fallback={<Navigate to="/dashboard" />}>
                <OdontogramPage />
              </HasPermission>
            } />
            
            {/* Configuración del Sistema */}
            <Route path="/profesionales" element={
              <HasPermission group="PROFESIONALES" action="view" fallback={<Navigate to="/dashboard" />}>
                <Profesionales />
              </HasPermission>
            } />
            <Route path="/tipos-servicio" element={
              <HasPermission group="TIPOS_SERVICIO" action="view" fallback={<Navigate to="/dashboard" />}>
                <TiposServicio />
              </HasPermission>
            } />
            <Route path="/especialidades" element={
              <HasPermission group="ESPECIALIDADES" action="view" fallback={<Navigate to="/dashboard" />}>
                <Especialidades />
              </HasPermission>
            } />
            <Route path="/tipos-pbs" element={
              <HasPermission group="PBS" action="view" fallback={<Navigate to="/dashboard" />}>
                <TiposPBS />
              </HasPermission>
            } />
            <Route path="/festivos" element={
              <HasPermission group="FESTIVOS" action="view" fallback={<Navigate to="/dashboard" />}>
                <Festivos />
              </HasPermission>
            } />
            <Route path="/tipos-identificacion" element={
              <HasPermission group="IDENTIFICACION" action="view" fallback={<Navigate to="/dashboard" />}>
                <TiposIdentificacion />
              </HasPermission>
            } />
            <Route path="/ciudades-residencia" element={
              <HasPermission group="CIUDADES" action="view" fallback={<Navigate to="/dashboard" />}>
                <CiudadesResidencia />
              </HasPermission>
            } />

            {/* Administrador (Rutas restringidas) */}
            <Route path="/admin/chat" element={
              <HasPermission group="CHAT" action="view" fallback={<Navigate to="/dashboard" />}>
                <ChatManagement />
              </HasPermission>
            } />
            <Route path="/admin/smtp" element={
              <HasPermission group="SISTEMA" action="view" fallback={<Navigate to="/dashboard" />}>
                <SmtpSettings />
              </HasPermission>
            } />
            <Route path="/admin/procedimientos" element={
              <HasPermission group="SISTEMA" action="view" fallback={<Navigate to="/dashboard" />}>
                <Procedimientos />
              </HasPermission>
            } />
            
            {/* Gestión de Roles: Solo accesible para el rol Administrador (Maestro) */}
            <Route path="/admin/roles" element={
              role === 'Administrador' ? <RoleManager /> : <Navigate to="/dashboard" />
            } />
            
            <Route path="/admin/users" element={
              <HasPermission group="USUARIOS" action="view" fallback={<Navigate to="/dashboard" />}>
                <UserManager />
              </HasPermission>
            } />

            {/* Ficha Completa del Paciente (Nueva Fase 6) */}
            <Route path="/admin/pacientes/:id" element={
                <PatientDetailView />
            } />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </PremiumLayout>
      </>
    );
  }

  // 2. Public Routes (Chat is default)
  return (
      <Routes>
        <Route path="/login" element={<LoginPage onLoginSuccess={() => {}} />} />
        
        {/* Default Public Route: Patient Chat */}
        <Route path="/" element={
            <PatientLayout>
                <PatientChat />
            </PatientLayout>
        } />
        
        {/* Redirect any unknown to root (Chat) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  );
}

// ========== EXPORT DEFAULT ==========
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
