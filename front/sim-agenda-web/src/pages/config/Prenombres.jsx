// src/pages/config/Prenombres.jsx

import { useState, useEffect } from 'react';
import { FaIdCard } from 'react-icons/fa';
import { apiFetch } from '../../api/client';
import { showToast, showConfirm } from '../../utils/ui';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function Prenombres() {
  const [prenombres, setPrenombres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [prenombreEditando, setPrenombreEditando] = useState(null);

  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    cargarPrenombres();
  }, []);

  async function cargarPrenombres() {
    setLoading(true);
    try {
      const resp = await apiFetch(`${BACKEND_URL}/prenombres/`);
      setPrenombres(resp.data || []);
      setError(null);
    } catch (err) {
      setError('Error al cargar prenombres');
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
      if (modoEdicion && prenombreEditando) {
        await apiFetch(`${BACKEND_URL}/prenombres/${prenombreEditando.id}`, {
          method: 'PUT',
          body: JSON.stringify(datos)
        });
        showToast('Prenombre actualizado correctamente');
      } else {
        await apiFetch(`${BACKEND_URL}/prenombres/`, {
          method: 'POST',
          body: JSON.stringify(datos)
        });
        showToast('Prenombre creado correctamente');
      }

      limpiarFormulario();
      cargarPrenombres();
    } catch (err) {
      console.error('Error al guardar:', err);
      showToast('Error al guardar el prenombre', 'error');
    }
  }

  function handleEditar(prenombre) {
    setModoEdicion(true);
    setPrenombreEditando(prenombre);
    setCodigo(prenombre.codigo);
    setNombre(prenombre.nombre);
    setActivo(prenombre.activo);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleEliminar(id) {
    const ok = await showConfirm('¿Está seguro de eliminar este prenombre?');
    if (!ok) return;

    try {
      await apiFetch(`${BACKEND_URL}/prenombres/${id}`, { method: 'DELETE' });
      showToast('Prenombre eliminado correctamente');
      cargarPrenombres();
    } catch (err) {
      console.error('Error al eliminar:', err);
      showToast('Error al eliminar el prenombre', 'error');
    }
  }

  function limpiarFormulario() {
    setCodigo('');
    setNombre('');
    setActivo(true);
    setModoEdicion(false);
    setPrenombreEditando(null);
  }

  if (loading) return <div className="cargando">Cargando prenombres...</div>;
  if (error) return <div className="error-mensaje">{error}</div>;

  return (
    <div className="pagina-config">
      <h2>
        <FaIdCard /> Gestión de Prenombres
      </h2>

      {/* FORMULARIO */}
      <div className="formulario-config">
        <h3>{modoEdicion ? 'Editar Prenombre' : 'Nuevo Prenombre'}</h3>
        <form onSubmit={handleSubmit}>
          <label>
            Código (ej: DRA, DR, OD) *
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="DRA"
              required
              maxLength={10}
            />
          </label>

          <label>
            Nombre *
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Dra."
              required
              maxLength={100}
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
        <h3>Prenombres Registrados</h3>
        {prenombres.length === 0 ? (
          <p>No hay prenombres registrados</p>
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
              {prenombres.map((prenombre) => (
                <tr key={prenombre.id}>
                  <td>{prenombre.codigo}</td>
                  <td>{prenombre.nombre}</td>
                  <td>
                    {prenombre.activo ? (
                      <span className="badge-activo">Activo</span>
                    ) : (
                      <span className="badge-inactivo">Inactivo</span>
                    )}
                  </td>
                  <td className="acciones">
                    <button className="btn-editar" onClick={() => handleEditar(prenombre)}>
                      Editar
                    </button>
                    <button className="btn-eliminar" onClick={() => handleEliminar(prenombre.id)}>
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
