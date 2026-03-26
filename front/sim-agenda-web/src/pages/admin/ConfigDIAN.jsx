// src/pages/admin/ConfigDIAN.jsx
import { useState, useEffect } from 'react';
import { showToast } from '../../utils/ui';
import { Card, Input, Button } from '../../components/ui';
import { FaFileInvoiceDollar, FaBuilding, FaIdCard, FaCog, FaServer, FaShieldAlt, FaSave, FaInfoCircle } from 'react-icons/fa';

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

const CONFIG_SECTIONS = [
  {
    id: 'prestador',
    title: 'Datos del Prestador',
    icon: FaBuilding,
    color: 'blue',
    fields: [
      { key: 'nit_prestador', label: 'NIT del Prestador', placeholder: '900.123.456-7', helper: 'NIT sin dígito de verificación o con él según la DIAN' },
      { key: 'razon_social', label: 'Razón Social', placeholder: 'Centro Odontológico Ejemplo S.A.S.' },
      { key: 'cod_prestador', label: 'Código REPS del Prestador', placeholder: 'CODREPS123', helper: 'Código del prestador asignado por el Ministerio de Salud' },
    ],
  },
  {
    id: 'numeracion',
    title: 'Numeración DIAN',
    icon: FaFileInvoiceDollar,
    color: 'green',
    fields: [
      { key: 'prefijo_factura', label: 'Prefijo de Facturación', placeholder: 'FE', helper: 'Prefijo autorizado por la DIAN (ej: FE, SETT, etc.)' },
      { key: 'consecutivo_actual', label: 'Consecutivo Actual', placeholder: '0', helper: 'El sistema lo incrementará automáticamente', type: 'number' },
      { key: 'resolucion_dian', label: 'N° Resolución DIAN', placeholder: '18764000001234', helper: 'Número de resolución de autorización de numeración' },
      { key: 'fecha_resolucion', label: 'Fecha Resolución', placeholder: '2024-01-15', helper: 'Fecha de expedición de la resolución (YYYY-MM-DD)', type: 'date' },
      { key: 'rango_desde', label: 'Rango Desde', placeholder: '1', type: 'number' },
      { key: 'rango_hasta', label: 'Rango Hasta', placeholder: '5000000', type: 'number' },
    ],
  },
  {
    id: 'tributario',
    title: 'Configuración Tributaria',
    icon: FaIdCard,
    color: 'purple',
    fields: [
      {
        key: 'regimen_tributario',
        label: 'Régimen Tributario',
        type: 'select',
        options: [
          { value: 'responsable_iva', label: 'Responsable de IVA (Régimen ordinario)' },
          { value: 'simplificado', label: 'Régimen simplificado' },
        ],
      },
    ],
  },
  {
    id: 'tecnico',
    title: 'Configuración Técnica DIAN',
    icon: FaServer,
    color: 'orange',
    fields: [
      { key: 'software_id_dian', label: 'Software ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', helper: 'ID del software asignado durante el proceso de habilitación DIAN' },
      { key: 'pin_dian', label: 'PIN de Habilitación', placeholder: '12345', helper: 'PIN para habilitar el software ante la DIAN', type: 'password' },
      {
        key: 'ambiente_dian',
        label: 'Ambiente DIAN',
        type: 'select',
        options: [
          { value: 'pruebas', label: '🧪 Pruebas (Habilitación)' },
          { value: 'produccion', label: '🚀 Producción' },
        ],
      },
    ],
  },
];

const COLOR_MAP = {
  blue: { icon: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', badge: 'bg-blue-100 text-blue-700' },
  green: { icon: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', badge: 'bg-green-100 text-green-700' },
  purple: { icon: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', badge: 'bg-purple-100 text-purple-700' },
  orange: { icon: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', badge: 'bg-orange-100 text-orange-700' },
};

export default function ConfigDIAN() {
  const [config, setConfig] = useState({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(null); // section id being saved

  useEffect(() => {
    cargarConfig();
  }, []);

  async function cargarConfig() {
    try {
      setCargando(true);
      // Cargamos desde el endpoint de settings genérico o el específico de facturación
      const resp = await apiFetch(`${BACKEND_URL}/admin/settings/facturacion`);
      // resp.data es un array de { clave, valor }
      const map = {};
      (resp.data || []).forEach(item => { map[item.clave] = item.valor; });
      setConfig(map);
    } catch (err) {
      // Si el endpoint no existe aún, simplemente cargamos vacío
      console.warn('Config DIAN no disponible todavía:', err.message);
      setConfig({});
    } finally {
      setCargando(false);
    }
  }

  function handleChange(key, value) {
    setConfig(prev => ({ ...prev, [key]: value }));
  }

  async function handleGuardarSeccion(section) {
    try {
      setGuardando(section.id);
      const updates = section.fields.map(f => ({
        clave: f.key,
        valor: config[f.key] ?? '',
      }));
      await apiFetch(`${BACKEND_URL}/admin/settings/facturacion`, {
        method: 'POST',
        body: JSON.stringify({ settings: updates }),
      });
      showToast(`Sección "${section.title}" guardada correctamente`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGuardando(null);
    }
  }

  if (cargando) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <FaFileInvoiceDollar className="text-indigo-600 text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Configuración DIAN / RIPS
            </h1>
            <p className="text-[var(--color-text-secondary)] text-sm mt-0.5">
              Parámetros para la Facturación Electrónica de Venta (FEV) y el reporte de RIPS al Ministerio de Salud
            </p>
          </div>
        </div>

        {/* Info DIAN ambiente */}
        {config.ambiente_dian === 'produccion' && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <FaShieldAlt className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">
              <strong>Ambiente de Producción activo.</strong> Los documentos electrónicos generados serán enviados a la DIAN con validez legal.
            </p>
          </div>
        )}
        {(config.ambiente_dian === 'pruebas' || !config.ambiente_dian) && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
            <FaInfoCircle className="text-yellow-500 mt-0.5 shrink-0" />
            <p className="text-sm text-yellow-700">
              <strong>Ambiente de Pruebas activo.</strong> Configure todos los campos y cambie a Producción cuando esté listo para operar con la DIAN.
            </p>
          </div>
        )}
      </div>

      {/* Config Sections */}
      {CONFIG_SECTIONS.map((section) => {
        const colors = COLOR_MAP[section.color];
        const SectionIcon = section.icon;
        return (
          <Card key={section.id}>
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 ${colors.bg} ${colors.border} border rounded-xl`}>
                  <SectionIcon className={`${colors.icon} text-lg`} />
                </div>
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                  {section.title}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.fields.map((field) => {
                if (field.type === 'select') {
                  return (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        {field.label}
                      </label>
                      <select
                        value={config[field.key] || (field.options[0]?.value ?? '')}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition"
                      >
                        {field.options.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {field.helper && (
                        <p className="mt-1 text-xs text-slate-400">{field.helper}</p>
                      )}
                    </div>
                  );
                }
                return (
                  <div key={field.key}>
                    <Input
                      label={field.label}
                      type={field.type || 'text'}
                      value={config[field.key] ?? ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      helper={field.helper}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                loading={guardando === section.id}
                onClick={() => handleGuardarSeccion(section)}
              >
                <FaSave className="mr-2" /> Guardar {section.title}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
