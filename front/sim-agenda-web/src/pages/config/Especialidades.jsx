// src/pages/config/Especialidades.jsx

import { useState, useEffect, useMemo } from 'react';
import { FaSearch, FaFileExcel, FaEdit, FaTrash } from 'react-icons/fa';
import { apiFetch } from '../../api/client';
import { showToast, showConfirm } from '../../utils/ui';
import { exportToExcel } from '../../utils/excel';
import { Card, Input, Button, Badge, Table, TableSkeleton } from '../../components/ui';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function Especialidades() {
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [especialidadEditando, setEspecialidadEditando] = useState(null);

  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [activo, setActivo] = useState(true);
  const [esAutogestion, setEsAutogestion] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState({});

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
      'Activo': e.activo ? 'Sí' : 'No',
      'Autogestión': e.es_autogestion ? 'Sí' : 'No'
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
    } catch (err) {
      showToast('Error al cargar especialidades', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});

    const datos = {
      codigo: codigo.toUpperCase(),
      nombre,
      activo,
      es_autogestion: esAutogestion
    };

    try {
      setGuardando(true);
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
      showToast('Error al guardar la especialidad', 'error');
      setErrors({ general: err.message });
    } finally {
      setGuardando(false);
    }
  }

  function handleEditar(especialidad) {
    setModoEdicion(true);
    setEspecialidadEditando(especialidad);
    setCodigo(especialidad.codigo);
    setNombre(especialidad.nombre);
    setActivo(especialidad.activo);
    setEsAutogestion(especialidad.es_autogestion || false);
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
      showToast('Error al eliminar la especialidad', 'error');
    }
  }

  function limpiarFormulario() {
    setCodigo('');
    setNombre('');
    setActivo(true);
    setEsAutogestion(false);
    setModoEdicion(false);
    setEspecialidadEditando(null);
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
      key: 'es_autogestion', 
      label: 'Autogestión',
      render: (val) => (
        <Badge variant={val ? 'info' : 'neutral'}>
          {val ? 'Habilitada' : 'No'}
        </Badge>
      )
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
          Gestión de Especialidades
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Administra las especialidades odontológicas del sistema
        </p>
      </div>

      {/* Form Card */}
      <Card title={modoEdicion ? 'Editar Especialidad' : 'Nueva Especialidad'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Código"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ej: ENDO"
              helper="Código único de la especialidad"
              error={errors.codigo}
              maxLength={20}
              required
            />

            <Input
              label="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Endodoncia"
              helper="Nombre descriptivo de la especialidad"
              error={errors.nombre}
              maxLength={200}
              required
            />
          </div>

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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="es_autogestion"
              checked={esAutogestion}
              onChange={(e) => setEsAutogestion(e.target.checked)}
              className="w-4 h-4 text-[var(--color-brand-primary)] border-[var(--color-border-primary)] rounded focus:ring-[var(--color-brand-primary)]"
            />
            <label htmlFor="es_autogestion" className="text-sm font-medium text-[var(--color-text-primary)]">
              Permitir Autogestión en Chatbot
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
      <Card 
        title="Listado de Especialidades"
        header={
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Listado de Especialidades
            </h3>
            <div className="flex gap-3">
              <div className="relative">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar especialidad..."
                  className="w-64"
                />
                <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              </div>
              <Button variant="secondary" onClick={handleExportExcel}>
                <FaFileExcel className="mr-2" /> Exportar
              </Button>
            </div>
          </div>
        }
      >
        {loading ? (
          <TableSkeleton rows={5} columns={4} />
        ) : (
          <Table
            columns={columns}
            data={filteredEspecialidades}
            emptyMessage="No se encontraron especialidades. Crea la primera usando el formulario superior."
          />
        )}
      </Card>
    </div>
  );
}
