
// src/pages/config/Festivos.jsx

import { useState, useEffect } from 'react';
import { FaCalendarPlus } from 'react-icons/fa';
import { apiFetch } from '../../api/client';
import { showToast } from '../../utils/ui';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function Festivos() {
  const [festivos, setFestivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [fecha, setFecha] = useState('');
  const [descripcion, setDescripcion] = useState('');

  useEffect(() => {
    cargarFestivos();
  }, []);

  async function cargarFestivos() {
    setLoading(true);
    try {
      const resp = await apiFetch(`${BACKEND_URL}/festivos/`);
      setFestivos(resp.data || []);
      setError(null);
    } catch (err) {
      setError('Error al cargar festivos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const datos = {
      fecha,
      descripcion
    };

    try {
      await apiFetch(`${BACKEND_URL}/festivos/`, {
        method: 'POST',
        body: JSON.stringify(datos)
      });
      showToast('Festivo creado correctamente');
      limpiarFormulario();
      cargarFestivos();
    } catch (err) {
      console.error('Error al guardar:', err);
      showToast('Error al guardar el festivo', 'error');
    }
  }

  async function handleEliminar(id) {
    const ok = await showConfirm('¿Está seguro de eliminar este festivo?');
    if (!ok) return;

    try {
      await apiFetch(`${BACKEND_URL}/festivos/${id}`, { method: 'DELETE' });
      showToast('Festivo eliminado correctamente');
      cargarFestivos();
    } catch (err) {
      console.error('Error al eliminar:', err);
      showToast('Error al eliminar el festivo', 'error');
    }
  }

  function limpiarFormulario() {
    setFecha('');
    setDescripcion('');
  }

  if (loading) return <div className="cargando">Cargando festivos...</div>;
  if (error) return <div className="error-mensaje">{error}</div>;

  return (
    <div className="pagina-config">
      <h2>
        <FaCalendarPlus /> Gestión de Festivos
      </h2>

      {/* FORMULARIO */}
      <div className="formulario-config">
        <h3>Nuevo Festivo</h3>
        <form onSubmit={handleSubmit}>
          <label>
            Fecha *
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </label>

          <label>
            Descripción
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Año Nuevo"
              maxLength={255}
            />
          </label>

          <button type="submit" className="btn-guardar">
            Guardar
          </button>
        </form>
      </div>

      {/* TABLA */}
      <div className="tabla-config">
        <h3>Festivos Registrados</h3>
        {festivos.length === 0 ? (
          <p>No hay festivos registrados</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {festivos.map((festivo) => (
                <tr key={festivo.id}>
                  <td>{festivo.fecha}</td>
                  <td>{festivo.descripcion}</td>
                  <td className="acciones">
                    <button className="btn-eliminar" onClick={() => handleEliminar(festivo.id)}>
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
