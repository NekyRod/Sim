// src/pages/facturacion/Facturas.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast, showConfirm } from '../../utils/ui';
import { Card, Badge, Table, TableSkeleton, Button } from '../../components/ui';
import { FaFileInvoiceDollar, FaBan, FaEye, FaFilter } from 'react-icons/fa';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

async function apiFetch(url, options = {}) {
  const token = sessionStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Error');
  }
  return res.json();
}

function formatCOP(v) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v || 0);
}

const ESTADO_COLORS = {
  pendiente: 'warning',
  enviada: 'info',
  validada: 'success',
  anulada: 'danger',
};

export default function Facturas() {
  const navigate = useNavigate();
  const [facturas, setFacturas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({ estado: '', fecha_desde: '', fecha_hasta: '' });
  const [detalle, setDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    try {
      setCargando(true);
      const params = new URLSearchParams();
      if (filtros.estado) params.set('estado', filtros.estado);
      if (filtros.fecha_desde) params.set('fecha_desde', filtros.fecha_desde);
      if (filtros.fecha_hasta) params.set('fecha_hasta', filtros.fecha_hasta);
      const resp = await apiFetch(`${BACKEND_URL}/facturas/?${params.toString()}`);
      setFacturas(resp.data || []);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setCargando(false);
    }
  }

  async function handleBuscar(e) {
    e.preventDefault();
    cargar();
  }

  async function verDetalle(id) {
    try {
      setLoadingDetalle(true);
      const resp = await apiFetch(`${BACKEND_URL}/facturas/${id}`);
      setDetalle(resp);
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoadingDetalle(false); }
  }

  async function handleAnular(id, numero) {
    const ok = await showConfirm(`¿Anular la factura ${numero}? Esta acción no se puede deshacer.`);
    if (!ok) return;
    try {
      await apiFetch(`${BACKEND_URL}/facturas/${id}/anular`, { method: 'PUT' });
      showToast(`Factura ${numero} anulada`);
      cargar();
      if (detalle?.id === id) setDetalle(null);
    } catch (e) { showToast(e.message, 'error'); }
  }

  const columns = [
    {
      key: 'numero_factura',
      label: 'N° Factura',
      render: (v) => <span className="font-mono font-bold text-indigo-600">{v}</span>
    },
    {
      key: 'fecha_emision',
      label: 'Fecha',
      render: (v) => new Date(v).toLocaleDateString('es-CO')
    },
    { key: 'paciente_nombre', label: 'Paciente' },
    { key: 'profesional_nombre', label: 'Profesional', render: (v) => v || '—' },
    {
      key: 'regimen',
      label: 'Régimen',
      render: (v) => <span className="capitalize text-xs text-slate-500">{v}</span>
    },
    {
      key: 'total',
      label: 'Total',
      render: (v) => <span className="font-bold text-green-700">{formatCOP(v)}</span>
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (v) => <Badge variant={ESTADO_COLORS[v] || 'neutral'}>{v}</Badge>
    },
    {
      key: 'acciones',
      label: '',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => verDetalle(row.id)} className="text-indigo-500">
            <FaEye className="mr-1" /> Ver
          </Button>
          {row.estado !== 'anulada' && (
            <Button size="sm" variant="ghost" onClick={() => handleAnular(row.id, row.numero_factura)} className="text-red-400">
              <FaBan className="mr-1" /> Anular
            </Button>
          )}
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-100 rounded-xl">
          <FaFileInvoiceDollar className="text-indigo-600 text-xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Historial de Facturas</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-0.5">Facturas electrónicas emitidas en el sistema</p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <form onSubmit={handleBuscar} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Estado</label>
            <select
              value={filtros.estado}
              onChange={e => setFiltros(f => ({ ...f, estado: e.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="validada">Validada</option>
              <option value="anulada">Anulada</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Desde</label>
            <input type="date" value={filtros.fecha_desde}
              onChange={e => setFiltros(f => ({ ...f, fecha_desde: e.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Hasta</label>
            <input type="date" value={filtros.fecha_hasta}
              onChange={e => setFiltros(f => ({ ...f, fecha_hasta: e.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <Button type="submit" variant="primary" size="sm">
            <FaFilter className="mr-2" /> Filtrar
          </Button>
        </form>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Tabla */}
        <div className={detalle ? 'xl:col-span-2' : 'xl:col-span-3'}>
          <Card title={`Facturas ${facturas.length > 0 ? `(${facturas.length})` : ''}`}>
            {cargando ? (
              <TableSkeleton rows={6} columns={7} />
            ) : (
              <Table
                columns={columns}
                data={facturas}
                emptyMessage="No se encontraron facturas con los filtros seleccionados."
              />
            )}
          </Card>
        </div>

        {/* Panel de detalle */}
        {detalle && (
          <div className="xl:col-span-1">
            <Card title={`Detalle: ${detalle.numero_factura}`}>
              {loadingDetalle ? (
                <div className="animate-pulse space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-6 bg-gray-100 rounded" />)}
                </div>
              ) : (
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Paciente</span>
                    <span className="font-medium text-right">{detalle.paciente_nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fecha</span>
                    <span>{new Date(detalle.fecha_emision).toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estado</span>
                    <Badge variant={ESTADO_COLORS[detalle.estado]}>{detalle.estado}</Badge>
                  </div>

                  <div className="border-t pt-3">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-2">Servicios</div>
                    {(detalle.items || []).map((item, i) => (
                      <div key={i} className="flex justify-between py-1 border-b border-slate-50 last:border-0">
                        <div>
                          <div className="font-medium text-slate-700 text-xs">{item.descripcion}</div>
                          <div className="text-xs text-slate-400 font-mono">{item.codigo_cups} × {item.cantidad}</div>
                        </div>
                        <span className="font-semibold text-green-700 text-xs">{formatCOP(item.valor_total)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-3 space-y-1">
                    <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatCOP(detalle.subtotal)}</span></div>
                    <div className="flex justify-between text-slate-500"><span>IVA</span><span>{formatCOP(detalle.iva)}</span></div>
                    {parseFloat(detalle.copago) > 0 && (
                      <div className="flex justify-between text-orange-500"><span>Copago</span><span>-{formatCOP(detalle.copago)}</span></div>
                    )}
                    {parseFloat(detalle.cuota_moderadora) > 0 && (
                      <div className="flex justify-between text-orange-500"><span>Cuota Moderadora</span><span>-{formatCOP(detalle.cuota_moderadora)}</span></div>
                    )}
                    <div className="flex justify-between font-bold text-green-700 text-base border-t pt-1">
                      <span>Total</span><span>{formatCOP(detalle.total)}</span>
                    </div>
                  </div>

                  {detalle.estado !== 'anulada' && (
                    <Button variant="danger" size="sm" className="w-full mt-2" onClick={() => handleAnular(detalle.id, detalle.numero_factura)}>
                      <FaBan className="mr-2" /> Anular Factura
                    </Button>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
