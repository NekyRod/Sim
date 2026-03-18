import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../api/client';
import { showToast } from '../utils/ui';
import { Card, Input, Select, Button, Textarea } from '../components/ui';
import ConfirmacionCitaModal from '../components/ModalConfirmacionCita';
import ModalAgendarCita from '../components/ModalAgendarCita';
import { FaUser, FaCalendarAlt, FaSearch, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

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
  // Info de programación
  const [profesional, setProfesional] = useState('');
  const [profesionalId, setProfesionalId] = useState('');
  const [horaRecomendada, setHoraRecomendada] = useState('');
  const [horaFin, setHoraFin] = useState('');
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
  const [especialidades, setEspecialidades] = useState([]);
  const [showModalAgendar, setShowModalAgendar] = useState(false);

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

  // Mostrar campos de acompañante si el tipo de ID es escencialmente RC o TI
  useEffect(() => {
    const tipo = (tipoIdentificacion || '').trim().toUpperCase();
    // Lista ampliada de códigos posibles para menores
    const codigosMenores = ['RC', 'TI', 'NUIP', 'R.C.', 'T.I.'];
    
    if (codigosMenores.includes(tipo)) {
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
    function obtenerMotivos(tipo, checkMarcado) {
      if (!especialidades || especialidades.length === 0) return [];

      const codigoGeneral = 'ODO'; // Ajustado a 'ODO' según BD
      
      if (checkMarcado) {
        // Regla 1: Mantener igual (filtro restringido para más de 6 meses)
        return especialidades
          .filter(e => e.codigo === codigoGeneral || e.codigo === 'OG')
          .map(e => ({ value: e.codigo, label: e.nombre }));
      }

      // Regla 2: Mostrar todos los activos para cualquier tipo de servicio
      if (tipo === 'PBS' || tipo === 'PARTICULAR') {
        return especialidades.map(e => ({ value: e.codigo, label: e.nombre }));
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
  }, [tipoServicio, chk6Meses, especialidades]);

  // Cargar catálogos
  useEffect(() => {
    cargarTiposId();
    cargarCiudades();
    cargarTiposServicio();
    cargarTiposPbs();
    cargarEspecialidades();
    
    // Escuchar selección de paciente global
    function handlePacienteSeleccionado(e) {
      const paciente = e.detail;
      cargarDatosPaciente(paciente);
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

  function cargarDatosPaciente(paciente) {
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

  async function buscarDatosPaciente(tipo, numero) {
    try {
      const resp = await apiFetch(`${BACKEND_URL}/pacientes/documento/${tipo}/${numero}`);
      if (resp) cargarDatosPaciente(resp);
    } catch (err) {
      console.log('Paciente no encontrado, es un registro nuevo');
    }
  }

  async function cargarTiposId() {
    try {
      const resp = await apiFetch(`${BACKEND_URL}/tiposidentificacion/`);
      setTiposId(resp.data?.map(i => ({ value: i.codigo, label: i.nombre })) || []);
    } catch (err) { console.error(err); }
  }

  async function cargarCiudades() {
    try {
      const resp = await apiFetch(`${BACKEND_URL}/ciudadesresidencia/`);
      setCiudades(resp.data?.map(c => ({ value: c.nombre, label: c.nombre })) || []);
    } catch (err) { console.error(err); }
  }

  async function cargarTiposServicio() {
    try {
      const resp = await apiFetch(`${BACKEND_URL}/tiposservicio/`);
      setTiposServicio(resp.data?.map(t => ({ value: t.codigo, label: t.nombre })) || []);
    } catch (err) { console.error(err); }
  }

  async function cargarTiposPbs() {
    try {
      const resp = await apiFetch(`${BACKEND_URL}/tipospbs/`);
      setTiposPbs(resp.data?.map(t => ({ value: t.codigo, label: t.nombre })) || []);
    } catch (err) { console.error(err); }
  }

  async function cargarEspecialidades() {
    try {
      const resp = await apiFetch(`${BACKEND_URL}/especialidades/?solo_activos=true`);
      setEspecialidades(resp.data || []);
    } catch (err) { console.error(err); }
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
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad;
  }

  function validarEdadYTipoDocumento() {
    if (!fechaNac || !tipoIdentificacion) return true;
    const edadPaciente = calcularEdad(fechaNac);
    const tipo = (tipoIdentificacion || '').trim().toUpperCase();
    if (edadPaciente >= 0 && edadPaciente <= 6 && !['RC', 'NUIP', 'R.C.'].includes(tipo)) {
      showToast('Menores de 6 años deben tener Registro Civil (RC/NUIP)', 'error');
      return false;
    }
    if (edadPaciente >= 7 && edadPaciente <= 17 && !['TI', 'T.I.'].includes(tipo)) {
      showToast('Menores de 7 a 17 años deben tener Tarjeta de Identidad (TI)', 'error');
      return false;
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

    // Validación básica HTML5
    const tab1 = document.getElementById('tab-paciente-main');
    if (tab1) {
      const inputs = tab1.querySelectorAll('input, select, textarea');
      let ok = true;
      inputs.forEach((el) => { if (!el.checkValidity()) ok = false; });
      if (!ok) {
        showToast('Completa los datos obligatorios del paciente.', 'error');
        form.reportValidity();
        return false;
      }
    }

    if (!validarEdadYTipoDocumento()) return false;

    if (mostrarCamposAcompanante) {
      if (!tipoDocAcompanante || !nombreAcompanante || !parentescoAcompanante) {
        showToast('Datos del acompañante incompletos', 'error');
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

  function handleAbrirModalAgendar() {
    setShowModalAgendar(true);
  }

  function handleConfirmarCita(datos) {
    setProfesionalId(datos.profesional_id);
    setProfesional(datos.profesional_nombre);
    setFechaProg(datos.fecha);
    setHoraRecomendada(datos.hora_inicio);
    setHoraFin(datos.hora_fin);
    setShowModalAgendar(false);
    showToast('Cita seleccionada. Complete el formulario para confirmar.', 'success');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = formRef.current;
    if (!form || !form.checkValidity()) {
      form?.reportValidity();
      return;
    }

    if (!tipoServicio || !motivoCita) {
      showToast('Seleccione tipo de servicio y motivo.', 'error');
      return;
    }

    if (!profesionalId) {
      showToast('Debe programar la cita (botón Agenda).', 'error');
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
      profesional_id: profesionalId,
      fecha_programacion: fechaProg,
      fecha_solicitada: fechaSolicitada,
      hora: horaRecomendada,
      hora_fin: horaFin,
      tipo_servicio: tipoServicio,
      tipo_pbs: tipoPbs,
      mas_6_meses: chk6Meses,
      motivo_cita: motivoCita,
      observacion,
    };

    try {
      await apiFetch(`${BACKEND_URL}/citas/`, {
        method: 'POST', body: JSON.stringify(payload),
      });

      setDatosConfirmacion({
        nombrePaciente: nombrePaciente || 'Paciente',
        docPaciente: numeroId || '',
        fechaProgramacion: fechaProg || '',
        horaRecomendada: toAmPm(horaRecomendada),
        profesional: profesional || '',
        tipoServicio: tipoServicio || '',
      });
      setOpenConfirm(true);
      resetForm();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  const especialidadSeleccionada = especialidades.find(e => e.codigo === motivoCita);
  const duracionBase = especialidadSeleccionada?.duracion_minutos || 20;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-brand-primary)]">Agendamiento de Citas</h1>
        <p className="text-[var(--color-text-secondary)]">Gestión de pacientes y programación de citas médicas.</p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        
        {/* TABS NAVIGATION */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => handleTabClick('paciente')}
            className={`px-6 py-3 font-medium text-sm transition-colors relative outline-none focus:outline-none ${
              activeTab === 'paciente' 
                ? 'text-[var(--color-brand-primary)] border-b-2 border-[var(--color-brand-primary)]' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <FaUser /> Datos del Paciente
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('cita')}
            className={`px-6 py-3 font-medium text-sm transition-colors relative outline-none focus:outline-none ${
              activeTab === 'cita' 
                ? 'text-[var(--color-brand-primary)] border-b-2 border-[var(--color-brand-primary)]' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <FaCalendarAlt /> Programación
            </div>
          </button>
        </div>

        {/* TAB CONTENT: PACIENTE */}
        {activeTab === 'paciente' && (
          <div id="tab-paciente-main" className="animate-fadeIn">
            <Card title="Información Personal">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                <Select
                  label="Tipo de Identificación *"
                  value={tipoIdentificacion}
                  onChange={(e) => setTipoIdentificacion(e.target.value)}
                  options={[{value:'', label:'Seleccione...'}, ...tiposId]}
                  required
                />

                <Input
                  label="Número de Identificación *"
                  value={numeroId}
                  onChange={(e) => setNumeroId(e.target.value)}
                  required
                />

                <Input
                  label="Nombre Completo *"
                  value={nombrePaciente}
                  onChange={(e) => setNombrePaciente(e.target.value)}
                  required
                />

                <Input
                  label="Fecha de Nacimiento"
                  type="date"
                  value={fechaNac}
                  onChange={(e) => setFechaNac(e.target.value)}
                  helper={edad !== null ? `Edad: ${edad} años` : ''}
                />

                <Input
                  label="Teléfono Celular"
                  type="tel"
                  value={celular}
                  onChange={(e) => setCelular(e.target.value.replace(/\s+/g, ''))}
                />

                <Input
                  label="Correo Electrónico"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                />

                <div className="lg:col-span-2">
                  <Textarea
                    label="Dirección de Residencia"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    rows={2}
                  />
                </div>

                <Select
                  label="Ciudad de Residencia"
                  value={lugar}
                  onChange={(e) => setLugar(e.target.value)}
                  options={[{value:'', label:'Seleccione...'}, ...ciudades]}
                />

                <Input
                   label="Teléfono Fijo"
                   type="tel"
                   value={telefonoFijo}
                   onChange={(e) => setTelefonoFijo(e.target.value)}
                />
                
                <Input
                  label="Segundo Celular"
                  type="tel"
                  value={segundoCelular}
                  onChange={(e) => setSegundoCelular(e.target.value)}
                  placeholder="Opcional"
                />

                <Input
                  label="Titular Segundo Celular"
                  value={titularSegundoCelular}
                  onChange={(e) => setTitularSegundoCelular(e.target.value)}
                  placeholder="Ej: Madre, Esposo"
                />
              </div>

              {/* ACOMPAÑANTE SECTION */}
              {mostrarCamposAcompanante && (
                <div className="mt-8 pt-6 border-t border-gray-100 animate-fadeIn">
                  <div className="flex items-center gap-2 mb-4 text-[var(--color-brand-primary)]">
                    <FaExclamationCircle />
                    <h3 className="font-semibold">Datos del Acompañante (Obligatorio para menores)</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Select
                      label="Tipo Documento *"
                      value={tipoDocAcompanante}
                      onChange={(e) => setTipoDocAcompanante(e.target.value)}
                      options={[{value:'', label:'Seleccione...'}, ...tiposId.filter(t => t.value !== 'RC' && t.value !== 'TI')]}
                      required
                    />
                    <Input
                      label="Nombre Acompañante *"
                      value={nombreAcompanante}
                      onChange={(e) => setNombreAcompanante(e.target.value)}
                      required
                    />
                    <Input
                      label="Parentesco *"
                      value={parentescoAcompanante}
                      onChange={(e) => setParentescoAcompanante(e.target.value)}
                      placeholder="Ej: Madre, Padre"
                      required
                    />
                  </div>
                </div>
              )}
            </Card>
            
            <div className="mt-6 flex justify-end sticky bottom-4 z-10 lg:static">
               <Button 
                 type="button" 
                 onClick={() => handleTabClick('cita')}
                 className="w-full sm:w-auto shadow-lg shadow-blue-600/20"
               >
                  Siguiente: Programación &rarr;
               </Button>
            </div>
          </div>
        )}

        {/* TAB CONTENT: CITA */}
        {activeTab === 'cita' && (
          <div className="animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Form */}
              <div className="lg:col-span-2 space-y-6">
                <Card title="Datos de la Cita">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <Select
                      label="Tipo de Servicio *"
                      value={tipoServicio}
                      onChange={(e) => setTipoServicio(e.target.value)}
                      options={[{value:'', label:'Seleccione...'}, ...tiposServicio]}
                      required
                    />

                    {mostrarTipoPbs && (
                      <Select
                        label="Tipo PBS *"
                        value={tipoPbs}
                        onChange={(e) => setTipoPbs(e.target.value)}
                        options={[{value:'', label:'Seleccione...'}, ...tiposPbs]}
                        required
                      />
                    )}

                    <div className="md:col-span-2">
                       <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <input
                            type="checkbox"
                            id="chk6Meses"
                            checked={chk6Meses}
                            onChange={(e) => setChk6Meses(e.target.checked)}
                            className="w-5 h-5 text-[var(--color-brand-primary)]"
                          />
                          <label htmlFor="chk6Meses" className="text-sm text-gray-700 cursor-pointer select-none">
                            El paciente hace más de 6 meses no asiste a odontología
                          </label>
                       </div>
                    </div>

                    <div className="md:col-span-2">
                       <Button 
                          type="button" 
                          variant={tipoServicio ? 'primary' : 'ghost'} 
                          onClick={handleAbrirModalAgendar}
                          disabled={!tipoServicio}
                          className="w-full h-14 text-lg"
                        >
                          {fechaProg ? '🔄 Cambiar Agenda Seleccionada' : '📅 Buscar Agenda Disponible'}
                       </Button>
                    </div>

                    <div className="md:col-span-2">
                      <Input
                        label="Fecha Solicitada por Paciente"
                        type="date"
                        value={fechaSolicitada}
                        onChange={(e) => setFechaSolicitada(e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Textarea
                        label="Observaciones"
                        value={observacion}
                        onChange={(e) => setObservacion(e.target.value)}
                        rows={3}
                      />
                    </div>

                  </div>
                </Card>
              </div>

              {/* Right Column: Summary */}
              <div className="space-y-6">
                 <Card title="Resumen de Programación">
                    {profesional ? (
                      <div className="bg-green-50 border border-green-100 rounded-lg p-5 space-y-3">
                         <div className="flex items-center gap-2 text-green-700 font-bold border-b border-green-200 pb-2">
                            <FaCheckCircle /> Cita Seleccionada
                         </div>
                         <div className="text-sm space-y-1">
                            <p><span className="font-semibold text-gray-600">Profesional:</span> {profesional}</p>
                            <p><span className="font-semibold text-gray-600">Fecha:</span> {fechaProg}</p>
                            <p><span className="font-semibold text-gray-600">Hora:</span> {horaRecomendada} - {horaFin}</p>
                            <p><span className="font-semibold text-gray-600">Motivo:</span> {especialidadSeleccionada?.nombre || motivoCita}</p>
                         </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-5 text-center text-yellow-700 text-sm">
                         Seleccione un tipo de servicio y use el botón "Buscar Agenda" para asignar un profesional.
                      </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <Button 
                        type="submit" 
                        variant="primary" 
                        size="lg" 
                        className="w-full"
                        disabled={!profesional}
                      >
                        Confirmar Agendamiento
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="w-full mt-3"
                        onClick={() => {
                          resetForm();
                          window.scrollTo({top:0, behavior:'smooth'});
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                 </Card>
              </div>

            </div>
          </div>
        )}
      </form>

      {/* Modals */}
      <ConfirmacionCitaModal
        open={openConfirm}
        datos={datosConfirmacion}
        onClose={() => setOpenConfirm(false)}
        onDescargarPdf={() => {}}
      />

      <ModalAgendarCita
        open={showModalAgendar}
        especialidadId={motivoCita}
        motivosOptions={motivosOptions}
        onChangeMotivo={setMotivoCita} // Lógica inversa del modal, ojo: el modal usa esto para filtrar
        duracionBase={duracionBase}
        onClose={() => setShowModalAgendar(false)}
        onConfirmar={handleConfirmarCita}
      />
    </div>
  );
}
