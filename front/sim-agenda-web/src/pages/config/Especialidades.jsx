// src/pages/config/Especialidades.jsx

import { useState, useEffect, useMemo } from 'react';
import { FaTags, FaSearch, FaFileExcel } from 'react-icons/fa';
import { apiFetch } from '../../api/client';
import { showToast, showConfirm } from '../../utils/ui';
import { exportToExcel } from '../../utils/excel';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function Especialidades() {
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [especialidadEditando, setEspecialidadEditando] = useState(null);

  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [activo, setActivo] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEspecialidades = useMemo(() => {
    if (!searchTerm) return especialidades;
    const lower = searchTerm.toLowerCase();
    return especialidades.filter(e => 
      e.nombre.toLowerCase().includes(lower) ||
      e.codigo.toLowerCase().includes(lower)
    );
  }, [especialidades, searchTerm]);

  const handleExportExcel = () => {
    if (filteredEspecialidades.length === 0) {
      showToast('No hay datos para exportar', 'error');
      return;
    }

    const dataToExport = filteredEspecialidades.map(e => ({
      'Código': e.codigo,
      'Nombre': e.nombre,
      'Activo': e.activo ? 'Sí' : 'No'
    }));

    exportToExcel(dataToExport, 'Especialidades.xlsx', 'Especialidades');
    showToast('Archivo Excel generado correctamente');
  };

  useEffect(() => {
    cargarEspecialidades();
  }, []);

  async function cargarEspecialidades() {
    setLoading(true);
    try {
      const resp = await apiFetch(`${BACKEND_URL}/especialidades/`);
      setEspecialidades(resp.data || []);
      setError(null);
    } catch (err) {
      setError('Error al cargar especialidades');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const datos = {
      codigo: codigo.toUpperCase(),
      nombre,
      activo
    };

    try {
      if (modoEdicion && especialidadEditando) {
        await apiFetch(`${BACKEND_URL}/especialidades/${especialidadEditando.id}`, {
          method: 'PUT',
          body: JSON.stringify(datos)
        });
        showToast('Especialidad actualizada correctamente');
      } else {
        await apiFetch(`${BACKEND_URL}/especialidades/`, {
          method: 'POST',
          body: JSON.stringify(datos)
        });
        showToast('Especialidad creada correctamente');
      }

      limpiarFormulario();
      cargarEspecialidades();
    } catch (err) {
      console.error('Error al guardar:', err);
      showToast('Error al guardar la especialidad', 'error');
    }
  }

  function handleEditar(especialidad) {
    setModoEdicion(true);
    setEspecialidadEditando(especialidad);
    setCodigo(especialidad.codigo);
    setNombre(especialidad.nombre);
    setActivo(especialidad.activo);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleEliminar(id) {
    const ok = await showConfirm('¿Está seguro de eliminar esta especialidad?');
    if (!ok) return;

    try {
      await apiFetch(`${BACKEND_URL}/especialidades/${id}`, { method: 'DELETE' });
      showToast('Especialidad eliminada correctamente');
      cargarEspecialidades();
    } catch (err) {
      console.error('Error al eliminar:', err);
      showToast('Error al eliminar la especialidad', 'error');
    }
  }

  function limpiarFormulario() {
    setCodigo('');
    setNombre('');
    setActivo(true);
    setModoEdicion(false);
    setEspecialidadEditando(null);
  }

  if (loading) return <div className="cargando">Cargando especialidades...</div>;
  if (error) return <div className="error-mensaje">{error}</div>;

  return (
    <div className="pagina-config">
      <h2>
        <FaTags /> Gestión de Especialidades
      </h2>

      {/* FORMULARIO */}
      <div className="formulario-config">
        <h3>{modoEdicion ? 'Editar Especialidad' : 'Nueva Especialidad'}</h3>
        <form onSubmit={handleSubmit}>
          <label>
            Código (ej: ENDO, ORTO) *
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="ENDO"
              required
              maxLength={20}
            />
          </label>

          <label>
            Nombre *
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Endodoncia"
              required
              maxLength={200}
            />
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
          <h3 style={{ margin: 0 }}>Especialidades Registradas</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Buscar especialidad..."
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
        {filteredEspecialidades.length === 0 ? (
          <p>No se encontraron especialidades</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredEspecialidades.map((especialidad) => (
                <tr key={especialidad.id}>
                  <td>{especialidad.codigo}</td>
                  <td>{especialidad.nombre}</td>
                  <td>
                    {especialidad.activo ? (
                      <span className="badge-activo">Activo</span>
                    ) : (
                      <span className="badge-inactivo">Inactivo</span>
                    )}
                  </td>
                  <td className="acciones">
                    <button className="btn-editar" onClick={() => handleEditar(especialidad)}>
                      Editar
                    </button>
                    <button className="btn-eliminar" onClick={() => handleEliminar(especialidad.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
