// src/pages/config/TiposIdentificacion.jsx

import { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client';
import { showToast, showConfirm } from '../../utils/ui';
import { Card, Input, Button, Badge, Table, TableSkeleton } from '../../components/ui';
import { FaEdit, FaTrash } from 'react-icons/fa';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function TiposIdentificacion() {
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({ id: null, codigo: '', nombre: '', activo: true });
  const [editando, setEditando] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    cargarTipos();
  }, []);

  async function cargarTipos() {
    setLoading(true);
    try {
      const resp = await apiFetch(`${BACKEND_URL}/tiposidentificacion/`);
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
      setGuardando(true);
      if (editando) {
        await apiFetch(`${BACKEND_URL}/tiposidentificacion/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify(form)
        });
        showToast('Tipo de identificación actualizado');
      } else {
        await apiFetch(`${BACKEND_URL}/tiposidentificacion/`, {
          method: 'POST',
          body: JSON.stringify(form)
        });
        showToast('Tipo de identificación creado');
      }
      limpiarForm();
      cargarTipos();
    } catch (err) {
      showToast(err.message, 'error');
      setErrors({ general: err.message });
    } finally {
      setGuardando(false);
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
    setErrors({});
  }

  const columns = [
    { 
      key: 'codigo', 
      label: 'Código',
      render: (val) => <span className="font-semibold text-[var(--color-brand-primary)]">{val}</span>
    },
    { key: 'nombre', label: 'Nombre' },
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
          📋 Gestión de Tipos de Identificación
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Administra los tipos de documento de identificación
        </p>
      </div>

      {/* Form Card */}
      <Card title={editando ? 'Editar Tipo' : 'Nuevo Tipo'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Código"
              name="codigo"
              value={form.codigo}
              onChange={handleChange}
              placeholder="Ej: CC"
              helper="Código único del tipo de identificación"
              error={errors.codigo}
              maxLength={10}
              required
            />

            <Input
              label="Nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ej: Cédula de ciudadanía"
              helper="Nombre descriptivo del tipo"
              error={errors.nombre}
              maxLength={100}
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activo"
              name="activo"
              checked={form.activo}
              onChange={handleChange}
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
              {editando ? 'Actualizar' : 'Guardar'}
            </Button>
            {editando && (
              <Button type="button" variant="ghost" onClick={limpiarForm}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Table Card */}
      <Card title="Tipos Registrados">
        {loading ? (
          <TableSkeleton rows={5} columns={4} />
        ) : (
          <Table
            columns={columns}
            data={tipos}
            emptyMessage="No hay tipos de identificación registrados. Crea el primero usando el formulario superior."
          />
        )}
      </Card>
    </div>
  );
}
