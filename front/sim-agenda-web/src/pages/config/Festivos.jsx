// src/pages/config/Festivos.jsx

import { useState, useEffect } from 'react';
import { FaCalendarPlus, FaTrash } from 'react-icons/fa';
import { apiFetch } from '../../api/client';
import { showToast, showConfirm } from '../../utils/ui';
import { Card, Input, Button, Table, TableSkeleton } from '../../components/ui';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function Festivos() {
  const [festivos, setFestivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [fecha, setFecha] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    cargarFestivos();
  }, []);

  async function cargarFestivos() {
    setLoading(true);
    try {
      const resp = await apiFetch(`${BACKEND_URL}/festivos/`);
      setFestivos(resp.data || []);
    } catch (err) {
      showToast('Error al cargar festivos', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});

    const datos = {
      fecha,
      descripcion
    };

    try {
      setGuardando(true);
      await apiFetch(`${BACKEND_URL}/festivos/`, {
        method: 'POST',
        body: JSON.stringify(datos)
      });
      showToast('Festivo creado correctamente');
      limpiarFormulario();
      cargarFestivos();
    } catch (err) {
      showToast('Error al guardar el festivo', 'error');
      setErrors({ general: err.message });
    } finally {
      setGuardando(false);
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
      showToast('Error al eliminar el festivo', 'error');
    }
  }

  function limpiarFormulario() {
    setFecha('');
    setDescripcion('');
    setErrors({});
  }

  const columns = [
    { 
      key: 'fecha', 
      label: 'Fecha',
      render: (val) => {
        const date = new Date(val + 'T00:00:00');
        return (
          <span className="font-semibold text-[var(--color-brand-primary)]">
            {date.toLocaleDateString('es-CO', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        );
      }
    },
    { 
      key: 'descripcion', 
      label: 'Descripción',
      render: (val) => val || <span className="text-[var(--color-text-muted)] italic">Sin descripción</span>
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_, row) => (
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => handleEliminar(row.id)}
          className="text-[var(--color-status-danger)]"
        >
          <FaTrash className="mr-1" /> Eliminar
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-brand-primary)] flex items-center gap-2">
          <FaCalendarPlus /> Gestión de Festivos
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Administra los días festivos para el sistema de agendamiento
        </p>
      </div>

      {/* Form Card */}
      <Card title="Nuevo Festivo">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              helper="Selecciona la fecha del festivo"
              error={errors.fecha}
              required
            />

            <Input
              label="Descripción"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Año Nuevo"
              helper="Descripción opcional del festivo"
              error={errors.descripcion}
              maxLength={255}
            />
          </div>

          {errors.general && (
            <div className="p-3 bg-[var(--color-status-danger-bg)] border border-[var(--color-status-danger-border)] rounded-[var(--radius-md)] text-[var(--color-status-danger)] text-sm">
              {errors.general}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="primary" loading={guardando}>
              Guardar
            </Button>
          </div>
        </form>
      </Card>

      {/* Table Card */}
      <Card title="Festivos Registrados">
        {loading ? (
          <TableSkeleton rows={5} columns={3} />
        ) : (
          <Table
            columns={columns}
            data={festivos}
            emptyMessage="No hay festivos registrados. Agrega el primero usando el formulario superior."
          />
        )}
      </Card>
    </div>
  );
}
