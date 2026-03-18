import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaClipboardList, FaCalendarCheck, FaCalendarDay, FaCalendarWeek,
  FaClock, FaChartBar, FaPowerOff, FaCog,
  FaUser, FaUserMd, FaTags, FaFileMedical, FaCalendarTimes,
  FaIdCard, FaMapMarkerAlt, FaArrowLeft
} from 'react-icons/fa';
import logoGOI from '../img/logo_goi.jpg';
import SearchBar from '../components/SearchBar';
import AlertCenter from '../components/AlertCenter';

export default function MainLayout({ children, onLogout }) {
  const [showConfigMenu, setShowConfigMenu] = useState(false);

  // Helper for nav links
  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `flex flex-col items-center justify-center px-3 py-2 rounded-md transition-colors duration-200 text-white min-w-[80px] hover:bg-primary-hover ${isActive ? 'bg-surface text-primary-dark shadow-sm' : ''}`
      }
    >
      <Icon className="text-2xl mb-1" />
      <span className="text-xs text-center font-medium leading-tight">{label}</span>
    </NavLink>
  );

  const NavButton = ({ onClick, icon: Icon, label }) => (
    <button 
      onClick={onClick} 
      className="flex flex-col items-center justify-center px-3 py-2 rounded-md transition-colors duration-200 text-white min-w-[80px] hover:bg-primary-hover bg-transparent border-none cursor-pointer"
    >
      <Icon className="text-2xl mb-1" />
      <span className="text-xs text-center font-medium leading-tight">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Search Bar Section */}
      <div className="bg-surface/80 backdrop-blur-sm p-3 sticky top-0 z-40 border-b border-gray-200 shadow-sm">
        <SearchBar />
      </div>

      <header className="bg-primary text-white px-6 py-2 flex items-center justify-between shadow-lg z-30 sticky top-[73px]">
        <div className="flex-shrink-0">
          <img src={logoGOI} alt="GOI" className="h-12 w-auto rounded bg-white p-1" />
        </div>

        <nav className="flex gap-2 mx-auto overflow-x-auto px-4 scrollbar-hide max-w-5xl justify-center">
          {!showConfigMenu ? (
            <>
              <NavItem to="/agendamiento" icon={FaClipboardList} label="Agendamiento" />
              <NavItem to="/control-agendas" icon={FaCalendarCheck} label="Control Agendas" />
              <NavItem to="/agenda-diaria" icon={FaCalendarDay} label="Agenda diaria" />
              <NavItem to="/agenda-semanal" icon={FaCalendarWeek} label="Agenda semanal" />
              <NavItem to="/crear-disponibilidad" icon={FaClock} label="Disponibilidad" />
              <NavItem to="/informes" icon={FaChartBar} label="Informes" />
              <NavButton onClick={() => setShowConfigMenu(true)} icon={FaCog} label="Configuración" />
            </>
          ) : (
            <>
              <NavButton onClick={() => setShowConfigMenu(false)} icon={FaArrowLeft} label="Regresar" />
              <NavItem to="/pacientes" icon={FaUser} label="Pacientes" />
              <NavItem to="/profesionales" icon={FaUserMd} label="Profesionales" />
              <NavItem to="/tipos-servicio" icon={FaTags} label="Tipos Servicio" />
              <NavItem to="/especialidades" icon={FaTags} label="Especialidades" />
              <NavItem to="/tipos-pbs" icon={FaTags} label="Tipos PBS" />
              <NavItem to="/festivos" icon={FaCalendarTimes} label="Festivos" />
              <NavItem to="/tipos-identificacion" icon={FaIdCard} label="Tipos ID" />
              <NavItem to="/ciudades-residencia" icon={FaMapMarkerAlt} label="Ciudades" />
            </>
          )}
        </nav>

        <div className="flex-shrink-0 ml-4 border-l border-primary-hover pl-4 flex items-center gap-4">
          <AlertCenter />
          <button 
            onClick={onLogout} 
            className="flex flex-col items-center justify-center p-2 text-white hover:text-red-200 transition-colors"
            title="Cerrar sesión"
          >
            <FaPowerOff className="text-xl mb-1" />
            <span className="text-xs">Salir</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 w-full max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
