import { Card, Badge, Button } from '../components/ui';
import { 
  FaBook, FaUserPlus, FaCalendarPlus, FaCalendarCheck, 
  FaChartBar, FaCog, FaComments, FaQuestionCircle,
  FaSearch, FaTooth, FaFileMedicalAlt, FaStethoscope, FaClipboardList
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

export default function Manual() {
  const { role } = useAuth();

  const allSections = [
    {
      id: 'busqueda',
      title: 'Búsqueda Global de Pacientes',
      icon: FaSearch,
      content: (
        <div className="space-y-4">
          <p className="text-slate-700">Utilice la barra superior para localizar pacientes instantáneamente por nombre o número de documento.</p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <ul className="list-disc ml-5 space-y-2 text-sm text-slate-700">
              <li><strong>En Agendamiento:</strong> Si el paciente existe, sus datos se cargan automáticamente para programar una nueva cita.</li>
              <li><strong>Ficha Médica:</strong> En cualquier otro módulo, al seleccionar un resultado se abre la ficha completa del paciente para ver historial, alertas y editar datos.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'agendamiento',
      title: 'Agendamiento Administrativo',
      icon: FaCalendarPlus,
      content: (
        <div className="space-y-4">
          <p className="text-slate-700">Flujo profesional para asignar citas desde la recepción:</p>
          <div className="space-y-3">
             <div className="p-3 bg-slate-50 border-l-4 border-blue-500 rounded-r-lg">
                <p className="text-sm text-slate-600"><span className="font-bold text-slate-800">1. Identificación:</span> Ingrese el ID. El sistema buscará automáticamente si el paciente ya está registrado.</p>
             </div>
             <div className="p-3 bg-slate-50 border-l-4 border-blue-500 rounded-r-lg">
                <p className="text-sm text-slate-600"><span className="font-bold text-slate-800">2. Servicio y Motivo:</span> Seleccione si es PBS o Particular y elija la especialidad (motivo).</p>
             </div>
             <div className="p-3 bg-slate-50 border-l-4 border-blue-500 rounded-r-lg">
                <p className="text-sm text-slate-600"><span className="font-bold text-slate-800">3. Programación:</span> Use <strong>"Buscar Agenda Disponible"</strong>. Se abrirá un calendario en tiempo real con los espacios libres de cada doctor.</p>
             </div>
             <div className="p-3 bg-slate-50 border-l-4 border-blue-600 rounded-r-lg">
                <p className="text-sm text-slate-600"><span className="font-bold text-slate-800">4. Finalización:</span> Verifique el resumen a la derecha y haga clic en <strong>"Confirmar Agendamiento"</strong> para insertar la cita.</p>
             </div>
          </div>
        </div>
      )
    },
    {
      id: 'agendas',
      title: 'Agenda Diaria y Control',
      icon: FaCalendarCheck,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-bold text-blue-800 underline">Agenda Diaria</h4>
              <p className="text-slate-600">Visualice la lista de pacientes del día actual o futuro:</p>
              <ul className="list-disc ml-5 text-slate-600 space-y-1">
                <li><strong>Modificar:</strong> Icono de lápiz (azul) para re-programar fecha, hora o doctor.</li>
                <li><strong>Eliminar:</strong> Icono de basura (rojo) para cancelar la cita definitivamente.</li>
                <li><strong>Exportar:</strong> Botón verde para descargar la agenda del día en formato Excel.</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-red-800 underline">Control y Bloqueos</h4>
              <p className="text-slate-600">Gestión de calendarios mensuales:</p>
              <ul className="list-disc ml-5 text-slate-600 space-y-1">
                <li><strong>Bloqueo (Botón B):</strong> Permite inhabilitar rangos de horas o días enteros para un doctor por reuniones o permisos.</li>
                <li><strong>Ver Citas (Botón A):</strong> Resumen rápido de quiénes están citados en un día específico.</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'chat',
      title: 'Chatbot de Auto-agendamiento',
      icon: FaComments,
      content: (
        <div className="space-y-4">
          <p className="text-slate-700">Servicio 24/7 para que el paciente gestione su propia salud desde su celular:</p>
          <div className="bg-green-50 p-4 rounded-lg space-y-3">
             <div className="flex gap-2 items-start">
                <div className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center shrink-0 text-xs font-bold">1</div>
                <p className="text-sm text-slate-700"><strong>Habilitación:</strong> Solo las especialidades marcadas como "Autoagendar" en configuración aparecerán aquí.</p>
             </div>
             <div className="flex gap-2 items-start">
                <div className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center shrink-0 text-xs font-bold">2</div>
                <p className="text-sm text-slate-700"><strong>Flujo:</strong> El paciente elige la opción de agendar, selecciona el motivo habilitado y el sistema le muestra solo horarios disponibles.</p>
             </div>
             <div className="flex gap-2 items-start">
                <div className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center shrink-0 text-xs font-bold">3</div>
                <p className="text-sm text-slate-700"><strong>Confirmación:</strong> El paciente elige su espacio y la cita queda firmemente programada en la Agenda de la clínica.</p>
             </div>
          </div>
        </div>
      )
    },
    {
      id: 'informes',
      title: 'Auditoría e Informes',
      icon: FaChartBar,
      content: (
        <div className="space-y-4">
          <p className="text-slate-700">Métricas clave y listados para la toma de decisiones y control administrativo:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-white border rounded-lg p-3">
                <h4 className="font-bold text-sm mb-2 text-blue-700">Listado de Citas</h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-2">Permite generar un reporte detallado de todas las citas en un rango de fechas personalizado (Ej: mes actual, última semana).</p>
                <ul className="list-disc ml-4 text-[10px] text-slate-500 space-y-1">
                  <li><strong>Filtros:</strong> Seleccione Fecha Inicio y Fecha Fin.</li>
                  <li><strong>Campos:</strong> Incluye Profesional, Paciente, Consultorio (Especialidad) y Tipo de Servicio.</li>
                  <li><strong>Exportación:</strong> Descargue el resultado a Excel para auditorías externas.</li>
                </ul>
             </div>
             <div className="bg-white border rounded-lg p-3">
                <h4 className="font-bold text-sm mb-2 text-red-700">Cancelaciones</h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-2">Analice el ausentismo y los motivos por los cuales se pierden espacios en la agenda.</p>
                <ul className="list-disc ml-4 text-[10px] text-slate-500 space-y-1">
                  <li>Identifica quién canceló la cita (Paciente o Administración).</li>
                  <li>Registra el motivo exacto para mejorar la calidad del servicio.</li>
                </ul>
             </div>
          </div>
        </div>
      )
    },
    {
      id: 'historia',
      title: 'Historia Clínica y Gestión de Atención',
      icon: FaFileMedicalAlt,
      content: (
        <div className="space-y-4">
          <p className="text-slate-700">Wolf Medic ofrece una visión integral 360° de la salud dental del paciente mediante módulos especializados:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-white border rounded-lg p-3 shadow-sm">
                <h4 className="font-bold text-sm mb-2 text-blue-700 flex items-center gap-2">
                  <FaStethoscope /> Flujo de Atención
                </h4>
                <ul className="list-disc ml-4 text-[11px] text-slate-600 space-y-1">
                  <li><strong>Consulta:</strong> Registro del motivo de atención y diagnóstico presuntivo.</li>
                  <li><strong>Anamnesis:</strong> Declaración obligatoria de antecedentes médicos y escala de dolor (VAS).</li>
                  <li><strong>Evoluciones:</strong> Notas cronológicas de cada procedimiento realizado que se bloquean al firmar.</li>
                </ul>
             </div>
             <div className="bg-white border rounded-lg p-3 shadow-sm">
                <h4 className="font-bold text-sm mb-2 text-indigo-700 flex items-center gap-2">
                  <FaClipboardList /> Gestión de Apoyo
                </h4>
                <ul className="list-disc ml-4 text-[11px] text-slate-600 space-y-1">
                  <li><strong>Rx y Documentos:</strong> Repositorio digital para radiografías y archivos externos.</li>
                  <li><strong>Recetas y Consentimientos:</strong> Generación automatizada de fórmulas médicas y documentos legales firmados por el paciente.</li>
                </ul>
             </div>
          </div>
        </div>
      )
    },
    {
      id: 'odontograma',
      title: 'Odontograma',
      icon: FaTooth,
      content: (
        <div className="space-y-4">
          <p className="text-slate-700">Registro de hallazgos y tratamientos en el esquema dental:</p>
          <div className="bg-blue-50/50 p-4 rounded-xl space-y-3 border border-blue-100">
             <div className="flex gap-3">
                <div className="bg-blue-600 text-white rounded-lg px-2 py-1 text-[10px] font-bold h-fit min-w-[90px] text-center">MODO PINTAR</div>
                <p className="text-sm text-slate-700">Seleccione un procedimiento del catálogo (Toolbar) y haga clic directamente en los dientes o caras para marcarlos visualmente.</p>
             </div>
             <div className="flex gap-3">
                <div className="bg-indigo-600 text-white rounded-lg px-2 py-1 text-[10px] font-bold h-fit min-w-[90px] text-center">MODO DETALLE</div>
                <p className="text-sm text-slate-700">Si no hay un color seleccionado, al hacer clic en un diente se abrirá el <strong>Micro-Formulario</strong> para registrar hallazgos técnicos, planes de tratamiento y códigos CIE-10.</p>
             </div>
             <div className="flex gap-3">
                <div className="bg-green-600 text-white rounded-lg px-2 py-1 text-[10px] font-bold h-fit min-w-[90px] text-center">AUTOGUARDADO</div>
                <p className="text-sm text-slate-700">Cada cambio se sincroniza automáticamente en segundo plano (indicador verde arriba a la derecha), evitando pérdida de datos por cierres inesperados.</p>
             </div>
             <div className="flex gap-3">
                <div className="bg-red-600 text-white rounded-lg px-2 py-1 text-[10px] font-bold h-fit min-w-[90px] text-center">RIGOR LEGAL</div>
                <p className="text-sm text-red-800 font-bold uppercase tracking-tight">El sistema bloquea la firma del registro si la Anamnesis obligatoria no ha sido completada según la norma.</p>
             </div>
          </div>
        </div>
      )
    },
    {
      id: 'config',
      title: 'Centro de Configuración (Admin)',
      icon: FaCog,
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-700 font-semibold border-b pb-1">Gestione los pilares del sistema:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-xs text-slate-600">
             <div><strong>• Profesionales:</strong> Crear y editar doctores, vinculándolos a sus especialidades.</div>
             <div><strong>• Especialidades:</strong> Definir tiempos de duración de consulta y activar el flag <strong>"Permitir Autogestión"</strong> para el Chatbot.</div>
             <div><strong>• Tipos de Servicio:</strong> Configurar si es PBS, Particular o convenios específicos.</div>
             <div><strong>• Tipos de Identificación:</strong> Configurar documentos permitidos (CC, TI, RC, etc).</div>
             <div><strong>• Festivos:</strong> Cargar días no laborables para que el sistema bloquee automáticamente la agenda.</div>
             <div><strong>• Ciudades:</strong> Gestionar el catálogo de residencias de los pacientes.</div>
             <div><strong>• Tipos PBS:</strong> Detalle de clasificaciones de plan de beneficios.</div>
             <div><strong>• Usuarios y Roles:</strong> Control de acceso y permisos por nivel (Admin, Recepción, Doctor).</div>
          </div>
        </div>
      )
    }
  ];

  const sections = allSections.filter(s => {
    if (s.id === 'config' && role !== 'Administrador') return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn py-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
           <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
              <FaBook size={48} />
           </div>
           <div className="text-center md:text-left">
              <h1 className="text-4xl font-black mb-2">Centro de Ayuda Wolf Medic</h1>
           </div>
        </div>
        {/* Decorative circle */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/5 rounded-full" />
      </div>

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Table of Contents / Sidebar */}
        <div className="lg:col-span-1 space-y-4">
           <div className="sticky top-24">
              <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs mb-4 ml-2">Módulos del Sistema</h3>
              <nav className="flex flex-col gap-1">
                 {sections.map(s => (
                    <a 
                      key={s.id} 
                      href={`#${s.id}`}
                      className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all group"
                    >
                       <div className="shrink-0"><s.icon className="text-slate-400 group-hover:text-blue-500" /></div>
                       <span className="font-semibold text-sm leading-tight text-left">{s.title}</span>
                    </a>
                 ))}
              </nav>
              

           </div>
        </div>

        {/* Detailed Sections */}
        <div className="lg:col-span-2 space-y-10">
           {sections.map((section) => (
             <div key={section.id} id={section.id} className="scroll-mt-24">
                <Card className="hover:shadow-md transition-shadow border-none shadow-sm ring-1 ring-slate-100">
                   <div className="flex items-center gap-4 mb-6 border-b border-slate-50 pb-4">
                      <div className="p-3 bg-blue-100/50 rounded-2xl text-blue-700">
                        <section.icon size={28} />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-800">{section.title}</h2>
                   </div>
                   <div className="leading-relaxed">
                      {section.content}
                   </div>
                </Card>
             </div>
           ))}
        </div>

      </div>

      <footer className="text-center py-10 text-slate-400 text-sm border-t mt-10">
         Wolf Medic © 2026 - Centro Médico Protésico
      </footer>
    </div>
  );
}
