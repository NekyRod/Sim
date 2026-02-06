// src/pages/config/Profesionales.jsx

import { useState, useEffect, useMemo } from 'react';
import { FaUserMd, FaSearch, FaFileExcel } from 'react-icons/fa';
import { apiFetch } from '../../api/client';
import { showToast, showConfirm } from '../../utils/ui';
import { exportToExcel } from '../../utils/excel';
import ModalEspecialidades from '../../components/ModalEspecialidades';

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

  const handleExportExcel = () => {
    if (filteredProfesionales.length === 0) {
      showToast('No hay datos para exportar', 'error');
      return;
    }

    const dataToExport = filteredProfesionales.map(p => ({
      'Nombre Completo': p.nombre_completo,
      'Tipo ID': p.tipo_identificacion,
      'Número ID': p.numero_identificacion,
      'NIT': p.nit || '',
      'Correo': p.correo || '',
      'Celular': p.celular || '',
      'Teléfono': p.telefono || '',
      'Especialidad': p.especialidad || 'N/A',
      'Ciudad': p.ciudad || '',
      'Departamento': p.departamento || '',
      'Dirección': p.direccion || '',
      'Estado Cuenta': p.estado_cuenta,
      'Activo': p.activo ? 'Sí' : 'No'
    }));

    exportToExcel(dataToExport, 'Profesionales.xlsx', 'Profesionales');
    showToast('Archivo Excel generado correctamente');
  };

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

    // Generar nombre_completo
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
    const ok = await showConfirm('¿Está seguro de eliminar este profesional?');
    if (!ok) return;

    try {
      await apiFetch(`${BACKEND_URL}/profesionales/${id}`, { method: 'DELETE' });
      showToast('Profesional eliminado correctamente');
      cargarDatosIniciales();
    } catch (err) {
      console.error('Error al eliminar:', err);
      showToast('Error al eliminar el profesional', 'error');
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


  if (loading) return <div className="cargando">Cargando profesionales...</div>;
  if (error) return <div className="error-mensaje">{error}</div>;

  return (
    <div className="pagina-config">
      <h2>
        <FaUserMd /> Gestión de Profesionales
      </h2>

      {/* FORMULARIO */}
      <div className="formulario-config">
        <h3>{modoEdicion ? 'Editar Profesional' : 'Nuevo Profesional'}</h3>
        <form onSubmit={handleSubmit}>
          <label>
            Nombre *
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="ADRIANA YORMARY"
              required
            />
          </label>

          <label>
            Apellidos *
            <input
              type="text"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              placeholder="GARCIA PARRA"
              required
            />
          </label>

          <label>
            Prenombre
            <select value={prenombreId} onChange={(e) => setPrenombreId(e.target.value)}>
              <option value="">Seleccione uno</option>
              {prenombres.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </label>

          <label>
            Tipo de Identificación *
            <select
              value={tipoIdentificacion}
              onChange={(e) => setTipoIdentificacion(e.target.value)}
              required
            >
              <option value="">Seleccione uno</option>
              {tiposIdentificacion.map(t => (
                <option key={t.id} value={t.codigo}>{t.nombre}</option>
              ))}
            </select>
          </label>

          <label>
            # Número de Identificación *
            <input
              type="text"
              value={numeroIdentificacion}
              onChange={(e) => setNumeroIdentificacion(e.target.value)}
              placeholder="52527794"
              required
            />
          </label>

          <label>
            NIT
            <input
              type="text"
              value={nit}
              onChange={(e) => setNit(e.target.value)}
              placeholder="901517751"
            />
          </label>

          <label>
            Correo
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </label>

          <label>
            Celular
            <input
              type="text"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              placeholder="3212037599"
            />
          </label>

          <label>
            Teléfono
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="3008152984"
            />
          </label>

          <label>
            Ciudad
            <input
              type="text"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              placeholder="BOGOTA"
            />
          </label>

          <label>
            Departamento
            <input
              type="text"
              value={departamento}
              onChange={(e) => setDepartamento(e.target.value)}
              placeholder="BOGOTA DC"
            />
          </label>

          <label>
            Dirección
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="CR 54 No 152a-85"
            />
          </label>

          <label>
            Especialidad
            <select value={especialidadId} onChange={(e) => setEspecialidadId(e.target.value)}>
              <option value="">Seleccione uno</option>
              {especialidades.map(e => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </label>

          <label>
            Especialidades secundarias
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                type="button"
                className="btn-principal"
                onClick={() => setShowModalEspecialidades(true)}
              >
                Editar Especialidades Secundarias ({especialidadesSecundarias.length})
              </button>
              {especialidadesSecundarias.length > 0 && (
                <small style={{ color: '#666' }}>
                  {especialidadesSecundarias.map(e => e.nombre).join(', ')}
                </small>
              )}
            </div>
          </label>

          <label>
            Estado de la cuenta
            <select value={estadoCuenta} onChange={(e) => setEstadoCuenta(e.target.value)}>
              <option value="Habilitada">Habilitada</option>
              <option value="Deshabilitada">Deshabilitada</option>
              <option value="Suspendida">Suspendida</option>
            </select>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
            />
            Activo
          </label>

          {modoEdicion ? (
            <div className="botones-form">
              <button type="submit" className="btn-guardar">
                Actualizar
              </button>
              <button type="button" className="btn-cancelar" onClick={limpiarFormulario}>
                Cancelar
              </button>
            </div>
          ) : (
            <button type="submit" className="btn-guardar">
              Guardar
            </button>
          )}
        </form>
      </div>

      {/* TABLA */}
      <div className="tabla-config">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>Profesionales Registrados</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Buscar profesional..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '8px 35px 8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  width: '250px'
                }}
              />
              <FaSearch style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            </div>
            <button
              onClick={handleExportExcel}
              className="btn-excel"
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
                fontWeight: '600'
              }}
            >
              <FaFileExcel /> Exportar
            </button>
          </div>
        </div>
        {filteredProfesionales.length === 0 ? (
          <p>No se encontraron profesionales</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>Tipo ID</th>
                <th>Número ID</th>
                <th>Especialidad</th>
                <th>Celular</th>
                <th>Estado</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProfesionales.map((prof) => (
                <tr key={prof.id}>
                  <td>{prof.nombre_completo}</td>
                  <td>{prof.tipo_identificacion}</td>
                  <td>{prof.numero_identificacion}</td>
                  <td>{prof.especialidad || 'N/A'}</td>
                  <td>{prof.celular || 'N/A'}</td>
                  <td>{prof.estado_cuenta}</td>
                  <td>
                    {prof.activo ? (
                      <span className="badge-activo">Activo</span>
                    ) : (
                      <span className="badge-inactivo">Inactivo</span>
                    )}
                  </td>
                  <td className="acciones">
                    <button className="btn-editar" onClick={() => handleEditar(prof)}>
                      Editar
                    </button>
                    <button className="btn-eliminar" onClick={() => handleEliminar(prof.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL ESPECIALIDADES SECUNDARIAS */}
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
