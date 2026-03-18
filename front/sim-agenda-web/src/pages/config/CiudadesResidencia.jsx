// src/pages/config/CiudadesResidencia.jsx

import { useState, useEffect } from 'react';
import { showToast, showConfirm } from '../../utils/ui';
import { Card, Input, Button, Badge, Table, TableSkeleton } from '../../components/ui';
import { FaEdit, FaTrash } from 'react-icons/fa';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

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
  const [guardando, setGuardando] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [ciudadEditando, setCiudadEditando] = useState(null);

  const [nombre, setNombre] = useState('');
  const [activo, setActivo] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    cargarCiudades();
  }, []);

  async function cargarCiudades() {
    try {
      setCargando(true);
      const resp = await apiFetch(`${BACKEND_URL}/ciudadesresidencia/`);
      setCiudades(resp.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCargando(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});

    const data = { nombre, activo };

    try {
      setGuardando(true);
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
      showToast(err.message, 'error');
      setErrors({ general: err.message });
    } finally {
      setGuardando(false);
    }
  }

  function handleEditar(ciudad) {
    setModoEdicion(true);
    setCiudadEditando(ciudad);
    setNombre(ciudad.nombre);
    setActivo(ciudad.activo);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      showToast(err.message, 'error');
    }
  }

  function limpiarFormulario() {
    setNombre('');
    setActivo(true);
    setModoEdicion(false);
    setCiudadEditando(null);
    setErrors({});
  }

  const columns = [
    { 
      key: 'id', 
      label: 'ID',
      render: (val) => <span className="text-[var(--color-text-tertiary)] text-sm">#{val}</span>
    },
    { 
      key: 'nombre', 
      label: 'Nombre',
      render: (val) => <span className="font-semibold">{val}</span>
    },
    { 
      key: 'activo', 
      label: 'Estado',
      render: (val) => (
        <Badge variant={val ? 'success' : 'neutral'}>
          {val ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => handleEditar(row)}
            className="text-[var(--color-brand-primary)]"
          >
            <FaEdit className="mr-1" /> Editar
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => handleEliminar(row.id)}
            className="text-[var(--color-status-danger)]"
          >
            <FaTrash className="mr-1" /> Eliminar
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-brand-primary)]">
          Gestión de Ciudades de Residencia
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Administra las ciudades disponibles para registro de pacientes
        </p>
      </div>

      {/* Form Card */}
      <Card title={modoEdicion ? 'Editar Ciudad' : 'Nueva Ciudad'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre de la Ciudad"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Bogotá"
            helper="Nombre de la ciudad o municipio"
            error={errors.nombre}
            required
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activo"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="w-4 h-4 text-[var(--color-brand-primary)] border-[var(--color-border-primary)] rounded focus:ring-[var(--color-brand-primary)]"
            />
            <label htmlFor="activo" className="text-sm font-medium text-[var(--color-text-primary)]">
              Activo
            </label>
          </div>

          {errors.general && (
            <div className="p-3 bg-[var(--color-status-danger-bg)] border border-[var(--color-status-danger-border)] rounded-[var(--radius-md)] text-[var(--color-status-danger)] text-sm">
              {errors.general}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="primary" loading={guardando}>
              {modoEdicion ? 'Actualizar' : 'Crear'}
            </Button>
            {modoEdicion && (
              <Button type="button" variant="ghost" onClick={limpiarFormulario}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Table Card */}
      <Card title="Listado de Ciudades">
        {cargando ? (
          <TableSkeleton rows={5} columns={4} />
        ) : (
          <Table
            columns={columns}
            data={ciudades}
            emptyMessage="No hay ciudades registradas. Crea la primera usando el formulario superior."
          />
        )}
      </Card>
    </div>
  );
}
