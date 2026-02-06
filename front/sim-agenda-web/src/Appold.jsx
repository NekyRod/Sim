// src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import {
  FaClipboardList, FaCalendarCheck, FaCalendarDay, FaCalendarWeek, 
  FaClock, FaChartBar, FaPowerOff, FaCog,
  // Nuevos íconos para menú Configuración
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

// Páginas de Configuración (crearás después)
import Pacientes from './pages/config/Pacientes.jsx';
import Profesionales from './pages/config/Profesionales.jsx';
import TiposServicio from './pages/config/TiposServicio.jsx';
import MotivosCita from './pages/config/MotivosCita.jsx';
import TiposPBS from './pages/config/TiposPBS.jsx';
import Festivos from './pages/config/Festivos.jsx';
import TiposIdentificacion from './pages/config/TiposIdentificacion.jsx';
import CiudadesResidencia from './pages/config/CiudadesResidencia.jsx';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showConfigMenu, setShowConfigMenu] = useState(false); // ← NUEVO ESTADO

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
    <BrowserRouter>
      <header className="main-header">
        <div className="logo-container">
          <img src={logoGOI} alt="Logo GOI" className="logo-img" />
        </div>

        <nav className={`main-nav ${showConfigMenu ? 'config-mode' : ''}`}>
          {/* MENÚ NORMAL */}
          {!showConfigMenu && (
            <>
              <NavLink to="/agendamiento" className={({ isActive }) => `menu-btn ${isActive ? 'active' : ''}`} title="Realizar agendamiento de citas">
                <span className="icon"><FaClipboardList /></span><span>Agendamiento</span>
              </NavLink>
              
              <NavLink to="/control-agendas" className={({ isActive }) => `menu-btn ${isActive ? 'active' : ''}`} title="Revisar la agenda de los profesionales">
                <span className="icon"><FaCalendarCheck /></span><span>Control de Agendas</span>
              </NavLink>
              
              <NavLink to="/agenda-diaria" className={({ isActive }) => `menu-btn ${isActive ? 'active' : ''}`} title="Ver agenda diaria">
                <span className="icon"><FaCalendarDay /></span><span>Agenda diaria</span>
              </NavLink>
              
              <NavLink to="/agenda-semanal" className={({ isActive }) => `menu-btn ${isActive ? 'active' : ''}`} title="Ver agenda semanal">
                <span className="icon"><FaCalendarWeek /></span><span>Agenda semanal</span>
              </NavLink>
              
              <NavLink to="/crear-disponibilidad" className={({ isActive }) => `menu-btn ${isActive ? 'active' : ''}`} title="Crear los turnos de disponibilidad de los profesionales">
                <span className="icon"><FaClock /></span><span>Crear Disponibilidad</span>
              </NavLink>
              
              <NavLink to="/informes" className={({ isActive }) => `menu-btn ${isActive ? 'active' : ''}`} title="Generar informes">
                <span className="icon"><FaChartBar /></span><span>Informes</span>
              </NavLink>
              <NavLink
                to="/configuracion"
                className={({ isActive }) => `menu-btn ${isActive ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleAbrirConfiguracion();
                }}
                title="Configuración del sistema"
              >
                <span className="icon"><FaCog /></span>
                <span>Configuración</span>
            </NavLink>
            </>
          )}
  
          {/* BOTÓN CONFIGURACIÓN / REGRESAR - SIEMPRE VISIBLE */}
          
            
       

        

          {/* MENÚ CONFIGURACIÓN */}
          {showConfigMenu && (
            <>
              <NavLink to="/config/pacientes" className="menu-btn config-btn" title="Pacientes">
                <span className="icon"><FaUser /></span><span>Pacientes</span>
              </NavLink>
              
              <NavLink to="/config/profesionales" className="menu-btn config-btn" title="Profesionales">
                <span className="icon"><FaUserMd /></span><span>Profesionales</span>
              </NavLink>
              
              <NavLink to="/config/tipos-servicio" className="menu-btn config-btn" title="Tipos de Servicio">
                <span className="icon"><FaTags /></span><span>Tipos Servicio</span>
              </NavLink>
              
              <NavLink to="/config/motivos-cita" className="menu-btn config-btn" title="Motivos Cita">
                <span className="icon"><FaFileMedical /></span><span>Motivos Cita</span>
              </NavLink>
              
              <NavLink to="/config/tipos-pbs" className="menu-btn config-btn" title="Tipos de PBS">
                <span className="icon"><FaTags /></span><span>Tipos PBS</span>
              </NavLink>
              
              <NavLink to="/config/festivos" className="menu-btn config-btn" title="Festivos x Año">
                <span className="icon"><FaCalendarTimes /></span><span>Festivos</span>
              </NavLink>
              
              <NavLink to="/config/tipos-identificacion" className="menu-btn config-btn" title="Tipos de Identificación">
                <span className="icon"><FaIdCard /></span><span>Tipos ID</span>
              </NavLink>
              
              <NavLink to="/config/ciudades" className="menu-btn config-btn" title="Ciudades Residencia">
                <span className="icon"><FaMapMarkerAlt /></span><span>Ciudades</span>
              </NavLink>
              {/* BOTÓN REGRESAR - AL FINAL DESPUÉS DE CIUDADES */}
              <button
                className="menu-btn"
                onClick={handleRegresar}
                title="Regresar al menú principal"
              >
                <span className="icon"><FaArrowLeft /></span>
                <span>Regresar</span>
              </button>              
            </>
          )}
        </nav>
          {/* Botón de apagado al extremo derecho */}
          <button
            type="button"
            className="logout-btn"
            title="Cerrar sesión"
            onClick={handleLogout}
          >
            <FaPowerOff />
          </button>

      </header>

      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/principal" replace />} />
          <Route path="/principal" element={<Principal />} />
          <Route path="/agendamiento" element={<Agendamiento />} />
          <Route path="/control-agendas" element={<ControlAgendas />} />
          <Route path="/agenda-diaria" element={<AgendaDiaria />} />
          <Route path="/agenda-semanal" element={<AgendaSemanal />} />
          <Route path="/crear-disponibilidad" element={<CrearDisponibilidad />} />
          <Route path="/informes" element={<Informes />} />
          
          {/* Rutas Configuración */}
          
          <Route path="/config/pacientes" element={<Pacientes />} />
          <Route path="/config/profesionales" element={<Profesionales />} />
          <Route path="/config/tipos-servicio" element={<TiposServicio />} />
          <Route path="/config/motivos-cita" element={<MotivosCita />} />
          <Route path="/config/tipos-pbs" element={<TiposPBS />} />
          <Route path="/config/festivos" element={<Festivos />} />
          <Route path="/config/tipos-identificacion" element={<TiposIdentificacion />} />
          <Route path="/config/ciudades" element={<CiudadesResidencia />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
