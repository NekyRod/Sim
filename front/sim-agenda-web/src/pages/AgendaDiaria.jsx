import { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../api/client';
import { showToast, showConfirm } from '../utils/ui';
import { FaTrash, FaSearch, FaCalendarAlt, FaSortAmountDown, FaSortAmountUp, FaUserMd, FaEdit, FaFileExcel } from 'react-icons/fa';
import ModalAgendarCita from '../components/ModalAgendarCita';
import { exportToExcel } from '../utils/excel';
import { Card, Input, Select, Button, Table, Badge } from '../components/ui';

export default function AgendaDiaria() {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [profesionales, setProfesionales] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [profesionalId, setProfesionalId] = useState('0'); // 0 significa "Todos"
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'hora', direction: 'asc' });

  // Estado para modificación
  const [showModalEdit, setShowModalEdit] = useState(false);
  const [citaAEditar, setCitaAEditar] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    cargarProfesionales();
    cargarEspecialidades();
  }, []);

  useEffect(() => {
    if (fecha) {
      cargarCitas();
    }
  }, [profesionalId, fecha]);

  async function cargarProfesionales() {
    try {
      const resp = await apiFetch(`${BACKEND_URL}/profesionales/`);
      setProfesionales(resp.data || []);
    } catch (err) {
      console.error('Error cargando profesionales', err);
    }
  }

  async function cargarEspecialidades() {
    try {
      const resp = await apiFetch(`${BACKEND_URL}/especialidades/`);
      setEspecialidades(resp.data || []);
    } catch (err) {
      console.error('Error cargando especialidades', err);
    }
  }

  const motivosOptions = useMemo(() => {
    return especialidades.map(e => ({ value: e.codigo, label: e.nombre }));
  }, [especialidades]);

  async function cargarCitas() {
    setLoading(true);
    try {
      const pId = profesionalId === '0' ? 0 : parseInt(profesionalId);
      const resp = await apiFetch(`${BACKEND_URL}/citas/profesional/${pId}/rango?inicio=${fecha}&fin=${fecha}`);
      setCitas(resp.data || []);
    } catch (err) {
      showToast('Error cargando citas', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleEliminar(citaId) {
    if (await showConfirm('¿Estás seguro de que deseas eliminar esta cita?')) {
      try {
        await apiFetch(`${BACKEND_URL}/citas/${citaId}`, { method: 'DELETE' });
        showToast('Cita eliminada correctamente');
        cargarCitas();
      } catch (err) {
        showToast('Error eliminando cita: ' + err.message, 'error');
      }
    }
  }

  async function handleModificar(cita) {
    try {
      const resp = await apiFetch(`${BACKEND_URL}/citas/${cita.id}`);
      const citaFull = resp.data;
      
      let duracion = 20;
      if (citaFull.hora && citaFull.hora_fin) {
        const [hI, mI] = citaFull.hora.split(':').map(Number);
        const [hF, mF] = citaFull.hora_fin.split(':').map(Number);
        duracion = (hF * 60 + mF) - (hI * 60 + mI);
      }
      setCitaAEditar({ ...citaFull, duracion });
      setShowModalEdit(true);
    } catch (err) {
      showToast('Error cargando detalles de la cita', 'error');
    }
  }

  async function confirmarModificacion(datosNuevos) {
    const cambioFecha = datosNuevos.fecha !== citaAEditar.fecha;
    const cambioHora = datosNuevos.hora_inicio !== citaAEditar.hora;
    const cambioProf = datosNuevos.profesional_id !== citaAEditar.profesional_id;
    const cambioMotivo = datosNuevos.especialidad_id !== citaAEditar.motivo_codigo; // Verify if motif_code is correct field in full object

    if (cambioFecha || cambioHora || cambioProf || cambioMotivo) {
      const confirmado = await showConfirm('Has cambiado los datos de la cita. ¿Deseas actualizarla?');
      if (!confirmado) return;
    }

    try {
      // citaAEditar is already the full object now
      const citaFull = citaAEditar;
      
      const payload = {
        tipo_identificacion: citaFull.tipo_identificacion,
        numero_identificacion: citaFull.numero_identificacion,
        nombre_paciente: citaFull.nombre_paciente,
        telefono_fijo: citaFull.telefono_fijo,
        telefono_celular: citaFull.telefono_celular,
        segundo_telefono_celular: citaFull.segundo_telefono_celular,
        titular_segundo_celular: citaFull.titular_segundo_celular,
        direccion: citaFull.direccion,
        correo_electronico: citaFull.correo_electronico,
        lugar_residencia: citaFull.lugar_residencia,
        fecha_nacimiento: citaFull.fecha_nacimiento,
        tipo_doc_acompanante: citaFull.tipo_doc_acompanante,
        nombre_acompanante: citaFull.nombre_acompanante,
        parentesco_acompanante: citaFull.parentesco_acompanante,
        profesional_id: datosNuevos.profesional_id,
        fecha_programacion: datosNuevos.fecha,
        fecha_solicitada: citaFull.fecha_solicitada,
        hora: datosNuevos.hora_inicio,
        hora_fin: datosNuevos.hora_fin,
        tipo_servicio: citaFull.tipo_servicio,
        tipo_pbs: citaFull.tipo_pbs,
        mas_6_meses: citaFull.mas_6_meses,
        motivo_cita: datosNuevos.especialidad_id || citaAEditar.motivo_codigo,
        observacion: citaFull.observacion
      };

      await apiFetch(`${BACKEND_URL}/citas/${citaAEditar.id}`, { method: 'DELETE' });
      await apiFetch(`${BACKEND_URL}/citas/`, { method: 'POST', body: JSON.stringify(payload) });

      showToast('Cita actualizada correctamente');
      setShowModalEdit(false);
      setCitaAEditar(null);
      cargarCitas();
    } catch (err) {
      showToast('Error al actualizar la cita: ' + err.message, 'error');
    }
  }

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const filteredAndSortedCitas = useMemo(() => {
    let result = [...citas];
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.paciente.toLowerCase().includes(lowerSearch) ||
        c.documento.toLowerCase().includes(lowerSearch) ||
        c.motivo.toLowerCase().includes(lowerSearch) ||
        c.profesional.toLowerCase().includes(lowerSearch) ||
        (c.telefono_fijo && c.telefono_fijo.toLowerCase().includes(lowerSearch))
      );
    }
    result.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [citas, searchTerm, sortConfig]);

  const handleExportExcel = () => {
    if (filteredAndSortedCitas.length === 0) return showToast('No hay datos filtrados para exportar', 'error');
    const dataToExport = filteredAndSortedCitas.map(cita => ({
      'Hora': `${cita.hora} - ${cita.hora_fin || ''}`,
      'Paciente': cita.paciente,
      'Documento': cita.documento,
      'Motivo': cita.motivo,
      'Profesional': cita.profesional || ''
    }));
    exportToExcel(dataToExport, `Agenda_${fecha}.xlsx`, 'Agenda Diaria');
  };

  const getHeader = (label, key) => (
    <div 
      className="flex items-center gap-2 cursor-pointer select-none hover:text-blue-500 transition-colors"
      onClick={() => handleSort(key)}
    >
      {label}
      {sortConfig.key === key && (
        sortConfig.direction === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />
      )}
    </div>
  );

  const columns = [
    { key: 'hora', label: getHeader('Hora', 'hora'), render: (_,r) => <span className="font-mono text-blue-900 font-bold">{r.hora}</span> },
    { key: 'paciente', label: getHeader('Paciente', 'paciente') },
    { key: 'documento', label: getHeader('Documento', 'documento'), render: (val) => <span className="font-mono text-xs">{val}</span> },
    { key: 'motivo', label: getHeader('Motivo', 'motivo'), render: (val) => <Badge variant="info" size="sm">{val}</Badge> },
    { key: 'telefono_fijo', label: 'Contacto', render: (val, row) => <div className="text-xs">{val} <br/> {row.telefono_celular}</div> },
    { key: 'nombre_acompanante', label: 'Acompañante', render: (val) => val || '-' },
  ];

  if (profesionalId === '0') {
    columns.push({
       key: 'profesional',
       label: getHeader('Profesional', 'profesional'),
       render: (val) => <div className="flex items-center gap-1 text-xs text-slate-500"><FaUserMd /> {val}</div>
    });
  }

  columns.push({
    key: 'actions',
    label: 'Acciones',
    render: (_, row) => (
      <div className="flex gap-2 justify-center">
        <Button variant="ghost" size="sm" onClick={() => handleModificar(row)} className="!p-2 text-blue-600 hover:text-blue-800">
          <FaEdit />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleEliminar(row.id)} className="!p-2 text-red-600 hover:text-red-800">
          <FaTrash />
        </Button>
      </div>
    )
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-brand-primary)]">Agenda Diaria</h1>
          <p className="text-[var(--color-text-secondary)]">Vista detallada de citas programadas por día.</p>
        </div>
        <Button onClick={handleExportExcel} variant="success" className="flex items-center gap-2">
           <FaFileExcel /> Exportar
        </Button>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <Input 
            type="date" 
            label="Fecha de Agenda"
            value={fecha} 
            onChange={(e) => setFecha(e.target.value)}
          />
          <Select
            label="Filtrar por Profesional"
            value={profesionalId}
            onChange={(e) => setProfesionalId(e.target.value)}
            options={[{value:'0', label:'Todos los profesionales'}, ...profesionales.map(p => ({value:p.id, label:p.nombre_completo}))]}
          />
          <Input
            placeholder="Buscar paciente, motivo..."
            label="Búsqueda Rápida"
            icon={<FaSearch />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
         <Table
            columns={columns}
            data={filteredAndSortedCitas}
            emptyMessage={loading ? 'Cargando agenda...' : 'No hay citas programadas para este día.'}
         />
      </Card>

      <ModalAgendarCita 
        open={showModalEdit}
        especialidadId={citaAEditar?.motivo_codigo}
        motivosOptions={motivosOptions}
        duracionBase={20}
        onClose={() => {setShowModalEdit(false); setCitaAEditar(null);}}
        onConfirmar={confirmarModificacion}
        citaEdicion={citaAEditar}
      />
    </div>
  );
}
