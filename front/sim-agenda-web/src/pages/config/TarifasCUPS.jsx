// src/pages/config/TarifasCUPS.jsx
import { useState, useEffect } from 'react';
import { showToast, showConfirm } from '../../utils/ui';
import { Card, Input, Button, Badge, Table, TableSkeleton } from '../../components/ui';
import { FaEdit, FaTrash, FaMoneyBillWave, FaPlus, FaTimes } from 'react-icons/fa';

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
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Error en la petición');
  }
  return response.json();
}

const INITIAL_FORM = {
  codigo_cups: '',
  descripcion: '',
  valor: '',
  iva_porcentaje: '0',
  activo: true,
};

export default function TarifasCUPS() {
  const [tarifas, setTarifas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [tarifaEditando, setTarifaEditando] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [soloActivas, setSoloActivas] = useState(true);

  useEffect(() => { cargarTarifas(); }, [soloActivas]);

  async function cargarTarifas() {
    try {
      setCargando(true);
      const resp = await apiFetch(`${BACKEND_URL}/tarifas/?solo_activas=${soloActivas}`);
      setTarifas(resp.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCargando(false);
    }
  }

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  function validar() {
    const newErrors = {};
    if (!form.codigo_cups.trim()) newErrors.codigo_cups = 'El código CUPS es obligatorio';
    if (!form.descripcion.trim()) newErrors.descripcion = 'La descripción es obligatoria';
    const valor = parseFloat(form.valor);
    if (isNaN(valor) || valor < 0) newErrors.valor = 'Ingrese un valor válido (≥ 0)';
    const iva = parseFloat(form.iva_porcentaje);
    if (isNaN(iva) || iva < 0 || iva > 100) newErrors.iva_porcentaje = 'El IVA debe estar entre 0 y 100';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validar()) return;

    const data = {
      codigo_cups: form.codigo_cups.trim().toUpperCase(),
      descripcion: form.descripcion.trim(),
      valor: parseFloat(form.valor),
      iva_porcentaje: parseFloat(form.iva_porcentaje),
      activo: form.activo,
    };

    try {
      setGuardando(true);
      if (modoEdicion && tarifaEditando) {
        await apiFetch(`${BACKEND_URL}/tarifas/${tarifaEditando.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        showToast('Tarifa actualizada correctamente');
      } else {
        await apiFetch(`${BACKEND_URL}/tarifas/`, {
          method: 'POST',
          body: JSON.stringify(data),
        });
        showToast('Tarifa creada correctamente');
      }
      limpiarFormulario();
      cargarTarifas();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  }

  function handleEditar(tarifa) {
    setModoEdicion(true);
    setTarifaEditando(tarifa);
    setForm({
      codigo_cups: tarifa.codigo_cups,
      descripcion: tarifa.descripcion,
      valor: String(tarifa.valor),
      iva_porcentaje: String(tarifa.iva_porcentaje),
      activo: tarifa.activo,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleEliminar(id, cups) {
    const confirmado = await showConfirm(`¿Eliminar la tarifa "${cups}"?`);
    if (!confirmado) return;
    try {
      await apiFetch(`${BACKEND_URL}/tarifas/${id}`, { method: 'DELETE' });
      showToast('Tarifa eliminada correctamente');
      cargarTarifas();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function limpiarFormulario() {
    setForm(INITIAL_FORM);
    setModoEdicion(false);
    setTarifaEditando(null);
    setErrors({});
  }

  function formatCOP(value) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
  }

  const columns = [
    {
      key: 'codigo_cups',
      label: 'Código CUPS',
      render: (val) => (
        <span className="font-mono font-bold text-[var(--color-brand-primary)] bg-blue-50 px-2 py-0.5 rounded text-sm">{val}</span>
      ),
    },
    { key: 'descripcion', label: 'Descripción' },
    {
      key: 'valor',
      label: 'Valor',
      render: (val) => (
        <span className="font-semibold text-green-700">{formatCOP(val)}</span>
      ),
    },
    {
      key: 'iva_porcentaje',
      label: 'IVA %',
      render: (val) => <span className="text-slate-500">{val}%</span>,
    },
    {
      key: 'activo',
      label: 'Estado',
      render: (val) => (
        <Badge variant={val ? 'success' : 'neutral'}>{val ? 'Activo' : 'Inactivo'}</Badge>
      ),
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => handleEditar(row)} className="text-[var(--color-brand-primary)]">
            <FaEdit className="mr-1" /> Editar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleEliminar(row.id, row.codigo_cups)} className="text-[var(--color-status-danger)]">
            <FaTrash className="mr-1" /> Eliminar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <FaMoneyBillWave className="text-green-600 text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                Tarifario CUPS
              </h1>
              <p className="text-[var(--color-text-secondary)] mt-0.5 text-sm">
                Gestión de precios por código CUPS para facturación electrónica
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={soloActivas}
              onChange={(e) => setSoloActivas(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 border-gray-300"
            />
            Solo activas
          </label>
        </div>
      </div>

      {/* Form Card */}
      <Card title={modoEdicion ? `Editar Tarifa: ${tarifaEditando?.codigo_cups}` : 'Nueva Tarifa CUPS'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Código CUPS"
              value={form.codigo_cups}
              onChange={(e) => handleChange('codigo_cups', e.target.value)}
              placeholder="Ej: 890203"
              helper="Código único de procedimiento"
              error={errors.codigo_cups}
              required
              disabled={modoEdicion}
            />
            <div className="lg:col-span-2">
              <Input
                label="Descripción"
                value={form.descripcion}
                onChange={(e) => handleChange('descripcion', e.target.value)}
                placeholder="Ej: Consulta primera vez odontología general"
                error={errors.descripcion}
                required
              />
            </div>
            <Input
              label="Valor (COP)"
              type="number"
              value={form.valor}
              onChange={(e) => handleChange('valor', e.target.value)}
              placeholder="50000"
              helper="Precio sin IVA"
              error={errors.valor}
              min="0"
              step="100"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <Input
              label="IVA (%)"
              type="number"
              value={form.iva_porcentaje}
              onChange={(e) => handleChange('iva_porcentaje', e.target.value)}
              placeholder="0"
              helper="Los servicios médicos generalmente son IVA 0%"
              error={errors.iva_porcentaje}
              min="0"
              max="100"
              step="0.1"
            />

            {/* Vista previa del valor total */}
            {form.valor && !isNaN(parseFloat(form.valor)) && (
              <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                <div className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">Vista previa</div>
                <div className="text-lg font-bold text-green-700">
                  {formatCOP(parseFloat(form.valor) * (1 + parseFloat(form.iva_porcentaje || 0) / 100))}
                </div>
                <div className="text-xs text-green-500">Total con IVA</div>
              </div>
            )}

            <div className="flex items-center gap-2 pb-1">
              <input
                type="checkbox"
                id="tarifa_activa"
                checked={form.activo}
                onChange={(e) => handleChange('activo', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="tarifa_activa" className="text-sm font-medium text-slate-600">
                Tarifa activa
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" loading={guardando}>
              <FaPlus className="mr-2" /> {modoEdicion ? 'Actualizar Tarifa' : 'Agregar Tarifa'}
            </Button>
            {modoEdicion && (
              <Button type="button" variant="ghost" onClick={limpiarFormulario}>
                <FaTimes className="mr-1" /> Cancelar
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Table Card */}
      <Card
        title={`Tarifas Registradas ${tarifas.length > 0 ? `(${tarifas.length})` : ''}`}
        className="overflow-visible"
      >
        {cargando ? (
          <TableSkeleton rows={5} columns={6} />
        ) : (
          <Table
            columns={columns}
            data={tarifas}
            emptyMessage="No hay tarifas registradas. Agrega la primera usando el formulario superior."
          />
        )}
      </Card>
    </div>
  );
}
