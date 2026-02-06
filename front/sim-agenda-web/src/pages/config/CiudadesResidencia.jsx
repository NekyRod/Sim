// src/pages/config/CiudadesResidencia.jsx

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

export default function CiudadesResidencia() {
  const [ciudades, setCiudades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [ciudadEditando, setCiudadEditando] = useState(null);

  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    cargarCiudades();
  }, []);

  async function cargarCiudades() {
    try {
      setCargando(true);
      const resp = await apiFetch(`${BACKEND_URL}/ciudadesresidencia/`);
      setCiudades(resp.data || []);
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

    const data = { nombre, activo };

    try {
      if (modoEdicion && ciudadEditando) {
        await apiFetch(`${BACKEND_URL}/ciudadesresidencia/${ciudadEditando.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        showToast('Ciudad actualizada correctamente');
      } else {
        await apiFetch(`${BACKEND_URL}/ciudadesresidencia/`, {
          method: 'POST',
          body: JSON.stringify(data),
        });
        showToast('Ciudad creada correctamente');
      }
      limpiarFormulario();
      cargarCiudades();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEditar(ciudad) {
    setModoEdicion(true);
    setCiudadEditando(ciudad);
    setNombre(ciudad.nombre);
    setActivo(ciudad.activo);
  }

  async function handleEliminar(id) {
    const confirmado = await showConfirm('¿Está seguro de eliminar esta ciudad?');
    if (!confirmado) return;

    try {
      await apiFetch(`${BACKEND_URL}/ciudadesresidencia/${id}`, {
        method: 'DELETE',
      });
      showToast('Ciudad eliminada correctamente');
      cargarCiudades();
    } catch (err) {
      setError(err.message);
    }
  }

  function limpiarFormulario() {
    setNombre('');
    setActivo(true);
    setModoEdicion(false);
    setCiudadEditando(null);
  }

  if (cargando) return <div className="cargando">Cargando ciudades...</div>;

  return (
    <section className="pagina-config">
      <h2>Gestión de Ciudades de Residencia</h2>

      {error && <div className="error-mensaje">{error}</div>}

      <div className="contenedor-config">
        {/* FORMULARIO */}
        <div className="formulario-config">
          <h3>{modoEdicion ? 'Editar Ciudad' : 'Nueva Ciudad'}</h3>
          <form onSubmit={handleSubmit}>
            <label>
              Nombre de la Ciudad *
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Bogotá"
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
          <h3>Listado de Ciudades</h3>
          {ciudades.length === 0 ? (
            <p>No hay ciudades registradas</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ciudades.map((ciudad) => (
                  <tr key={ciudad.id}>
                    <td>{ciudad.id}</td>
                    <td>{ciudad.nombre}</td>
                    <td>
                      <span className={ciudad.activo ? 'badge-activo' : 'badge-inactivo'}>
                        {ciudad.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="acciones">
                        <button className="btn-editar" onClick={() => handleEditar(ciudad)}>
                          Editar
                        </button>
                        <button className="btn-eliminar" onClick={() => handleEliminar(ciudad.id)}>
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
