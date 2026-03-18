import { useState } from 'react';
import { apiFetch } from '../api/client';
import { showToast } from '../utils/ui';
import { FaChartBar, FaFileExcel, FaSearch, FaCalendarAlt } from 'react-icons/fa';
import { exportToExcel } from '../utils/excel';
import { Card, Select, Button, Input, Table, Badge } from '../components/ui';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function Informes() {
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  const [reportType, setReportType] = useState('listado'); // 'listado' or 'cancelaciones'
  
  // Filters common to both
  const [fechaInicio, setFechaInicio] = useState(currentMonthStart.toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generado, setGenerado] = useState(false);

  async function generarReporte() {
    setLoading(true);
    setGenerado(true);
    try {
      let url = '';
      if (reportType === 'listado') {
        url = `${BACKEND_URL}/informes/listado?inicio=${fechaInicio}&fin=${fechaFin}`;
      } else {
        url = `${BACKEND_URL}/informes/cancelaciones?inicio=${fechaInicio}&fin=${fechaFin}`;
      }
      
      const resp = await apiFetch(url);
      setDatos(resp.data || []);
    } catch (err) {
      console.warn('Error generando reporte:', err);
      setDatos([]); 
      showToast('No se pudieron cargar los datos del reporte.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleExportExcel = () => {
    if (datos.length === 0) return showToast('No hay datos para exportar', 'error');
    
    let dataToExport = [];
    let fileName = '';
    let sheetName = '';

    if (reportType === 'listado') {
      dataToExport = datos.map(d => ({
        'Fecha': d.fecha,
        'Hora': `${d.hora} - ${d.hora_fin || ''}`,
        'Paciente': d.paciente,
        'Documento': d.documento,
        'Profesional': d.profesional,
        'Motivo': d.motivo,
        'Estado': d.estado,
        'Servicio': d.tipo_servicio
      }));
      fileName = `Reporte_Citas_${fechaInicio}_${fechaFin}.xlsx`;
      sheetName = 'Listado de Citas';
    } else {
      dataToExport = datos.map(d => ({
        'Fecha Cita': d.fecha_programada,
        'Hora': d.hora,
        'Paciente': d.paciente,
        'Documento': d.documento,
        'Profesional': d.profesional,
        'Motivo Cancelación': d.motivo,
        'Cancelado Por': d.cancelado_por,
        'Fecha Cancelación': d.fecha_cancelacion
      }));
      fileName = `Reporte_Cancelaciones_${fechaInicio}_${fechaFin}.xlsx`;
      sheetName = 'Cancelaciones';
    }

    exportToExcel(dataToExport, fileName, sheetName);
  };

  const columnsListado = [
    { key: 'fecha', label: 'Fecha' },
    { key: 'hora', label: 'Hora', render: (val, row) => <span className="font-mono text-xs">{val} - {row.hora_fin || ''}</span> },
    { key: 'paciente', label: 'Paciente' },
    { key: 'documento', label: 'Documento' },
    { key: 'profesional', label: 'Profesional' },
    { key: 'motivo', label: 'Motivo', render: (val) => <Badge size="sm" variant="info">{val}</Badge> },
    { key: 'estado', label: 'Estado', render: (val) => <Badge variant={val === 'PROGRAMADA' ? 'success' : 'neutral'}>{val}</Badge> },
    { key: 'tipo_servicio', label: 'Servicio' }
  ];

  const columnsCancelaciones = [
    { key: 'fecha_programada', label: 'F. Cita' },
    { key: 'hora', label: 'Hora' },
    { key: 'paciente', label: 'Paciente' },
    { key: 'profesional', label: 'Profesional' },
    { key: 'motivo', label: 'Motivo Cancelación' },
    { key: 'cancelado_por', label: 'Cancelado Por' },
    { key: 'fecha_cancelacion', label: 'F. Cancelación', render: (val) => <span className="text-xs text-gray-500">{val}</span> }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-brand-primary)]">Reportes e Indicadores</h1>
          <p className="text-[var(--color-text-secondary)]">Gestión y análisis de datos del centro médico.</p>
        </div>
        <Button onClick={handleExportExcel} variant="success" disabled={datos.length === 0} className="flex items-center gap-2">
           <FaFileExcel /> Exportar Resultado
        </Button>
      </div>

      {/* Tabs Simple */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => { setReportType('listado'); setGenerado(false); setDatos([]); }}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${reportType === 'listado' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Listado de Citas
        </button>
        <button
          onClick={() => { setReportType('cancelaciones'); setGenerado(false); setDatos([]); }}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${reportType === 'cancelaciones' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Cancelaciones
        </button>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row items-end gap-4">
          <Input 
             type="date" 
             label="Fecha Inicio" 
             value={fechaInicio} 
             onChange={(e) => setFechaInicio(e.target.value)}
          />
          <Input 
             type="date" 
             label="Fecha Fin" 
             value={fechaFin} 
             onChange={(e) => setFechaFin(e.target.value)}
          />
          <Button onClick={generarReporte} disabled={loading} className="mb-[2px] w-full md:w-auto">
            {loading ? 'Generando...' : 'Generar Reporte'}
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden min-h-[400px]">
        {!generado ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
             <FaChartBar size={48} className="mb-4 opacity-20" />
             <p>Seleccione los filtros y haga clic en "Generar Reporte"</p>
          </div>
        ) : (
          <>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 flex items-center gap-2">
               <FaSearch /> Se encontraron <strong>{datos.length}</strong> registros para el periodo seleccionado.
            </div>
            <Table
               columns={reportType === 'listado' ? columnsListado : columnsCancelaciones}
               data={datos}
               emptyMessage="No se encontraron datos para los filtros seleccionados."
            />
          </>
        )}
      </Card>
    </div>
  );
}
