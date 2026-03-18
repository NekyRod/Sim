import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';
import logoGOI from '../img/logo_goi.jpg';

export default function PatientLayout({ children, onLogout }) {
  const navigate = useNavigate();
  const userName = sessionStorage.getItem('auth_user') || 'Paciente';

  return (
    <div className="flex flex-col h-screen bg-white">


      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}
