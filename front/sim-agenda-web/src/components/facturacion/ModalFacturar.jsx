// src/components/facturacion/ModalFacturar.jsx
import { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaTrash, FaFileInvoiceDollar, FaSpinner } from 'react-icons/fa';
import { showToast } from '../../utils/ui';

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
    throw new Error(err.detail || 'Error en la petición');
  }
  return res.json();
}

function formatCOP(v) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v || 0);
}

const REGIMEN_OPTIONS = [
  { value: 'particular', label: 'Particular' },
  { value: 'contributivo', label: 'Contributivo (EPS)' },
  { value: 'subsidiado', label: 'Subsidiado (SISBEN)' },
];

export default function ModalFacturar({ paciente, profesionalId, citaId, onClose, onFacturaCreada }) {
  const [tarifas, setTarifas] = useState([]);
  const [loadingTarifas, setLoadingTarifas] = useState(true);
  const [items, setItems] = useState([]);
  const [regimen, setRegimen] = useState('particular');
  const [copago, setCopago] = useState('');
  const [cuotaMoeradora, setCuotaMoeradora] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [tarifaSeleccionada, setTarifaSeleccionada] = useState('');

  useEffect(() => {
    async function cargar() {
      try {
        const resp = await apiFetch(`${BACKEND_URL}/tarifas/?solo_activas=true`);
        setTarifas(resp.data || []);
      } catch (e) {
        showToast('Error cargando tarifas', 'error');
      } finally {
        setLoadingTarifas(false);
      }
    }
    cargar();
  }, []);

  function agregarServicio() {
    if (!tarifaSeleccionada) return;
    const tarifa = tarifas.find(t => String(t.id) === String(tarifaSeleccionada));
    if (!tarifa) return;
    // Si ya existe, incrementar cantidad
    const existe = items.findIndex(i => i.codigo_cups === tarifa.codigo_cups);
    if (existe >= 0) {
      const copia = [...items];
      copia[existe] = { ...copia[existe], cantidad: copia[existe].cantidad + 1 };
      setItems(copia);
    } else {
      setItems(prev => [...prev, {
        codigo_cups: tarifa.codigo_cups,
        descripcion: tarifa.descripcion,
        cantidad: 1,
        valor_unitario: tarifa.valor,
        iva_porcentaje: tarifa.iva_porcentaje,
      }]);
    }
    setTarifaSeleccionada('');
  }

  function actualizarCantidad(idx, nueva) {
    const n = parseInt(nueva, 10);
    if (isNaN(n) || n < 1) return;
    const copia = [...items];
    copia[idx] = { ...copia[idx], cantidad: n };
    setItems(copia);
  }

  function quitarItem(idx) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  // Cálculos en tiempo real
  const subtotal = items.reduce((acc, i) => acc + i.cantidad * i.valor_unitario, 0);
  const ivaTotal = items.reduce((acc, i) => acc + i.cantidad * i.valor_unitario * (i.iva_porcentaje / 100), 0);
  const total = subtotal + ivaTotal;
  const totalCopago = parseFloat(copago || 0) + parseFloat(cuotaMoeradora || 0);
  const totalAPagar = Math.max(0, total - totalCopago);

  async function handleEmitir(e) {
    e.preventDefault();
    if (items.length === 0) {
      showToast('Agrega al menos un servicio', 'error');
      return;
    }
    try {
      setGuardando(true);
      const payload = {
        paciente_id: paciente.id,
        profesional_id: profesionalId || null,
        cita_id: citaId || null,
        regimen,
        copago: parseFloat(copago || 0),
        cuota_moderadora: parseFloat(cuotaMoeradora || 0),
        observaciones: observaciones || null,
        items,
      };
      const resp = await apiFetch(`${BACKEND_URL}/facturas/`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      showToast(`Factura ${resp.numero_factura} emitida correctamente`);
      onFacturaCreada && onFacturaCreada(resp);
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <FaFileInvoiceDollar className="text-green-600 text-lg" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Nueva Factura</h2>
              <p className="text-xs text-gray-500">{paciente?.nombre_completo}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Agregar servicio */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Agregar Servicio CUPS</label>
            <div className="flex gap-2">
              <select
                value={tarifaSeleccionada}
                onChange={e => setTarifaSeleccionada(e.target.value)}
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none"
                disabled={loadingTarifas}
              >
                <option value="">{loadingTarifas ? 'Cargando...' : '— Seleccionar servicio —'}</option>
                {tarifas.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.codigo_cups} — {t.descripcion} ({formatCOP(t.valor)})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={agregarServicio}
                disabled={!tarifaSeleccionada}
                className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FaPlus /> Agregar
              </button>
            </div>
          </div>

          {/* Tabla de ítems */}
          {items.length > 0 ? (
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-400 font-semibold">
                  <tr>
                    <th className="px-4 py-2 text-left">Servicio</th>
                    <th className="px-3 py-2 text-center w-20">Cant.</th>
                    <th className="px-3 py-2 text-right">Valor</th>
                    <th className="px-3 py-2 text-right">Total</th>
                    <th className="px-2 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item, idx) => {
                    const lineTotal = item.cantidad * item.valor_unitario * (1 + (item.iva_porcentaje || 0) / 100);
                    return (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-gray-700 text-xs">{item.descripcion}</div>
                          <div className="text-xs text-gray-400 font-mono">{item.codigo_cups}</div>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={e => actualizarCantidad(idx, e.target.value)}
                            className="w-14 text-center border border-gray-200 rounded-lg px-1 py-1 text-sm focus:ring-2 focus:ring-green-100 focus:border-green-400 outline-none"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-600 text-xs">{formatCOP(item.valor_unitario)}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-green-700 text-xs">{formatCOP(lineTotal)}</td>
                        <td className="px-2 py-2.5 text-center">
                          <button onClick={() => quitarItem(idx)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                            <FaTrash className="text-xs" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl text-gray-400">
              <FaFileInvoiceDollar className="text-3xl mx-auto mb-2 opacity-30" />
              <p className="text-sm">Selecciona los servicios prestados</p>
            </div>
          )}

          {/* Régimen y copagos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Régimen</label>
              <select
                value={regimen}
                onChange={e => setRegimen(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none"
              >
                {REGIMEN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Copago EPS</label>
              <input
                type="number" min="0"
                value={copago}
                onChange={e => setCopago(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Cuota Moderadora</label>
              <input
                type="number" min="0"
                value={cuotaMoeradora}
                onChange={e => setCuotaMoeradora(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Observaciones</label>
            <textarea
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              rows={2}
              placeholder="Observaciones opcionales..."
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 resize-none"
            />
          </div>
        </div>

        {/* Footer con totales */}
        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/50">
          {items.length > 0 && (
            <div className="flex justify-between text-sm mb-3 gap-6">
              <div className="space-y-1 flex-1">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span><span>{formatCOP(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>IVA</span><span>{formatCOP(ivaTotal)}</span>
                </div>
                {totalCopago > 0 && (
                  <div className="flex justify-between text-orange-500">
                    <span>Copago/Moeradora</span><span>-{formatCOP(totalCopago)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-green-700 text-base border-t border-gray-200 pt-1 mt-1">
                  <span>Total a Pagar</span><span>{formatCOP(totalAPagar)}</span>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleEmitir}
              disabled={guardando || items.length === 0}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardando ? <FaSpinner className="animate-spin" /> : <FaFileInvoiceDollar />}
              {guardando ? 'Emitiendo...' : 'Emitir Factura'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
