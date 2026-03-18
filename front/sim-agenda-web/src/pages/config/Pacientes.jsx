import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api/client';
import { showToast, showConfirm } from '../../utils/ui';
import { exportToExcel } from '../../utils/excel';
import { FaSearch, FaFileExcel, FaUserPlus, FaEdit, FaTrash, FaUserShield, FaTooth } from 'react-icons/fa';
import { Card, Input, Select, Button, Table, Badge, Textarea } from '../../components/ui';
import PatientForm from '../../components/admin/PatientForm';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const initForm = {
  id: null,
  tipo_identificacion: '',
  numero_identificacion: '',
  nombre_completo: '',
  telefono_fijo: '',
  telefono_celular: '',
  segundo_telefono_celular: '',
  titular_segundo_celular: '',
  correo_electronico: '',
  direccion: '',
  lugar_residencia: '',
  fecha_nacimiento: '',
  // Campos del acompañante
  tipo_doc_acompanante: '',
  nombre_acompanante: '',
  parentesco_acompanante: '',
};

export default function Pacientes() {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState([]);
  const [tiposIdentificacion, setTiposIdentificacion] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [form, setForm] = useState(initForm);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [edad, setEdad] = useState(null);
  const [mostrarCamposAcompanante, setMostrarCamposAcompanante] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Efectos
  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (form.fecha_nacimiento) {
      setEdad(calcularEdad(form.fecha_nacimiento));
    } else {
      setEdad(null);
    }
  }, [form.fecha_nacimiento]);

  useEffect(() => {
    if (form.tipo_identificacion === 'RC' || form.tipo_identificacion === 'TI') {
      setMostrarCamposAcompanante(true);
    } else {
      setMostrarCamposAcompanante(false);
      setForm(prev => ({
        ...prev,
        tipo_doc_acompanante: '',
        nombre_acompanante: '',
        parentesco_acompanante: ''
      }));
    }
  }, [form.tipo_identificacion]);

  // 2. Carga de datos
  async function cargarDatos() {
    try {
      setCargando(true);
      await Promise.all([
        cargarPacientes(),
        cargarTiposIdentificacion(),
        cargarCiudades()
      ]);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCargando(false);
    }
  }

  async function cargarPacientes() {
    try {
      const resp = await apiFetch(`${BACKEND_URL}/pacientes/`);
      setPacientes(resp.data || []);
    } catch (err) {
      showToast('Error cargando pacientes: ' + err.message, 'error');
    }
  }

  async function cargarTiposIdentificacion() {
    try {
      const resp = await apiFetch(`${BACKEND_URL}/tiposidentificacion/`);
      setTiposIdentificacion(resp.data || []);
    } catch (err) { console.error(err); }
  }

  async function cargarCiudades() {
    try {
      const resp = await apiFetch(`${BACKEND_URL}/ciudadesresidencia/`);
      setCiudades(resp.data || []);
    } catch (err) { console.error(err); }
  }

  // 3. Lógica auxiliar
  function calcularEdad(fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad;
  }

  function validarEdadYTipoDocumento() {
    if (!form.fecha_nacimiento || !form.tipo_identificacion) return true;
    const edadPaciente = calcularEdad(form.fecha_nacimiento);
    if (edadPaciente >= 0 && edadPaciente <= 6 && form.tipo_identificacion !== 'RC') {
      showToast('Menores de 6 años deben tener Registro Civil (RC)', 'error');
      return false;
    }
    if (edadPaciente >= 7 && edadPaciente <= 17 && form.tipo_identificacion !== 'TI') {
      showToast('Menores de 7 a 17 años deben tener Tarjeta de Identidad (TI)', 'error');
      return false;
    }
    return true;
  }

  const filteredPacientes = useMemo(() => {
    if (!searchTerm) return pacientes;
    const lower = searchTerm.toLowerCase();
    return pacientes.filter(p => 
      p.nombre_completo.toLowerCase().includes(lower) ||
      p.numero_identificacion.toLowerCase().includes(lower) ||
      (p.lugar_residencia && p.lugar_residencia.toLowerCase().includes(lower)) ||
      (p.telefono_celular && p.telefono_celular.includes(lower))
    );
  }, [pacientes, searchTerm]);

  // 4. Manejo de formulario
  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.tipo_identificacion || !form.numero_identificacion || !form.nombre_completo) {
      showToast('Campos obligatorios incompletos', 'error');
      return;
    }
    if (!validarEdadYTipoDocumento()) return;

    if (mostrarCamposAcompanante) {
      if (!form.tipo_doc_acompanante || !form.nombre_acompanante || !form.parentesco_acompanante) {
        showToast('Datos del acompañante incompletos', 'error');
        return;
      }
    }

    try {
      if (editando && form.id) {
        await apiFetch(`${BACKEND_URL}/pacientes/${form.id}`, { method: 'PUT', body: JSON.stringify(form) });
        showToast('Paciente actualizado correctamente');
      } else {
        await apiFetch(`${BACKEND_URL}/pacientes/`, { method: 'POST', body: JSON.stringify(form) });
        showToast('Paciente creado correctamente');
      }
      limpiarForm();
      cargarPacientes();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleEliminar(id) {
    if (await showConfirm('¿Está seguro de eliminar este paciente?')) {
      try {
        await apiFetch(`${BACKEND_URL}/pacientes/${id}`, { method: 'DELETE' });
        showToast('Paciente eliminado');
        cargarPacientes();
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  }

  function handleEditar(paciente) {
    setForm(paciente);
    setEditando(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function limpiarForm() {
    setForm(initForm);
    setEditando(false);
    setEdad(null);
  }

  function handleExportExcel() {
    if (filteredPacientes.length === 0) return showToast('Sin datos para exportar', 'error');
    const dataToExport = filteredPacientes.map(p => ({
      'Tipo ID': p.tipo_identificacion,
      'Número ID': p.numero_identificacion,
      'Nombre Completo': p.nombre_completo,
      'Edad': p.fecha_nacimiento ? calcularEdad(p.fecha_nacimiento) : 'N/A',
      'Celular': p.telefono_celular,
      'Ciudad': p.lugar_residencia,
    }));
    exportToExcel(dataToExport, 'Pacientes.xlsx', 'Pacientes');
  }

  // 5. Configuración de tabla
  const columns = [
    { 
      key: 'tipo_identificacion', 
      label: 'Tipo',
      render: (val) => <Badge size="sm" variant="neutral">{val}</Badge>
    },
    { key: 'numero_identificacion', label: 'Documento' },
    { key: 'nombre_completo', label: 'Nombre' },
    { 
      key: 'fecha_nacimiento', 
      label: 'Edad',
      render: (val) => val ? `${calcularEdad(val)} años` : 'N/A'
    },
    { 
      key: 'telefono_celular', 
      label: 'Contacto',
      render: (val, row) => val || row.telefono_fijo || 'N/A'
    },
    { key: 'lugar_residencia', label: 'Ciudad' },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEditar(row)} className="!p-2 text-blue-600 hover:text-blue-800">
            <FaEdit />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/pacientes/${row.id}/odontograma`)} className="!p-2 text-indigo-600 hover:text-indigo-800" title="Odontograma">
            <FaTooth />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleEliminar(row.id)} className="!p-2 text-red-600 hover:text-red-800">
            <FaTrash />
          </Button>
        </div>
      )
    }
  ];

  if (cargando) return <div className="p-8 text-center text-gray-500">Cargando módulo de pacientes...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-brand-primary)]">Gestión de Pacientes</h1>
          <p className="text-[var(--color-text-secondary)]">Administración de base de datos de pacientes.</p>
        </div>
        <div className="flex gap-2">
           <Button onClick={handleExportExcel} variant="success" className="flex items-center gap-2">
             <FaFileExcel /> Exportar
           </Button>
        </div>
      </div>

      {/* Form Card */}
      <Card title={editando ? 'Editar Paciente' : 'Nuevo Paciente'} icon={<FaUserPlus />}>
        <PatientForm 
          initialData={editando ? form : null}
          onSuccess={() => {
            cargarPacientes();
            limpiarForm();
          }}
          onCancel={editando ? limpiarForm : null}
        />
      </Card>

      {/* Table Card */}
      <Card className="overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
           <h3 className="font-bold text-lg text-gray-800">Listado de Pacientes</h3>
           <div className="w-full sm:w-72">
             <Input
               placeholder="Buscar por nombre o documento..."
               icon={<FaSearch />}
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
        </div>
        <Table
           columns={columns}
           data={filteredPacientes}
           emptyMessage="No se encontraron pacientes registrados."
        />
      </Card>
    </div>
  );
}
