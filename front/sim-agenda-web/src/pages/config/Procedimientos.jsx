// src/pages/config/Procedimientos.jsx
import { useState, useEffect, useMemo } from 'react';
import { FaSearch, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { Card, Input, Button, Table, Badge } from '../../components/ui';
import { procedimientosApi } from '../../api/procedimientos';
import { showToast, showConfirm } from '../../utils/ui';

const initForm = {
  id: null,
  nombre: '',
  tipo: 'Hallazgo',
  color_hex: '#3B82F6',
  aplica_a_cara: true,
  aplica_diente_completo: false,
  es_extraccion: false
};

export default function Procedimientos() {
  const [procedimientos, setProcedimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal / Drawer Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(initForm);
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    try {
      const resp = await procedimientosApi.getAll();
      // Algunos endpoints devuelven { data: [...] }, otros directamente el array. Protegemos esto:
      setProcedimientos(Array.isArray(resp) ? resp : (resp.data || []));
    } catch (err) {
      showToast('Error cargando procedimientos: ' + err.message, 'error');
    } finally {
      setCargando(false);
    }
  }

  const filteredData = useMemo(() => {
    if (!searchTerm) return procedimientos;
    return procedimientos.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [procedimientos, searchTerm]);

  function abrirNuevo() {
    setForm(initForm);
    setEditando(false);
    setIsFormOpen(true);
  }

  function abrirEditar(proc) {
    setForm({ ...proc });
    setEditando(true);
    setIsFormOpen(true);
  }

  async function handleDelete(id) {
    if (await showConfirm('¿Está seguro de eliminar o inactivar este procedimiento?')) {
      try {
        const resp = await procedimientosApi.remove(id);
        showToast(resp.mensaje || 'Proceso finalizado');
        cargarDatos();
      } catch (err) {
        showToast('Error al eliminar: ' + err.message, 'error');
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nombre.trim()) return showToast("El nombre es obligatorio", "error");

    try {
      if (editando) {
        await procedimientosApi.update(form.id, form);
        showToast("Procedimiento actualizado");
      } else {
        await procedimientosApi.create(form);
        showToast("Procedimiento creado con éxito");
      }
      setIsFormOpen(false);
      cargarDatos();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  const columns = [
    { 
      key: 'color_hex', 
      label: 'Color',
      render: (val) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border shadow-sm" style={{ backgroundColor: val }}></div>
          <span className="text-xs text-gray-500 uppercase">{val}</span>
        </div>
      )
    },
    { key: 'nombre', label: 'Nombre del Procedimiento' },
    { key: 'tipo', label: 'Clasificación', render: (val) => <Badge variant="neutral">{val}</Badge> },
    { 
      key: 'alcance', 
      label: 'Aplica A',
      render: (_, row) => (
        <div className="flex flex-col gap-1 text-xs">
          {row.aplica_a_cara && <span className="text-blue-600 font-medium">✔️ Caras Oclusales</span>}
          {row.aplica_diente_completo && <span className="text-purple-600 font-medium">✔️ Diente Completo</span>}
        </div>
      )
    },
    { 
      key: 'es_extraccion', 
      label: '¿Exodoncia?',
      render: (val) => val ? <Badge variant="danger">Excluyente Visual</Badge> : <span className="text-gray-400">-</span>
    },
    { 
      key: 'activo', 
      label: 'Estado',
      render: (val) => val ? <Badge variant="success">Activo</Badge> : <Badge variant="error" className="bg-red-100 text-red-700">Inactivo</Badge> 
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => abrirEditar(row)} className="text-blue-600 hover:text-blue-800 !p-2"><FaEdit /></Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} className="text-red-500 hover:text-red-700 !p-2"><FaTrash /></Button>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-brand-primary)]">Catálogo de Procedimientos</h1>
          <p className="text-[var(--color-text-secondary)]">Administra hallazgos, tratamientos y configuración para el Odontograma.</p>
        </div>
        <Button onClick={abrirNuevo} className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700">
          <FaPlus /> Nuevo Procedimiento
        </Button>
      </div>

      {/* Grid */}
      <Card className="overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Buscar procedimiento..."
              icon={<FaSearch />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {cargando ? (
          <div className="py-12 text-center text-gray-500">Cargando base de datos médica...</div>
        ) : (
          <Table columns={columns} data={filteredData} emptyMessage="No hay procedimientos clínicos registrados." />
        )}
      </Card>

      {/* Modal / Slide-over Formulario */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-slide-in-right">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">{editando ? 'Editar Procedimiento' : 'Nuevo Procedimiento'}</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Clínico</label>
                <Input required value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Ej: Amalgama, Extracción..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color Diagnóstico (HEX)</label>
                <div className="flex gap-2 items-center">
                  <input type="color" className="w-12 h-10 cursor-pointer" value={form.color_hex} onChange={e => setForm({...form, color_hex: e.target.value})} />
                  <Input required className="flex-1 uppercase font-mono text-sm" value={form.color_hex} onChange={e => setForm({...form, color_hex: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo / Clasificación</label>
                <select 
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                  value={form.tipo} 
                  onChange={e => setForm({...form, tipo: e.target.value})}
                >
                  <option value="Hallazgo">Hallazgo Preventivo</option>
                  <option value="Tratamiento">Tratamiento / Corrección</option>
                  <option value="Diagnostico">Diagnóstico</option>
                </select>
              </div>

              <div className="pt-4 border-t space-y-4">
                <h3 className="font-semibold text-gray-800 text-sm">Comportamiento en Odontograma</h3>
                
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300" checked={form.aplica_a_cara} onChange={e => setForm({...form, aplica_a_cara: e.target.checked})} />
                  <div>
                    <span className="block text-sm font-medium text-gray-700">Se aplica por Cara Dental</span>
                    <span className="block text-xs text-gray-500">Permite colorear secciones Individuales (Oclusal, Mesial...)</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1 w-4 h-4 text-purple-600 rounded border-gray-300" checked={form.aplica_diente_completo} onChange={e => setForm({...form, aplica_diente_completo: e.target.checked})} />
                  <div>
                    <span className="block text-sm font-medium text-gray-700">Se aplica al Diente Completo</span>
                    <span className="block text-xs text-gray-500">Ej: Implantes, Coronas, Prótesis (bloquea la selección de caras)</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer bg-red-50 p-2 rounded border border-red-100">
                  <input type="checkbox" className="mt-1 w-4 h-4 text-red-600 rounded border-red-300" checked={form.es_extraccion} onChange={e => setForm({...form, es_extraccion: e.target.checked})} />
                  <div>
                    <span className="block text-sm font-medium text-red-800">Marca Extracción Geométrica (Exodoncia)</span>
                    <span className="block text-xs text-red-600">Dibuja una cruz gigante sobre el diente y suprime el mapeo de caras histórico.</span>
                  </div>
                </label>
              </div>

            </form>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
              <Button type="submit" onClick={handleSubmit} className="bg-blue-600 text-white hover:bg-blue-700">Guardar Procedimiento</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
