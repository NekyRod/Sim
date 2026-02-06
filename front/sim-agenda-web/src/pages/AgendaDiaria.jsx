// src/pages/AgendaDiaria.jsx
import { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../api/client';
import { showToast, showConfirm } from '../utils/ui';
import { FaTrash, FaSearch, FaCalendarAlt, FaSortAmountDown, FaSortAmountUp, FaUserMd, FaEdit, FaFileExcel } from 'react-icons/fa';
import ModalAgendarCita from '../components/ModalAgendarCita';
import { exportToExcel } from '../utils/excel';
import '../styles/estilos.css';

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
      const resp = await apiFetch(`${BACKEND_URL}/profesionales`);
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
    return especialidades.map(e => ({ v: e.codigo, t: e.nombre }));
  }, [especialidades]);

  async function cargarCitas() {
    setLoading(true);
    try {
      // Si profesionalId es '0', el backend ahora lo maneja para traer todos
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
    const confirmado = await showConfirm('¿Estás seguro de que deseas eliminar esta cita?', {
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    });

    if (!confirmado) return;

    try {
      await apiFetch(`${BACKEND_URL}/citas/${citaId}`, { method: 'DELETE' });
      showToast('Cita eliminada correctamente');
      cargarCitas();
    } catch (err) {
      showToast('Error eliminando cita: ' + err.message, 'error');
    }
  }

  function handleModificar(cita) {
    // Calcular duración de la cita actual
    let duracion = 20;
    if (cita.hora && cita.hora_fin) {
      const [hI, mI] = cita.hora.split(':').map(Number);
      const [hF, mF] = cita.hora_fin.split(':').map(Number);
      duracion = (hF * 60 + mF) - (hI * 60 + mI);
    }
    setCitaAEditar({ ...cita, duracion });
    setShowModalEdit(true);
  }

  async function confirmarModificacion(datosNuevos) {
    // Verificar si cambiaron los datos críticos
    const cambioFecha = datosNuevos.fecha !== citaAEditar.fecha;
    const cambioHora = datosNuevos.hora_inicio !== citaAEditar.hora;
    const cambioProf = datosNuevos.profesional_id !== citaAEditar.profesional_id;
    const cambioMotivo = datosNuevos.especialidad_id !== citaAEditar.motivo_codigo;

    if (cambioFecha || cambioHora || cambioProf || cambioMotivo) {
      const confirmado = await showConfirm('Has cambiado los datos de la cita. ¿Estás seguro de que deseas actualizarla? Se liberará el espacio anterior y se asignará el nuevo.', {
        confirmText: 'Actualizar',
        cancelText: 'Cancelar'
      });
      if (!confirmado) return;
    }

    try {
      // 1. Obtener datos completos del paciente para la nueva cita
      const resp = await apiFetch(`${BACKEND_URL}/citas/${citaAEditar.id}`);
      const citaFull = resp.data;
      
      // 2. Preparar payload para la nueva cita
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

      // 3. Eliminar la anterior
      await apiFetch(`${BACKEND_URL}/citas/${citaAEditar.id}`, { method: 'DELETE' });

      // 4. Crear la nueva
      await apiFetch(`${BACKEND_URL}/citas/`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

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
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <FaSortAmountUp className="sort-icon" /> : <FaSortAmountDown className="sort-icon" />;
  };

  const filteredAndSortedCitas = useMemo(() => {
    let result = [...citas];

    // Filtro
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.paciente.toLowerCase().includes(lowerSearch) ||
        c.documento.toLowerCase().includes(lowerSearch) ||
        c.motivo.toLowerCase().includes(lowerSearch) ||
        c.profesional.toLowerCase().includes(lowerSearch) ||
        (c.telefono_fijo && c.telefono_fijo.toLowerCase().includes(lowerSearch)) ||
        (c.segundo_telefono_celular && c.segundo_telefono_celular.toLowerCase().includes(lowerSearch)) ||
        (c.titular_segundo_celular && c.titular_segundo_celular.toLowerCase().includes(lowerSearch)) ||
        (c.nombre_acompanante && c.nombre_acompanante.toLowerCase().includes(lowerSearch))
      );
    }

    // Ordenamiento
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
    if (filteredAndSortedCitas.length === 0) {
      showToast('No hay datos filtrados para exportar', 'error');
      return;
    }

    const dataToExport = filteredAndSortedCitas.map(cita => ({
      'Hora': `${cita.hora} - ${cita.hora_fin || ''}`,
      'Paciente': cita.paciente,
      'Documento': cita.documento,
      'Motivo': cita.motivo,
      'Tel. Fijo': cita.telefono_fijo || '',
      '2do Celular': cita.segundo_telefono_celular || '',
      'Titular 2do Cel': cita.titular_segundo_celular || '',
      'Acompañante': cita.nombre_acompanante || '',
      'Profesional': cita.profesional || ''
    }));

    const fileName = `Agenda_${fecha}_${profesionalId === '0' ? 'Todos' : profesionalId}.xlsx`;
    exportToExcel(dataToExport, fileName, 'Agenda Diaria');
    showToast('Archivo Excel generado correctamente');
  };

  return (
    <div className="agenda-diaria-container">
      <div className="agenda-diaria-panel">
        <h2 className="agenda-diaria-titulo">
          <FaCalendarAlt /> Agenda Diaria
        </h2>

        <div className="agenda-diaria-filtros">
          <div className="filtro-group">
            <label className="filtro-label">Fecha</label>
            <input 
              type="date" 
              className="filtro-input"
              value={fecha} 
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          <div className="filtro-group">
            <label className="filtro-label">Profesional</label>
            <select 
              className="filtro-select"
              value={profesionalId} 
              onChange={(e) => setProfesionalId(e.target.value)}
            >
              <option value="0">-- Todos los profesionales --</option>
              {profesionales.map(p => (
                <option key={p.id} value={p.id}>{p.nombre_completo}</option>
              ))}
            </select>
          </div>

          <div className="search-input-wrapper">
            <label className="filtro-label">Buscar en agenda</label>
            <div style={{ position: 'relative', display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input 
                  type="text" 
                  className="filtro-input"
                  placeholder="Paciente, documento o motivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%' }}
                />
                <FaSearch className="search-icon-inside" />
              </div>
              <button 
                onClick={handleExportExcel}
                className="btn-excel"
                title="Descargar a Excel"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#1d6f42',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0 15px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  height: '38px',
                  whiteSpace: 'nowrap'
                }}
              >
                <FaFileExcel /> Descargar a Excel
              </button>
            </div>
          </div>
        </div>

        <div className="tabla-container">
          <table className="agenda-tabla">
            <thead>
              <tr>
                <th onClick={() => handleSort('hora')} className={sortConfig.key === 'hora' ? 'sort-active' : ''}>
                  Hora {getSortIcon('hora')}
                </th>
                <th onClick={() => handleSort('paciente')} className={sortConfig.key === 'paciente' ? 'sort-active' : ''}>
                  Paciente {getSortIcon('paciente')}
                </th>
                <th onClick={() => handleSort('documento')} className={sortConfig.key === 'documento' ? 'sort-active' : ''}>
                  Documento {getSortIcon('documento')}
                </th>
                <th onClick={() => handleSort('motivo')} className={sortConfig.key === 'motivo' ? 'sort-active' : ''}>
                  Motivo {getSortIcon('motivo')}
                </th>
                <th onClick={() => handleSort('telefono_fijo')} className={sortConfig.key === 'telefono_fijo' ? 'sort-active' : ''}>
                  Tel. Fijo {getSortIcon('telefono_fijo')}
                </th>
                <th onClick={() => handleSort('segundo_telefono_celular')} className={sortConfig.key === 'segundo_telefono_celular' ? 'sort-active' : ''}>
                  2do Celular {getSortIcon('segundo_telefono_celular')}
                </th>
                <th onClick={() => handleSort('titular_segundo_celular')} className={sortConfig.key === 'titular_segundo_celular' ? 'sort-active' : ''}>
                  Titular 2do Cel {getSortIcon('titular_segundo_celular')}
                </th>
                <th onClick={() => handleSort('nombre_acompanante')} className={sortConfig.key === 'nombre_acompanante' ? 'sort-active' : ''}>
                  Acompañante {getSortIcon('nombre_acompanante')}
                </th>
                {profesionalId === '0' && (
                  <th onClick={() => handleSort('profesional')} className={sortConfig.key === 'profesional' ? 'sort-active' : ''}>
                    Profesional {getSortIcon('profesional')}
                  </th>
                )}
                <th style={{ textAlign: 'center', cursor: 'default' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={profesionalId === '0' ? 6 : 5} className="empty-state">Cargando agenda...</td></tr>
              ) : filteredAndSortedCitas.length === 0 ? (
                <tr>
                  <td colSpan={profesionalId === '0' ? 6 : 5} className="empty-state">
                    <div className="empty-state-icon"><FaCalendarAlt /></div>
                    {searchTerm ? 'No se encontraron resultados para tu búsqueda' : 'No hay citas programadas para este día'}
                  </td>
                </tr>
              ) : (
                filteredAndSortedCitas.map(cita => (
                  <tr key={cita.id}>
                    <td style={{ fontWeight: '600', color: '#2c5f8d' }}>
                      {cita.hora} - {cita.hora_fin || ''}
                    </td>
                    <td>{cita.paciente}</td>
                    <td>{cita.documento}</td>
                    <td>
                      <span className="badge-especialidad">{cita.motivo}</span>
                    </td>
                    <td>{cita.telefono_fijo || '-'}</td>
                    <td>{cita.segundo_telefono_celular || '-'}</td>
                    <td>{cita.titular_segundo_celular || '-'}</td>
                    <td>{cita.nombre_acompanante || '-'}</td>
                    {profesionalId === '0' && (
                      <td>
                        <span className="badge-profesional">
                          <FaUserMd style={{ marginRight: '5px' }} />
                          {cita.profesional}
                        </span>
                      </td>
                    )}
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button 
                          onClick={() => handleModificar(cita)}
                          className="btn-accion-modificar"
                          title="Modificar cita"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button 
                          onClick={() => handleEliminar(cita.id)}
                          className="btn-accion-eliminar"
                          title="Eliminar cita"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ModalAgendarCita 
        open={showModalEdit}
        especialidadId={citaAEditar?.motivo_codigo}
        motivosOptions={motivosOptions}
        duracionBase={20}
        onClose={() => {
          setShowModalEdit(false);
          setCitaAEditar(null);
        }}
        onConfirmar={confirmarModificacion}
        citaEdicion={citaAEditar}
      />
    </div>
  );
}
