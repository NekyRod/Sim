import { FaTimes, FaFilePdf, FaCheckCircle, FaHospital, FaNotesMedical } from 'react-icons/fa';
import logoGOI from '../img/logo_goi.jpg';
import logoSanitas from '../img/logo-sanitas.png';
import { Button } from './ui';
import html2pdf from 'html2pdf.js';

export default function ConfirmacionCitaModal({ open, datos, onClose }) {
  if (!open) return null;

  const {
    nombrePaciente,
    docPaciente,
    fechaProgramacion,
    horaRecomendada,
    profesional,
    tipoServicio,
  } = datos || {};

  const esPBS = tipoServicio === 'PBS';
  const mensaje = esPBS
    ? 'Si no puede asistir, por favor cancele para darle oportunidad a otro paciente y no le genere multa por $14.000'
    : 'Si no puede asistir, por favor cancele para darle oportunidad a otro paciente';

  const ws = esPBS ? '3144056425' : '3144043773';

  const handleDownloadPdf = () => {
    const element = document.getElementById('comprobante-pdf');
    if (!element) return;

    const opt = {
      margin: 0.5,
      filename: `Comprobante_Cita_${docPaciente || 'Paciente'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-green-600 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FaCheckCircle className="text-xl" />
            <h3 className="text-lg font-bold">Cita Confirmada Exitosamente</h3>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
            <FaTimes />
          </button>
        </div>

        {/* Content (Paper/PDF Look) */}
        <div className="p-8 bg-gray-50 flex justify-center">
           <div id="comprobante-pdf" className="bg-white border border-gray-200 shadow-sm p-8 w-full max-w-lg rounded-lg relative">
             {/* Decorator holes or paper effect could go here */}
             
             {/* Logos */}
             <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
               <img src={logoSanitas} alt="Sanitas" className="h-12 object-contain" />
               <div className="text-right">
                  <div className="font-bold text-gray-800 text-sm">CITA MÉDICA</div>
                  <div className="text-xs text-gray-400">Comprobante Digital</div>
               </div>
               {esPBS && <img src={logoGOI} alt="GOI" className="h-10 object-contain" />}
             </div>

             {/* Details */}
             <div className="space-y-4 text-sm text-gray-700">
               <div className="flex justify-between border-b border-gray-50 pb-2">
                 <span className="font-bold text-gray-500 uppercase text-xs">Paciente</span>
                 <span className="font-semibold text-right">{nombrePaciente}</span>
               </div>
               <div className="flex justify-between border-b border-gray-50 pb-2">
                 <span className="font-bold text-gray-500 uppercase text-xs">Identificación</span>
                 <span className="font-mono text-right">{docPaciente}</span>
               </div>
               <div className="flex justify-between border-b border-gray-50 pb-2">
                 <span className="font-bold text-gray-500 uppercase text-xs">Profesional</span>
                 <div className="text-right flex items-center justify-end gap-1">
                    <FaNotesMedical className="text-blue-400" />
                    <span>{profesional}</span>
                 </div>
               </div>
               
               <div className="bg-blue-50/50 p-4 rounded-lg flex justify-between items-center mt-4 border border-blue-100">
                  <div className="flex flex-col">
                    <span className="text-xs text-blue-500 font-bold uppercase">Fecha</span>
                    <span className="text-lg font-bold text-blue-900">{fechaProgramacion}</span>
                  </div>
                  <div className="h-8 w-px bg-blue-200 mx-4"></div>
                  <div className="flex flex-col text-right">
                    <span className="text-xs text-blue-500 font-bold uppercase">Hora</span>
                    <span className="text-lg font-bold text-blue-900">{horaRecomendada}</span>
                  </div>
               </div>

               <div className="mt-6 text-xs text-gray-500 bg-gray-50 p-3 rounded italic border border-gray-100">
                 <p className="font-bold text-gray-700 mb-1 flex items-center gap-1"><FaHospital /> Dirección:</p>
                 CR 54 # 152A - 85 3er piso Barrio Mazuren
               </div>

               <div className="text-xs text-gray-500 text-center mt-4 px-4 leading-relaxed">
                 <p>{mensaje}</p>
                 <p className="mt-1 font-bold">WhatsApp: {ws}</p>
               </div>
             </div>

           </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3 rounded-b-xl">
           <Button variant="ghost" onClick={onClose}>Cerrar</Button>
           <Button onClick={handleDownloadPdf} className="flex items-center gap-2">
             <FaFilePdf /> Descargar PDF
           </Button>
        </div>
      </div>
    </div>
  );
}
