// src/pages/config/TiposIdentificacion.jsx

import { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client';
import { showToast,showConfirm  } from '../../utils/ui';
import '../../styles/estilos.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function TiposIdentificacion() {
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ id: null, codigo: '', nombre: '', activo: true });
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    cargarTipos();
  }, []);

  async function cargarTipos() {
    setLoading(true);
    try {
      const resp = await apiFetch(`${BACKEND_URL}/tiposidentificacion`);
      setTipos(resp.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.codigo || !form.nombre) {
      showToast('Código y nombre son obligatorios', 'error');
      return;
    }

    try {
      if (editando) {
        await apiFetch(`${BACKEND_URL}/tiposidentificacion/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify(form)
        });
        showToast('Tipo de identificación actualizado');
      } else {
        await apiFetch(`${BACKEND_URL}/tiposidentificacion`, {
          method: 'POST',
          body: JSON.stringify(form)
        });
        showToast('Tipo de identificación creado');
      }
      limpiarForm();
      cargarTipos();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function handleEditar(tipo) {
    setForm(tipo);
    setEditando(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleEliminar(id) {
    const confirmado = await showConfirm('¿Está seguro de eliminar este tipo de identificación?');
    if (!confirmado) return;

    try {
      await apiFetch(`${BACKEND_URL}/tiposidentificacion/${id}`, { method: 'DELETE' });
      showToast('Tipo de identificación eliminado');
      cargarTipos();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function limpiarForm() {
    setForm({ id: null, codigo: '', nombre: '', activo: true });
    setEditando(false);
  }

  if (loading) return <div className="cargando">Cargando tipos de identificación...</div>;

  return (
    <section className="pagina-config">
      <h2>📋 Gestión de Tipos de Identificación</h2>

      {/* FORMULARIO */}
      <div className="formulario-config">
        <h3>{editando ? 'Editar Tipo' : 'Nuevo Tipo'}</h3>
        <form onSubmit={handleSubmit}>
          <label>
            Código (ej: CC, TI)
            <input
              type="text"
              name="codigo"
              value={form.codigo}
              onChange={handleChange}
              maxLength={10}
              required
              placeholder="CC"
            />
          </label>

          <label>
            Nombre
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              maxLength={100}
              required
              placeholder="Cédula de ciudadanía"
            />
          </label>

          <div className="checkbox-label">
            <input
              type="checkbox"
              name="activo"
              checked={form.activo}
              onChange={handleChange}
              id="checkbox-activo"
            />
            <label htmlFor="checkbox-activo" style={{ margin: 0 }}>Activo</label>
          </div>

          <div className="botones-form">
            <button type="submit" className="btn-guardar">
              {editando ? 'Actualizar' : 'Guardar'}
            </button>
            {editando && (
              <button type="button" onClick={limpiarForm} className="btn-cancelar">
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* TABLA */}
      <div className="tabla-config">
        <h3>Tipos Registrados</h3>
        {tipos.length === 0 ? (
          <p>No hay tipos de identificación registrados</p>
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
              {tipos.map((tipo) => (
                <tr key={tipo.id}>
                  <td><strong>{tipo.codigo}</strong></td>
                  <td>{tipo.nombre}</td>
                  <td>
                    {tipo.activo && <span className="badge-activo">Activo</span>}
                    {!tipo.activo && <span className="badge-inactivo">Inactivo</span>}
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
    </section>
  );
}
