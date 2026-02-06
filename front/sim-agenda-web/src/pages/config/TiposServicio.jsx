// src/pages/config/TiposServicio.jsx

import { useState, useEffect } from 'react';
import '../../styles/estilos.css';
import { showToast, showConfirm } from '../../utils/ui';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

async function apiFetch(url, options = {}) {
  const token = sessionStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error en la petición');
  }
  return response.json();
}

export default function TiposServicio() {
  const [tipos, setTipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [tipoEditando, setTipoEditando] = useState(null);

  // Estados del formulario
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    cargarTipos();
  }, []);

  async function cargarTipos() {
    try {
      setCargando(true);
      const resp = await apiFetch(`${BACKEND_URL}/tiposservicio/`);
      setTipos(resp.data || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const data = { codigo, nombre, activo };

    try {
      if (modoEdicion && tipoEditando) {
        await apiFetch(`${BACKEND_URL}/tiposservicio/${tipoEditando.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        showToast('Tipo de servicio actualizado correctamente');
      } else {
        await apiFetch(`${BACKEND_URL}/tiposservicio/`, {
          method: 'POST',
          body: JSON.stringify(data),
        });
        showToast('Tipo de servicio creado correctamente');
      }
      limpiarFormulario();
      cargarTipos();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEditar(tipo) {
    setModoEdicion(true);
    setTipoEditando(tipo);
    setCodigo(tipo.codigo);
    setNombre(tipo.nombre);
    setActivo(tipo.activo);
  }

  async function handleEliminar(id) {
    const confirmado = await showConfirm('¿Está seguro de eliminar este tipo de servicio?');
    if (!confirmado) return;

    try {
      await apiFetch(`${BACKEND_URL}/tiposservicio/${id}`, {
        method: 'DELETE',
      });
      showToast('Tipo de servicio eliminado correctamente');
      cargarTipos();
    } catch (err) {
      setError(err.message);
    }
  }

  function limpiarFormulario() {
    setCodigo('');
    setNombre('');
    setActivo(true);
    setModoEdicion(false);
    setTipoEditando(null);
  }

  if (cargando) return <div className="cargando">Cargando tipos de servicio...</div>;

  return (
    <section className="pagina-config">
      <h2>Gestión de Tipos de Servicio</h2>

      {error && <div className="error-mensaje">{error}</div>}

      <div className="contenedor-config">
        {/* FORMULARIO */}
        <div className="formulario-config">
          <h3>{modoEdicion ? 'Editar Tipo de Servicio' : 'Nuevo Tipo de Servicio'}</h3>
          <form onSubmit={handleSubmit}>
            <label>
              Código *
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="Ej: PBS"
                required
                disabled={modoEdicion}
              />
            </label>

            <label>
              Nombre *
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Plan de Beneficios en Salud"
                required
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

            <div className="botones-form">
              <button type="submit" className="btn-primary">
                {modoEdicion ? 'Actualizar' : 'Crear'}
              </button>
              {modoEdicion && (
                <button type="button" className="btn-secondary" onClick={limpiarFormulario}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* TABLA */}
        <div className="tabla-config">
          <h3>Listado de Tipos de Servicio</h3>
          {tipos.length === 0 ? (
            <p>No hay tipos de servicio registrados</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tipos.map((tipo) => (
                  <tr key={tipo.id}>
                    <td>{tipo.id}</td>
                    <td><strong>{tipo.codigo}</strong></td>
                    <td>{tipo.nombre}</td>
                    <td>
                      <span className={tipo.activo ? 'badge-activo' : 'badge-inactivo'}>
                        {tipo.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="acciones">
                        <button className="btn-editar" onClick={() => handleEditar(tipo)}>
                          Editar
                        </button>
                        <button className="btn-eliminar" onClick={() => handleEliminar(tipo.id)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
