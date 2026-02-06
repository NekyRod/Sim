// src/pages/Agendamiento.jsx

import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../api/client';
import { showToast } from '../utils/ui';
import ConfirmacionCitaModal from '../components/ModalConfirmacionCita';
import ModalAgendarCita from '../components/ModalAgendarCita'; // ← NUEVO

export default function Agendamiento() {
  const [activeTab, setActiveTab] = useState('paciente');
  const formRef = useRef(null);

  // Estado de campos del paciente
  const [tipoIdentificacion, setTipoIdentificacion] = useState('');
  const [numeroId, setNumeroId] = useState('');
  const [nombrePaciente, setNombrePaciente] = useState('');
  const [telefonoFijo, setTelefonoFijo] = useState('');
  const [celular, setCelular] = useState('');
  const [segundoCelular, setSegundoCelular] = useState('');
  const [titularSegundoCelular, setTitularSegundoCelular] = useState('');
  const [direccion, setDireccion] = useState('');
  const [correo, setCorreo] = useState('');
  const [lugar, setLugar] = useState('');
  const [fechaNac, setFechaNac] = useState('');
  const [edad, setEdad] = useState(null);

  // Campos del acompañante (para menores)
  const [tipoDocAcompanante, setTipoDocAcompanante] = useState('');
  const [nombreAcompanante, setNombreAcompanante] = useState('');
  const [parentescoAcompanante, setParentescoAcompanante] = useState('');
  const [mostrarCamposAcompanante, setMostrarCamposAcompanante] = useState(false);

  // Estado de campos de la cita
  const [fechaProg, setFechaProg] = useState('');
  const [fechaSolicitada, setFechaSolicitada] = useState('');
  const [observacion, setObservacion] = useState('');
  const [tipoServicio, setTipoServicio] = useState('');
  const [chk6Meses, setChk6Meses] = useState(false);
  const [motivoCita, setMotivoCita] = useState('');
  const [profesional, setProfesional] = useState('');
  const [profesionalId, setProfesionalId] = useState(''); // ← NUEVO
  const [horaRecomendada, setHoraRecomendada] = useState('');
  const [horaFin, setHoraFin] = useState(''); // ← NUEVO
  const [motivosOptions, setMotivosOptions] = useState([]);
  const [mostrarTipoPbs, setMostrarTipoPbs] = useState(false);
  const [tipoPbs, setTipoPbs] = useState('');

  // Modal y catálogos
  const [openConfirm, setOpenConfirm] = useState(false);
  const [datosConfirmacion, setDatosConfirmacion] = useState(null);
  const [tiposId, setTiposId] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [tiposServicio, setTiposServicio] = useState([]);
  const [tiposPbs, setTiposPbs] = useState([]);
  const [especialidades, setEspecialidades] = useState([]); // ← NUEVO
  const [showModalAgendar, setShowModalAgendar] = useState(false); // ← NUEVO

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // Calcular edad cuando cambia la fecha de nacimiento
  useEffect(() => {
    if (fechaNac) {
      const edadCalculada = calcularEdad(fechaNac);
      setEdad(edadCalculada);
    } else {
      setEdad(null);
    }
  }, [fechaNac]);

  // Mostrar campos de acompañante si el tipo de ID es RC o TI
  useEffect(() => {
    if (tipoIdentificacion === 'RC' || tipoIdentificacion === 'TI') {
      setMostrarCamposAcompanante(true);
    } else {
      setMostrarCamposAcompanante(false);
      setTipoDocAcompanante('');
      setNombreAcompanante('');
      setParentescoAcompanante('');
    }
  }, [tipoIdentificacion]);

  // Sincronizar fecha programación -> solicitada
  useEffect(() => {
    if (fechaProg) setFechaSolicitada(fechaProg);
  }, [fechaProg]);

  // Motivos según tipo de servicio / 6 meses
  useEffect(() => {
    // Función auxiliar para filtrar especialidades (motivos) según la lógica original
    // Ahora usando el array 'especialidades' cargado del backend
    
    function obtenerMotivos(tipo, checkMarcado) {
      if (!especialidades || especialidades.length === 0) return [];

      // Códigos que corresponden a "Odontología General" (ajustar según tu BD)
      // Asumimos que hay una especialidad con código 'OG' o 'GENE'
      const codigoGeneral = 'GENE'; // Ajustar si en tu BD es 'OG'
      
      // Si check de 6 meses está marcado, solo mostramos Odontología General
      if (checkMarcado) {
        return especialidades
          .filter(e => e.codigo === codigoGeneral || e.codigo === 'OG')
          .map(e => ({ v: e.codigo, t: e.nombre }));
      }

      if (tipo === 'PBS') {
        // Filtrar especialidades para PBS
        // Lista blanca de códigos para PBS (ajustar según reglas de negocio)
        const codigosPBS = ['HO', 'OG', 'GENE', 'CO', 'CIMA', 'PED', 'ODPE', 'PPBS'];
        return especialidades
          .filter(e => codigosPBS.includes(e.codigo))
          .map(e => ({ v: e.codigo, t: e.nombre }));
      } 
      
      if (tipo === 'PARTICULAR') {
        // Filtrar especialidades para PARTICULAR
        // Asumimos que TODAS o la mayoría aplican, o definir lista blanca
        const codigosExcluidos = ['PPBS']; // Ejemplo de exclusión
        return especialidades
          .filter(e => !codigosExcluidos.includes(e.codigo))
          .map(e => ({ v: e.codigo, t: e.nombre }));
      }

      return [];
    }

    let opts = [];
    if (tipoServicio === 'PBS') {
      setMostrarTipoPbs(true);
      opts = obtenerMotivos('PBS', chk6Meses);
    } else if (tipoServicio === 'PARTICULAR') {
      setMostrarTipoPbs(false);
      opts = obtenerMotivos('PARTICULAR', chk6Meses);
    } else {
      setMostrarTipoPbs(false);
      opts = [];
    }

    setMotivosOptions(opts);
    setMotivoCita('');
  }, [tipoServicio, chk6Meses, especialidades]); // Agregamos 'especialidades' a dependencias

  // Cargar catálogos
  useEffect(() => {
    cargarTiposId();
    cargarCiudades();
    cargarTiposServicio();
    cargarTiposPbs();
    cargarEspecialidades(); // ← NUEVO
  }, []);

  // Escuchar selección de paciente desde búsqueda global
  useEffect(() => {
    function handlePacienteSeleccionado(e) {
      const paciente = e.detail;
      
      setTipoIdentificacion(paciente.tipo_identificacion || '');
      setNumeroId(paciente.numero_identificacion || '');
      setNombrePaciente(paciente.nombre_completo || '');
      setTelefonoFijo(paciente.telefono_fijo || '');
      setCelular(paciente.telefono_celular || '');
      setSegundoCelular(paciente.segundo_telefono_celular || '');
      setTitularSegundoCelular(paciente.titular_segundo_celular || '');
      setDireccion(paciente.direccion || '');
      setCorreo(paciente.correo_electronico || '');
      setLugar(paciente.lugar_residencia || '');
      setFechaNac(paciente.fecha_nacimiento || '');
      setTipoDocAcompanante(paciente.tipo_doc_acompanante || '');
      setNombreAcompanante(paciente.nombre_acompanante || '');
      setParentescoAcompanante(paciente.parentesco_acompanante || '');
      
      showToast('Datos del paciente cargados correctamente');
    }

    window.addEventListener('pacienteSeleccionado', handlePacienteSeleccionado);
    return () => window.removeEventListener('pacienteSeleccionado', handlePacienteSeleccionado);
  }, []);

  // Buscar paciente cuando se ingresa tipo y número de identificación
  useEffect(() => {
    const timer = setTimeout(() => {
      if (tipoIdentificacion && numeroId && numeroId.length >= 5) {
        buscarDatosPaciente(tipoIdentificacion, numeroId);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [tipoIdentificacion, numeroId]);

  async function buscarDatosPaciente(tipo, numero) {
    try {
      const resp = await apiFetch(`${BACKEND_URL}/pacientes/documento/${tipo}/${numero}`);
      if (resp) {
        setNombrePaciente(resp.nombre_completo || '');
        setTelefonoFijo(resp.telefono_fijo || '');
        setCelular(resp.telefono_celular || '');
        setSegundoCelular(resp.segundo_telefono_celular || '');
        setTitularSegundoCelular(resp.titular_segundo_celular || '');
        setDireccion(resp.direccion || '');
        setCorreo(resp.correo_electronico || '');
        setLugar(resp.lugar_residencia || '');
        setFechaNac(resp.fecha_nacimiento || '');
        setTipoDocAcompanante(resp.tipo_doc_acompanante || '');
        setNombreAcompanante(resp.nombre_acompanante || '');
        setParentescoAcompanante(resp.parentesco_acompanante || '');
        
        showToast('Datos del paciente cargados correctamente');
      }
    } catch (err) {
      console.log('Paciente no encontrado, es un registro nuevo');
    }
  }

  async function cargarTiposId() {
    try {
      const resp = await apiFetch(`${BACKEND_URL}/tiposidentificacion/`);
      setTiposId(resp.data || []);
    } catch (err) {
      console.error('Error cargando tipos ID:', err);
    }
  }

  async function cargarCiudades() {
    try {
      const resp = await apiFetch(`${BACKEND_URL}/ciudadesresidencia`);
      setCiudades(resp.data || []);
    } catch (err) {
      console.error('Error cargando ciudades:', err);
    }
  }

  async function cargarTiposServicio() {
    try {
      const resp = await apiFetch(`${BACKEND_URL}/tiposservicio`);
      setTiposServicio(resp.data || []);
    } catch (err) {
      console.error('Error cargando tipos servicio:', err);
    }
  }

  async function cargarTiposPbs() {
    try {
      const resp = await apiFetch(`${BACKEND_URL}/tipospbs`);
      setTiposPbs(resp.data || []);
    } catch (err) {
      console.error('Error cargando tipos PBS:', err);
    }
  }

  // ← NUEVA FUNCIÓN
  async function cargarEspecialidades() {
    try {
      const resp = await apiFetch(`${BACKEND_URL}/especialidades/`);
      setEspecialidades(resp.data || []);
    } catch (err) {
      console.error('Error cargando especialidades:', err);
    }
  }

  const resetForm = () => {
    setActiveTab('paciente');
    setTipoIdentificacion('');
    setNumeroId('');
    setNombrePaciente('');
    setTelefonoFijo('');
    setCelular('');
    setSegundoCelular('');
    setTitularSegundoCelular('');
    setDireccion('');
    setCorreo('');
    setLugar('');
    setFechaNac('');
    setEdad(null);
    setTipoDocAcompanante('');
    setNombreAcompanante('');
    setParentescoAcompanante('');
    setMostrarCamposAcompanante(false);
    setFechaProg('');
    setFechaSolicitada('');
    setObservacion('');
    setTipoServicio('');
    setChk6Meses(false);
    setMotivoCita('');
    setProfesional('');
    setProfesionalId('');
    setHoraRecomendada('');
    setHoraFin('');
  };

  function calcularEdad(fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  }

  function validarEdadYTipoDocumento() {
    if (!fechaNac || !tipoIdentificacion) {
      return true;
    }

    const edadPaciente = calcularEdad(fechaNac);

    if (edadPaciente >= 0 && edadPaciente <= 6) {
      if (tipoIdentificacion !== 'RC') {
        showToast('Los menores de 6 años deben tener Registro Civil de nacimiento (RC) como tipo de documento', 'error');
        return false;
      }
    }

    if (edadPaciente >= 7 && edadPaciente <= 17) {
      if (tipoIdentificacion !== 'TI') {
        showToast('Los menores entre 7 y 17 años deben tener Tarjeta de Identidad (TI) como tipo de documento', 'error');
        return false;
      }
    }

    return true;
  }

  function toAmPm(time) {
    if (!time) return 'N/A';
    const [hStr, mStr] = time.split(':');
    let h = parseInt(hStr, 10);
    const suf = h >= 12 ? 'p. m.' : 'a. m.';
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h}:${mStr} ${suf}`;
  }

  function validarTabPaciente() {
    const form = formRef.current;
    if (!form) return false;

    const tab1 = document.getElementById('tab-paciente-main');
    const inputs = tab1.querySelectorAll('input, select, textarea');
    let ok = true;

    inputs.forEach((el) => {
      if (!el.checkValidity()) ok = false;
    });

    if (!ok) {
      showToast('Completa los datos del paciente antes de continuar.', 'error');
      form.reportValidity();
      return false;
    }

    if (!validarEdadYTipoDocumento()) {
      return false;
    }

    if (mostrarCamposAcompanante) {
      if (!tipoDocAcompanante || !nombreAcompanante || !parentescoAcompanante) {
        showToast('Los datos del acompañante son obligatorios para menores de edad', 'error');
        return false;
      }
    }

    return true;
  }

  function handleTabClick(tab) {
    if (tab === 'cita') {
      if (!validarTabPaciente()) return;
    }
    setActiveTab(tab);
  }

  // ← NUEVA FUNCIÓN: Abrir modal
  function handleAbrirModalAgendar() {
    
    setShowModalAgendar(true);
  }

  // ← NUEVA FUNCIÓN: Confirmar desde el modal
  function handleConfirmarCita(datos) {
    setProfesionalId(datos.profesional_id);
    setProfesional(datos.profesional_nombre);
    setFechaProg(datos.fecha);
    setHoraRecomendada(datos.hora_inicio);
    setHoraFin(datos.hora_fin);
    setShowModalAgendar(false);
    showToast('Cita programada correctamente');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (!tipoServicio) {
      showToast('Debe seleccionar el tipo de servicio.', 'error');
      return;
    }

    if (!motivoCita) {
      showToast('Debe seleccionar el motivo de la cita.', 'error');
      return;
    }

    // ← MODIFICADO: Validar que se haya programado desde el modal
    if (!profesionalId) {
      showToast('Debe programar la cita usando el botón "Buscar Agenda".', 'error');
      return;
    }

    const payload = {
      tipo_identificacion: tipoIdentificacion,
      numero_identificacion: numeroId,
      nombre_paciente: nombrePaciente,
      telefono_fijo: telefonoFijo,
      telefono_celular: celular,
      segundo_telefono_celular: segundoCelular,
      titular_segundo_celular: titularSegundoCelular,
      direccion,
      correo_electronico: correo,
      lugar_residencia: lugar,
      fecha_nacimiento: fechaNac || null,
      tipo_doc_acompanante: tipoDocAcompanante,
      nombre_acompanante: nombreAcompanante,
      parentesco_acompanante: parentescoAcompanante,
      profesional_id: profesionalId, // ← USAR EL ID DEL MODAL
      fecha_programacion: fechaProg,
      fecha_solicitada: fechaSolicitada,
      hora: horaRecomendada,
      hora_fin: horaFin, // ← NUEVO
      tipo_servicio: tipoServicio,
      tipo_pbs: tipoPbs,
      mas_6_meses: chk6Meses,
      motivo_cita: motivoCita,
      observacion,
    };

    try {
      await apiFetch(`${BACKEND_URL}/citas/`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const datos = {
        nombrePaciente: nombrePaciente || 'Paciente',
        docPaciente: numeroId || '',
        fechaProgramacion: fechaProg || '',
        horaRecomendada: toAmPm(horaRecomendada),
        profesional: profesional || '',
        tipoServicio: tipoServicio || '',
      };

      setDatosConfirmacion(datos);
      setOpenConfirm(true);
      resetForm();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // ← CALCULAR DURACIÓN BASE
  const especialidadSeleccionada = especialidades.find(e => e.codigo === motivoCita);
  const duracionBase = especialidadSeleccionada?.duracion_minutos || 20;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <form ref={formRef} onSubmit={handleSubmit}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #ddd' }}>
          <button
            type="button"
            onClick={() => handleTabClick('paciente')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: activeTab === 'paciente' ? '#2c5f8d' : '#e0e0e0',
              color: activeTab === 'paciente' ? 'white' : '#333',
              fontWeight: '600',
              cursor: 'pointer',
              borderRadius: '4px 4px 0 0',
            }}
          >
            Datos del Paciente
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('cita')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: activeTab === 'cita' ? '#2c5f8d' : '#e0e0e0',
              color: activeTab === 'cita' ? 'white' : '#333',
              fontWeight: '600',
              cursor: 'pointer',
              borderRadius: '4px 4px 0 0',
            }}
          >
            Programación de la Cita
          </button>
        </div>

        {/* TAB 1: Datos del Paciente */}
        {activeTab === 'paciente' && (
          <div id="tab-paciente-main" style={{ background: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ color: '#2c5f8d', marginBottom: '20px' }}>Datos del Paciente</h3>

            <div style={{ display: 'grid', gap: '15px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                Tipo de Identificación *
                <select
                  value={tipoIdentificacion}
                  onChange={(e) => setTipoIdentificacion(e.target.value)}
                  required
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="">Seleccione uno</option>
                  {tiposId.map((tipo) => (
                    <option key={tipo.id} value={tipo.codigo}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                Número de Identificación *
                <input
                  type="text"
                  value={numeroId}
                  onChange={(e) => setNumeroId(e.target.value)}
                  required
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                Nombre del Paciente *
                <input
                  type="text"
                  value={nombrePaciente}
                  onChange={(e) => setNombrePaciente(e.target.value)}
                  required
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                Teléfono fijo
                <input
                  type="tel"
                  value={telefonoFijo}
                  onChange={(e) => setTelefonoFijo(e.target.value)}
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                Teléfono celular
                <input
                  type="tel"
                  value={celular}
                  onChange={(e) => setCelular(e.target.value.replace(/\s+/g, ''))}
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                Segundo número de celular
                <input
                  type="tel"
                  value={segundoCelular}
                  onChange={(e) => setSegundoCelular(e.target.value.replace(/\s+/g, ''))}
                  placeholder="3009876543"
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                ¿A quién pertenece el segundo celular?
                <input
                  type="text"
                  value={titularSegundoCelular}
                  onChange={(e) => setTitularSegundoCelular(e.target.value)}
                  placeholder="Ej: Esposa, Hijo, Familiar"
                  maxLength={60}
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                Dirección
                <textarea
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  rows="3"
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                Correo electrónico
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                Lugar de Residencia
                <select
                  value={lugar}
                  onChange={(e) => setLugar(e.target.value)}
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="">Seleccione uno</option>
                  {ciudades.map((ciudad) => (
                    <option key={ciudad.id} value={ciudad.nombre}>
                      {ciudad.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                Fecha de nacimiento
                <input
                  type="date"
                  value={fechaNac}
                  onChange={(e) => setFechaNac(e.target.value)}
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                {edad !== null && (
                  <small style={{ color: '#666', marginTop: '5px' }}>
                    Edad: {edad} años
                  </small>
                )}
              </label>

              {/* CAMPOS DEL ACOMPAÑANTE (solo si es RC o TI) */}
              {mostrarCamposAcompanante && (
                <>
                  <h4 style={{ margin: '20px 0 10px 0', color: '#2c5f8d', borderTop: '2px solid #e0e0e0', paddingTop: '20px' }}>
                    Datos del Acompañante (Obligatorio para menores)
                  </h4>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    Tipo de documento del acompañante *
                    <select
                      value={tipoDocAcompanante}
                      onChange={(e) => setTipoDocAcompanante(e.target.value)}
                      required={mostrarCamposAcompanante}
                      style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                      <option value="">Seleccione uno</option>
                      {tiposId
                        .filter(tipo => tipo.codigo !== 'RC' && tipo.codigo !== 'TI')
                        .map((tipo) => (
                          <option key={tipo.id} value={tipo.codigo}>
                            {tipo.nombre}
                          </option>
                        ))
                      }
                    </select>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    Nombre del acompañante *
                    <input
                      type="text"
                      value={nombreAcompanante}
                      onChange={(e) => setNombreAcompanante(e.target.value)}
                      placeholder="Nombre completo del acompañante"
                      maxLength={100}
                      required={mostrarCamposAcompanante}
                      style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    Parentesco del acompañante *
                    <input
                      type="text"
                      value={parentescoAcompanante}
                      onChange={(e) => setParentescoAcompanante(e.target.value)}
                      placeholder="Ej: Madre, Padre, Tutor legal"
                      maxLength={60}
                      required={mostrarCamposAcompanante}
                      style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </label>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Programación de la Cita */}
        {activeTab === 'cita' && (
          <div style={{ background: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ color: '#2c5f8d', marginBottom: '20px' }}>Programación de la Cita</h3>

            <div style={{ display: 'grid', gap: '15px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                Tipo de servicio *
                <select
                  value={tipoServicio}
                  onChange={(e) => setTipoServicio(e.target.value)}
                  required
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="">Seleccione uno</option>
                  {tiposServicio.map((tipo) => (
                    <option key={tipo.id} value={tipo.codigo}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={chk6Meses}
                  onChange={(e) => setChk6Meses(e.target.checked)}
                />
                Hace más de 6 meses no asiste a odontología
              </label>

              {mostrarTipoPbs && (
                <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }} id="grupo-tipo-pbs">
                  Tipo PBS *
                  <select
                    value={tipoPbs}
                    onChange={(e) => setTipoPbs(e.target.value)}
                    required={mostrarTipoPbs}
                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                  >
                    <option value="">Seleccione uno</option>
                    {tiposPbs.map((tipo) => (
                      <option key={tipo.id} value={tipo.codigo}>
                        {tipo.nombre}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {/* ← BOTÓN BUSCAR AGENDA */}
              <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={handleAbrirModalAgendar}
                  disabled={!tipoServicio}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: tipoServicio ? '#2c5f8d' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: tipoServicio ? 'pointer' : 'not-allowed',
                  }}
                >
                  {fechaProg ? '🔄 Cambiar Agenda' : '📅 Buscar Agenda'}
                </button>

                {/* ← MOSTRAR INFO PROGRAMADA */}
                {profesional && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: '#e8f4ff',
                    border: '1px solid #b3d9ff',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}>
                    <strong>Profesional:</strong> {profesional}<br />
                    <strong>Fecha:</strong> {fechaProg}<br />
                    <strong>Hora:</strong> {horaRecomendada} - {horaFin}
                  </div>
                )}
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                Fecha solicitada por el paciente
                <input
                  type="date"
                  value={fechaSolicitada}
                  onChange={(e) => setFechaSolicitada(e.target.value)}
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                Observación de la cita
                <textarea
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  rows="3"
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
                />
              </label>

              <button
                type="submit"
                style={{
                  marginTop: '20px',
                  padding: '14px 28px',
                  background: '#2c5f8d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Confirmar Cita
              </button>
            </div>
          </div>
        )}
      </form>

      <ConfirmacionCitaModal
        open={openConfirm}
        datos={datosConfirmacion}
        onClose={() => setOpenConfirm(false)}
        onDescargarPdf={() => {
          // Lógica de descarga PDF
        }}
      />

      {/* ← MODAL BUSCAR AGENDA */}
      <ModalAgendarCita
        open={showModalAgendar}
        especialidadId={motivoCita}
        motivosOptions={motivosOptions}
        onChangeMotivo={setMotivoCita}
        duracionBase={duracionBase}
        onClose={() => setShowModalAgendar(false)}
        onConfirmar={handleConfirmarCita}
      />
    </div>
  );
}
