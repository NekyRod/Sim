import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  FaClipboardList, FaCalendarCheck, FaCalendarDay, FaCalendarWeek,
  FaClock, FaChartBar, FaPowerOff, FaCog,
  FaUser, FaUserMd, FaTags, FaFileMedical, FaCalendarTimes,
  FaIdCard, FaMapMarkerAlt, FaBars, FaTimes, FaChevronDown, FaSearch, FaServer, FaShieldAlt, FaUserShield, FaBook
} from 'react-icons/fa';
import logoGOI from '../img/logo_goi.jpg';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/admin/NotificationBell.jsx';
import ChatFab from '../components/admin/ChatFab.jsx';
import AdminChatDrawer from '../components/admin/AdminChatDrawer.jsx';

/**
 * PremiumLayout Component
 * Modern clinic layout with header navigation (Desktop) and drawer (Mobile)
 */

function HeaderNavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `
        flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg
        text-slate-500 text-xs font-medium
        transition-all duration-200 min-w-[72px] shrink-0 whitespace-nowrap
        hover:bg-slate-50 hover:text-blue-600
        ${isActive ? 'bg-blue-50 text-blue-700 shadow-sm' : ''}
      `.replace(/\s+/g, ' ').trim()}
    >
      <Icon className="text-xl shrink-0" />
      <span className="text-[11px] font-semibold tracking-tight">{label}</span>
    </NavLink>
  );
}

function HeaderNavDropdown({ icon: Icon, label, childrenItems }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  // Check if any child is active
  const isActive = childrenItems.some(item => item.to === location.pathname);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsOpen(!isOpen)}
        className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer min-w-[72px] shrink-0 whitespace-nowrap transition-colors duration-200 select-none ${isActive || isOpen ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-blue-600'}`}
      >
        <div className="flex items-center gap-1">
           <Icon className="text-xl shrink-0" />
           <FaChevronDown className="text-[8px] opacity-70" />
        </div>
        <span className="text-[11px] font-semibold tracking-tight">{label}</span>
      </div>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-slideUp z-50">
          <div className="py-2">
            {childrenItems.map((child) => (
              <NavLink
                key={child.to}
                to={child.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 text-sm
                  text-slate-600
                  transition-colors duration-200
                  hover:bg-slate-50 hover:text-blue-600
                  ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : ''}
                `.replace(/\s+/g, ' ').trim()}
              >
                <child.icon className="text-base shrink-0" />
                <span>{child.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DropdownItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => `
        flex items-center gap-3 px-4 py-3 text-sm
        text-slate-600
        transition-colors duration-200
        hover:bg-slate-50 hover:text-blue-600
        ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : ''}
      `.replace(/\s+/g, ' ').trim()}
    >
      <Icon className="text-base shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}

export default function PremiumLayout({ children, searchBar, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [configExpanded, setConfigExpanded] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const configRef = useRef(null);
  const searchContainerRef = useRef(null);

  function handleSessionSelect(sessionId) {
    setSelectedSessionId(sessionId);
    setIsChatOpen(true);
  }

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (configRef.current && !configRef.current.contains(event.target)) {
        setConfigExpanded(false);
      }
      // Collapses search if clicked outside and input is empty (optional behavior)
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
         setSearchExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const { role, hasPermission } = useAuth();
  
  const mainMenuItems = [
    { to: '/dashboard', icon: FaChartBar, label: 'Dashboard' },
    hasPermission('AGENDAMIENTO', 'view') && { to: '/agendamiento', icon: FaClipboardList, label: 'Agendamiento' },
    hasPermission('AGENDAS', 'view') && { 
      label: 'Agendas', 
      icon: FaCalendarCheck, 
      children: [
        { to: '/control-agendas', icon: FaCalendarCheck, label: 'Control Agendas' },
        { to: '/agenda-diaria', icon: FaCalendarDay, label: 'Agenda Diaria' },
        { to: '/agenda-semanal', icon: FaCalendarWeek, label: 'Agenda Semanal' },
      ]
    },
    hasPermission('DISPONIBILIDAD', 'view') && { to: '/crear-disponibilidad', icon: FaClock, label: 'Disponibilidad' },
    hasPermission('INFORMES', 'view') && { to: '/informes', icon: FaChartBar, label: 'Informes' },
    { to: '/manual', icon: FaBook, label: 'Manual' },
  ].filter(Boolean);
  const configMenuItems = [
    hasPermission('PACIENTES', 'view') && { to: '/pacientes', icon: FaUser, label: 'Pacientes' },
    hasPermission('PROFESIONALES', 'view') && { to: '/profesionales', icon: FaUserMd, label: 'Profesionales' },
    hasPermission('TIPOS_SERVICIO', 'view') && { to: '/tipos-servicio', icon: FaTags, label: 'Tipos de Servicio' },
    hasPermission('ESPECIALIDADES', 'view') && { to: '/especialidades', icon: FaTags, label: 'Especialidades' },
    hasPermission('PBS', 'view') && { to: '/tipos-pbs', icon: FaTags, label: 'Tipos PBS' },
    hasPermission('FESTIVOS', 'view') && { to: '/festivos', icon: FaCalendarTimes, label: 'Festivos' },
    hasPermission('IDENTIFICACION', 'view') && { to: '/tipos-identificacion', icon: FaIdCard, label: 'Tipos de Identificación' },
    hasPermission('CIUDADES', 'view') && { to: '/ciudades-residencia', icon: FaMapMarkerAlt, label: 'Ciudades de Residencia' },
    hasPermission('SISTEMA', 'view') && { to: '/admin/procedimientos', icon: FaTags, label: 'Procedimientos' },
  ].filter(Boolean);
  
  // Admin section
  const adminMenuItems = [
    hasPermission('SISTEMA', 'view') && { to: '/admin/smtp', icon: FaServer, label: 'SMTP Config' },
    role === 'Administrador' && { to: '/admin/roles', icon: FaShieldAlt, label: 'Gestión de Roles' },
    hasPermission('USUARIOS', 'view') && { to: '/admin/users', icon: FaUserShield, label: 'Gestión de Usuarios' },
  ].filter(Boolean);



  return (
    <div className="h-screen bg-[var(--color-surface-background)] flex flex-col font-sans overflow-hidden">
      {/* HEADER (Desktop & Mobile) */}
      <header 
        className="flex-none sticky top-0 z-[var(--z-index-sticky)] border-b border-[var(--color-border-primary)] shadow-[var(--shadow-sm)]"
        style={{ backgroundColor: '#ffffff', color: '#334155' }} 
      >
        <div className="w-full max-w-[1600px] mx-auto px-4 lg:px-6 h-18 lg:h-20 flex items-center justify-between gap-4">
          
          {/* 1. Left: Logo & Search */}
          <div className="flex items-center gap-4 min-w-fit">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors text-slate-500"
              aria-label="Abrir menú"
            >
              <FaBars className="text-xl" />
            </button>
            <img src={logoGOI} alt="GOI" className="h-9 w-auto object-contain shrink-0" />
            
            {/* Collapsible Search Bar */}
            <div className="hidden md:flex items-center" ref={searchContainerRef}>
               <div className="w-px h-8 bg-gray-200 mx-3"></div>
               
               <div className={`transition-all duration-300 ease-in-out flex items-center ${searchExpanded ? 'w-72' : 'w-10'}`}>
                 {!searchExpanded ? (
                   <button 
                    onClick={() => setSearchExpanded(true)}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-slate-500 transition-colors"
                   >
                     <FaSearch className="text-lg" />
                   </button>
                 ) : (
                    <div className="w-full animate-fadeIn">
                       {searchBar}
                    </div>
                 )}
               </div>
            </div>
          </div>

          {/* 2. Center: Navigation */}
          <style>{`
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
          <nav className="hidden lg:flex items-center gap-2 px-4 z-50 max-w-fit mx-auto">
            {mainMenuItems.map((item) => (
              item.children ? (
                <HeaderNavDropdown key={item.label} icon={item.icon} label={item.label} childrenItems={item.children} />
              ) : (
                <HeaderNavItem key={item.to} {...item} />
              )
            ))}
          </nav>

          {/* 3. Right: Config & User */}
          <div className="flex items-center gap-2 lg:gap-4 min-w-fit justify-end">
            
            {/* Notification Bell */}
             <div className="mr-2">
                {hasPermission('CHAT', 'view') && (
                  <NotificationBell onSelectSession={handleSessionSelect} />
                )}
             </div>

            {/* Config Dropdown */}
            <div className="hidden lg:block relative" ref={configRef}>
              <button
                onClick={() => setConfigExpanded(!configExpanded)}
                className={`
                  flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg
                  text-slate-500 text-xs font-medium border-none bg-transparent cursor-pointer
                  transition-colors duration-200 min-w-[64px] shrink-0
                  hover:bg-slate-50 hover:text-blue-600
                  ${configExpanded ? 'bg-slate-100 text-blue-700' : ''}
                `.replace(/\s+/g, ' ').trim()}
                style={{ boxShadow: 'none' }}
              >
                <div className="relative">
                  <FaCog className="text-lg mb-0.5 shrink-0" />
                  <FaChevronDown className="absolute -right-2 -bottom-0 text-[8px]" />
                </div>
                <span>Config</span>
              </button>

              {configExpanded && configMenuItems.length > 0 && (
                <div 
                  className={`
                    absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 
                    overflow-hidden animate-slideUp origin-top-right z-50
                    ${adminMenuItems.length > 0 ? 'w-[500px]' : 'w-64'}
                  `}
                >
                  <div className={`p-2 ${adminMenuItems.length > 0 ? 'grid grid-cols-2 gap-0' : ''}`}>
                    
                    {/* Columna 1: Administración */}
                    <div className="flex flex-col">
                      <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-gray-50/50 rounded-md mb-1 mx-1">
                        Administración
                      </div>
                      {configMenuItems.map((item) => (
                        <DropdownItem key={item.to} {...item} onClick={() => setConfigExpanded(false)} />
                      ))}
                    </div>
                    
                    {/* Columna 2: Sistema (Si aplica) */}
                    {adminMenuItems.length > 0 && (
                      <div className="flex flex-col border-l border-gray-100 pl-1">
                        <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-gray-50/50 rounded-md mb-1 mx-1">
                          Sistema
                        </div>
                        {adminMenuItems.map((item) => (
                          <DropdownItem key={item.to} {...item} onClick={() => setConfigExpanded(false)} />
                        ))}
                      </div>
                    )}

                  </div>
                </div>
              )}
            </div>

            <div className="hidden lg:block w-px h-8 bg-gray-200"></div>

            {/* User & Logout */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-700 leading-tight whitespace-nowrap">
                  {sessionStorage.getItem('auth_user') || 'Usuario'}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                  {role || 'Usuario'}
                </span>
              </div>
              
              <div className="hidden sm:flex w-10 h-10 rounded-full bg-slate-100 items-center justify-center text-blue-600 border border-slate-200 shadow-sm shrink-0">
                <FaUser className="text-sm" />
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors border-none bg-transparent cursor-pointer shrink-0"
                title="Cerrar Sesión"
                style={{ boxShadow: 'none' }}
              >
                <FaPowerOff className="text-lg" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-3 border-t border-gray-100 pt-3 bg-gray-50/50">
          {searchExpanded ? searchBar : (
              <button 
                onClick={() => setSearchExpanded(true)}
                className="w-full h-10 flex items-center gap-2 px-3 bg-white border border-gray-300 rounded-lg text-slate-400 text-sm"
              >
                <FaSearch />
                <span>Buscar pacientes...</span>
              </button>
          )} 
        </div>
      </header>


      {/* MOBILE DRAWER */}
      <div className={`
        fixed inset-0 z-[var(--z-index-modal-backdrop)] lg:hidden
        transition-opacity duration-300
        ${sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}
      `}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        
        {/* Drawer Content */}
        <div className={`
          absolute top-0 left-0 bottom-0 w-[280px] bg-white shadow-2xl
          transform transition-transform duration-300 ease-out flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <img src={logoGOI} alt="GOI" className="h-8 w-auto" />
            <button onClick={() => setSidebarOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full border-none bg-transparent">
              <FaTimes />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">Menú Principal</div>
            {mainMenuItems.map((item) => (
              item.children ? (
                <div key={item.label} className="space-y-1">
                  <div className="px-3 py-1 text-xs font-bold text-slate-400 uppercase mt-2">{item.label}</div>
                  {item.children.map(child => (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium no-underline ml-2
                        ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}
                      `}
                    >
                      <child.icon className="text-lg" />
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium no-underline
                    ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}
                  `}
                >
                  <item.icon className="text-lg" />
                  {item.label}
                </NavLink>
              )
            ))}

            <div className="mt-6 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">Configuración</div>
            {configMenuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium no-underline
                  ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}
                `}
              >
                <item.icon className="text-lg" />
                {item.label}
              </NavLink>
            ))}
            
            {/* Admin Section - Only for Administrador (Mobile) */}
            {adminMenuItems.length > 0 && (
              <>
                <div className="mt-6 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">Sistema</div>
                {adminMenuItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium no-underline
                      ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}
                    `}
                  >
                    <item.icon className="text-lg" />
                    {item.label}
                  </NavLink>
                ))}
              </>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50">
             <div className="flex items-center gap-3 px-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                  {sessionStorage.getItem('auth_user')?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="text-sm font-medium text-gray-900 truncate">{sessionStorage.getItem('auth_user')}</div>
                  <div className="text-xs text-gray-500">Sesión activa</div>
                </div>
                <button 
                  onClick={onLogout}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                  <FaPowerOff />
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-[var(--color-surface-background)] flex justify-center w-full overflow-y-auto">
        <div className="w-full max-w-[1600px] p-4 lg:p-8 animate-fadeIn">
          {children}
        </div>
      </main>
      {hasPermission('CHAT', 'view') && (
        <>
          <ChatFab onToggleDrawer={() => setIsChatOpen(!isChatOpen)} />
          <AdminChatDrawer 
            isOpen={isChatOpen} 
            onClose={() => {
              setIsChatOpen(false);
              setSelectedSessionId(null);
            }} 
            initialSessionId={selectedSessionId}
          />
        </>
      )}
    </div>
  );
}
