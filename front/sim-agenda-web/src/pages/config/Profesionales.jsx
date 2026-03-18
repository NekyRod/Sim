import { useState, useEffect, useMemo } from 'react';
import { FaUserMd, FaSearch, FaFileExcel, FaEdit, FaTrash, FaUserPlus, FaStethoscope } from 'react-icons/fa';
import { apiFetch } from '../../api/client';
import { showToast, showConfirm } from '../../utils/ui';
import { exportToExcel } from '../../utils/excel';
import ModalEspecialidades from '../../components/ModalEspecialidades';
import { Card, Input, Select, Button, Table, Badge } from '../../components/ui';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function Profesionales() {
  const [profesionales, setProfesionales] = useState([]);
  const [prenombres, setPrenombres] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [tiposIdentificacion, setTiposIdentificacion] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [profesionalEditando, setProfesionalEditando] = useState(null);

  // Modal especialidades secundarias
  const [showModalEspecialidades, setShowModalEspecialidades] = useState(false);
  const [especialidadesSecundarias, setEspecialidadesSecundarias] = useState([]);

  // Campos del formulario
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [prenombreId, setPrenombreId] = useState('');
  const [tipoIdentificacion, setTipoIdentificacion] = useState('');
  const [numeroIdentificacion, setNumeroIdentificacion] = useState('');
  const [nit, setNit] = useState('');
  const [correo, setCorreo] = useState('');
  const [celular, setCelular] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [direccion, setDireccion] = useState('');
  const [especialidadId, setEspecialidadId] = useState('');
  const [estadoCuenta, setEstadoCuenta] = useState('Habilitada');
  const [activo, setActivo] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProfesionales = useMemo(() => {
    if (!searchTerm) return profesionales;
    const lower = searchTerm.toLowerCase();
    return profesionales.filter(p => 
      p.nombre_completo.toLowerCase().includes(lower) ||
      p.numero_identificacion.toLowerCase().includes(lower) ||
      (p.especialidad && p.especialidad.toLowerCase().includes(lower))
    );
  }, [profesionales, searchTerm]);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  async function cargarDatosIniciales() {
    setLoading(true);
    try {
      const [profResp, prenResp, espResp, tiposResp] = await Promise.all([
        apiFetch(`${BACKEND_URL}/profesionales/`),
        apiFetch(`${BACKEND_URL}/prenombres/`),
        apiFetch(`${BACKEND_URL}/especialidades/`),
        apiFetch(`${BACKEND_URL}/tiposidentificacion/`)
      ]);

      setProfesionales(profResp.data || []);
      setPrenombres(prenResp.data || []);
      setEspecialidades(espResp.data || []);
      setTiposIdentificacion(tiposResp.data || []);
      setError(null);
    } catch (err) {
      setError('Error al cargar datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const prenombreSeleccionado = prenombres.find(p => p.id === parseInt(prenombreId));
    const prenombreTexto = prenombreSeleccionado ? prenombreSeleccionado.nombre : '';
    const nombreCompleto = `${prenombreTexto} ${nombre} ${apellidos}`.trim();

    const datos = {
      nombre,
      apellidos,
      prenombre_id: prenombreId ? parseInt(prenombreId) : null,
      tipo_identificacion: tipoIdentificacion,
      numero_identificacion: numeroIdentificacion,
      nit: nit || null,
      correo: correo || null,
      celular: celular || null,
      telefono: telefono || null,
      nombre_completo: nombreCompleto,
      ciudad: ciudad || null,
      departamento: departamento || null,
      direccion: direccion || null,
      especialidad_id: especialidadId ? parseInt(especialidadId) : null,
      estado_cuenta: estadoCuenta,
      activo,
      especialidades_secundarias: especialidadesSecundarias.map(e => e.id)
    };

    try {
      if (modoEdicion && profesionalEditando) {
        await apiFetch(`${BACKEND_URL}/profesionales/${profesionalEditando.id}`, {
          method: 'PUT',
          body: JSON.stringify(datos)
        });
        showToast('Profesional actualizado correctamente');
      } else {
        await apiFetch(`${BACKEND_URL}/profesionales/`, {
          method: 'POST',
          body: JSON.stringify(datos)
        });
        showToast('Profesional creado correctamente');
      }

      limpiarFormulario();
      cargarDatosIniciales();
    } catch (err) {
      console.error('Error al guardar:', err);
      showToast('Error al guardar el profesional', 'error');
    }
  }

  function handleEditar(profesional) {
    setModoEdicion(true);
    setProfesionalEditando(profesional);
    setNombre(profesional.nombre || '');
    setApellidos(profesional.apellidos || '');
    setPrenombreId(profesional.prenombre_id || '');
    setTipoIdentificacion(profesional.tipo_identificacion || '');
    setNumeroIdentificacion(profesional.numero_identificacion || '');
    setNit(profesional.nit || '');
    setCorreo(profesional.correo || '');
    setCelular(profesional.celular || '');
    setTelefono(profesional.telefono || '');
    setCiudad(profesional.ciudad || '');
    setDepartamento(profesional.departamento || '');
    setDireccion(profesional.direccion || '');
    setEspecialidadId(profesional.especialidad_id || '');
    setEstadoCuenta(profesional.estado_cuenta || 'Habilitada');
    setActivo(profesional.activo !== false);
    setEspecialidadesSecundarias(profesional.especialidades_secundarias || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleEliminar(id) {
    if (await showConfirm('¿Está seguro de eliminar este profesional?')) {
      try {
        await apiFetch(`${BACKEND_URL}/profesionales/${id}`, { method: 'DELETE' });
        showToast('Profesional eliminado correctamente');
        cargarDatosIniciales();
      } catch (err) {
        console.error('Error al eliminar:', err);
        showToast('Error al eliminar el profesional', 'error');
      }
    }
  }

  function limpiarFormulario() {
    setNombre('');
    setApellidos('');
    setPrenombreId('');
    setTipoIdentificacion('');
    setNumeroIdentificacion('');
    setNit('');
    setCorreo('');
    setCelular('');
    setTelefono('');
    setCiudad('');
    setDepartamento('');
    setDireccion('');
    setEspecialidadId('');
    setEstadoCuenta('Habilitada');
    setActivo(true);
    setEspecialidadesSecundarias([]);
    setModoEdicion(false);
    setProfesionalEditando(null);
  }

  function handleToggleEspecialidadSecundaria(especialidad) {
    const yaExiste = especialidadesSecundarias.find(e => e.id === especialidad.id);
    if (yaExiste) {
      setEspecialidadesSecundarias(especialidadesSecundarias.filter(e => e.id !== especialidad.id));
    } else {
      setEspecialidadesSecundarias([...especialidadesSecundarias, especialidad]);
    }
  }

  function handleExportExcel() {
    if (filteredProfesionales.length === 0) return showToast('No hay datos para exportar', 'error');
    const dataToExport = filteredProfesionales.map(p => ({
      'Nombre Completo': p.nombre_completo,
      'Tipo ID': p.tipo_identificacion,
      'Número ID': p.numero_identificacion,
      'Especialidad': p.especialidad || 'N/A',
      'Celular': p.celular || '',
      'Estado': p.estado_cuenta,
      'Activo': p.activo ? 'Sí' : 'No'
    }));
    exportToExcel(dataToExport, 'Profesionales.xlsx', 'Profesionales');
  }

  const columns = [
    { key: 'nombre_completo', label: 'Nombre' },
    { key: 'tipo_identificacion', label: 'Tipo ID', render: (val) => <Badge size="sm" variant="neutral">{val}</Badge> },
    { key: 'numero_identificacion', label: 'Número ID' },
    { key: 'especialidad', label: 'Especialidad', render: (val) => <Badge variant="info">{val || 'N/A'}</Badge> },
    { key: 'celular', label: 'Celular', render: (val) => val || 'N/A' },
    { 
      key: 'estado_cuenta', 
      label: 'Estado',
      render: (val, row) => (
         <Badge variant={val === 'Habilitada' && row.activo ? 'success' : 'danger'}>
           {val} {row.activo ? '' : '(Inactivo)'}
         </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEditar(row)} className="!p-2 text-blue-600 hover:text-blue-800">
            <FaEdit />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleEliminar(row.id)} className="!p-2 text-red-600 hover:text-red-800">
            <FaTrash />
          </Button>
        </div>
      )
    }
  ];

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando base de profesionales...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-brand-primary)]">Gestión de Profesionales</h1>
          <p className="text-[var(--color-text-secondary)]">Directorio médico y configuración de especialistas.</p>
        </div>
        <div className="flex gap-2">
           <Button onClick={handleExportExcel} variant="success" className="flex items-center gap-2">
             <FaFileExcel /> Exportar
           </Button>
        </div>
      </div>

      {/* Form Card */}
      <Card title={modoEdicion ? 'Editar Profesional' : 'Nuevo Profesional'} icon={<FaUserPlus />}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Select
               label="Prenombre"
               value={prenombreId}
               onChange={(e) => setPrenombreId(e.target.value)}
               options={[{value:'', label:'Seleccione...'}, ...prenombres.map(p => ({value:p.id, label:p.nombre}))]}
            />
            <Input
               label="Nombre *"
               value={nombre}
               onChange={(e) => setNombre(e.target.value)}
               placeholder="Nombres"
               required
            />
            <Input
               label="Apellidos *"
               value={apellidos}
               onChange={(e) => setApellidos(e.target.value)}
               placeholder="Apellidos"
               required
            />
            <Select
               label="Tipo Identificación *"
               value={tipoIdentificacion}
               onChange={(e) => setTipoIdentificacion(e.target.value)}
               options={[{value:'', label:'Seleccione...'}, ...tiposIdentificacion.map(t => ({value:t.codigo, label:t.nombre}))]}
               required
            />
            <Input
               label="Número Identificación *"
               value={numeroIdentificacion}
               onChange={(e) => setNumeroIdentificacion(e.target.value)}
               placeholder="12345678"
               required
            />
            <Input
               label="NIT"
               value={nit}
               onChange={(e) => setNit(e.target.value)}
            />
            <Input
               label="Correo Personal"
               type="email"
               value={correo}
               onChange={(e) => setCorreo(e.target.value)}
            />
            <Input
               label="Celular"
               type="tel"
               value={celular}
               onChange={(e) => setCelular(e.target.value)}
            />
            <Input
               label="Teléfono Fijo"
               type="tel"
               value={telefono}
               onChange={(e) => setTelefono(e.target.value)}
            />
            <Input
               label="Ciudad"
               value={ciudad}
               onChange={(e) => setCiudad(e.target.value)}
            />
            <Input
               label="Departamento"
               value={departamento}
               onChange={(e) => setDepartamento(e.target.value)}
            />
            <Input
               label="Dirección Residencia"
               value={direccion}
               onChange={(e) => setDireccion(e.target.value)}
            />
            
            <div className="lg:col-span-3 border-t border-gray-100 pt-6 mt-2 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-3 flex items-center gap-2 text-[var(--color-brand-primary)] font-semibold mb-2">
                 <FaStethoscope /> Información Profesional
              </div>

               <Select
                  label="Especialidad Principal"
                  value={especialidadId}
                  onChange={(e) => setEspecialidadId(e.target.value)}
                  options={[{value:'', label:'Seleccione...'}, ...especialidades.map(e => ({value:e.id, label:e.nombre}))]}
               />

               <Select
                  label="Estado Cuenta"
                  value={estadoCuenta}
                  onChange={(e) => setEstadoCuenta(e.target.value)}
                  options={[
                    {value:'Habilitada', label:'Habilitada'},
                    {value:'Deshabilitada', label:'Deshabilitada'},
                    {value:'Suspendida', label:'Suspendida'},
                  ]}
               />
               
               <div className="flex items-center pt-8">
                 <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={activo}
                      onChange={(e) => setActivo(e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700 font-medium">Profesional Activo en Sistema</span>
                 </label>
               </div>

               <div className="lg:col-span-3">
                 <label className="block text-sm font-medium text-gray-700 mb-2">Especialidades Secundarias</label>
                 <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowModalEspecialidades(true)}>
                      Administrar ({especialidadesSecundarias.length})
                    </Button>
                    <div className="flex flex-wrap gap-2">
                       {especialidadesSecundarias.length > 0 ? (
                         especialidadesSecundarias.map(e => <Badge key={e.id} size="sm">{e.nombre}</Badge>)
                       ) : (
                         <span className="text-sm text-gray-400 italic">No hay asignadas.</span>
                       )}
                    </div>
                 </div>
               </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
             {modoEdicion && (
               <Button type="button" variant="ghost" onClick={limpiarFormulario}>
                 Cancelar Edición
               </Button>
             )}
             <Button type="submit" variant={modoEdicion ? 'secondary' : 'primary'}>
               {modoEdicion ? 'Actualizar Profesional' : 'Guardar Profesional'}
             </Button>
          </div>
        </form>
      </Card>

      {/* Table Card */}
      <Card className="overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
           <h3 className="font-bold text-lg text-gray-800">Listado de Profesionales</h3>
           <div className="w-full sm:w-72">
             <Input
               placeholder="Buscar profesional..."
               icon={<FaSearch />}
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
        </div>
        <Table
           columns={columns}
           data={filteredProfesionales}
           emptyMessage="No se encontraron profesionales registrados."
        />
      </Card>
      
      {/* Modal is external, we keep it as is since it likely uses specific internal logic. 
          If looking inconsistent, we can refactor later. */}
      <ModalEspecialidades
        open={showModalEspecialidades}
        especialidades={especialidades}
        especialidadPrincipalId={especialidadId}
        especialidadesSeleccionadas={especialidadesSecundarias}
        onToggle={handleToggleEspecialidadSecundaria}
        onClose={() => setShowModalEspecialidades(false)}
      />
    </div>
  );
}
