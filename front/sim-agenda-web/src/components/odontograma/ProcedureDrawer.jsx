import React, { useState, useMemo, useEffect } from 'react';
import { FaSearch, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { Input, Button, Badge } from '../ui';
import { useOdontogramStore } from '../../store/useOdontogramStore';

const VALID_FDI_TEETH = [
    18, 17, 16, 15, 14, 13, 12, 11,
    21, 22, 23, 24, 25, 26, 27, 28,
    48, 47, 46, 45, 44, 43, 42, 41,
    31, 32, 33, 34, 35, 36, 37, 38
];

export const ProcedureDrawer = ({ isOpen, onClose, procedimientos }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProcedimiento, setSelectedProcedimiento] = useState(null);
    const [toothValue, setToothValue] = useState('');
    const [selectedCara, setSelectedCara] = useState('Completo');

    const aplicarProcedimientoGlobal = useOdontogramStore(state => state.aplicarProcedimiento);
    const setProcedimientoActivo = useOdontogramStore(state => state.setProcedimientoActivo);
    const evolucionPorcentajeActivo = useOdontogramStore(state => state.evolucionPorcentajeActivo);
    const setEvolucionPorcentaje = useOdontogramStore(state => state.setEvolucionPorcentaje);

    // Reseteo interno
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
            setSelectedProcedimiento(null);
            setToothValue('');
            setSelectedCara('Completo');
        }
    }, [isOpen]);

    const filteredProcedimientos = useMemo(() => {
        if (!searchTerm) return procedimientos;
        return procedimientos.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm, procedimientos]);

    const handleSelectProcedimiento = (proc) => {
        setSelectedProcedimiento(proc);
        if (proc.aplica_diente_completo) {
            setSelectedCara('Completo');
        } else if (proc.aplica_a_cara && selectedCara === 'Completo') {
            setSelectedCara('Oclusal'); // Default safe
        }
    };

    const handleApply = () => {
        const toothNumber = parseInt(toothValue);
        
        if (!VALID_FDI_TEETH.includes(toothNumber)) {
            alert("Número de diente FDI inválido.");
            return;
        }
        if (!selectedProcedimiento) {
            alert("Debe seleccionar un procedimiento del catálogo.");
            return;
        }

        // 1. Inyectamos el procedimiento forzadamente en el store activo para que el mutador lo lea
        setProcedimientoActivo(selectedProcedimiento);

        // 2. Disparamos la función core de OdontogramStore (como si el doc hubiera hecho clic en el SVG)
        aplicarProcedimientoGlobal(toothNumber, selectedCara);

        // 3. Feedback visual (cierre o limpieza)
        setToothValue('');
        alert(`¡Procedimiento ${selectedProcedimiento.nombre} aplicado al diente ${toothNumber}!`);
    };

    if (!isOpen) return null;

    return (
        <div className="absolute top-0 right-0 w-80 h-full bg-white shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.1)] z-40 flex flex-col animate-slide-in-right border-l border-gray-100">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b bg-gray-50 text-gray-800">
                <h3 className="font-bold text-lg flex items-center gap-2">Catálogo</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                    <FaTimes />
                </button>
            </div>

            {/* Buscador */}
            <div className="p-4 border-b">
                <Input 
                    placeholder="Buscar procedimiento..." 
                    icon={<FaSearch className="text-gray-400"/>} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-sm"
                />
            </div>

            {/* Lista Filtrable */}
            <div className="flex-1 overflow-y-auto p-2 bg-gray-50/50">
                {filteredProcedimientos.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm mt-4">No se encontraron resultados</p>
                ) : (
                    <div className="flex flex-col gap-1.5">
                        {filteredProcedimientos.map(proc => (
                            <div 
                                key={proc.id}
                                onClick={() => handleSelectProcedimiento(proc)}
                                className={`p-3 rounded-lg border text-sm cursor-pointer transition-all flex items-center justify-between
                                    ${selectedProcedimiento?.id === proc.id 
                                        ? 'bg-blue-50 border-blue-400 shadow-sm' 
                                        : 'bg-white border-gray-200 hover:border-blue-300'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <span 
                                        className="w-3 h-3 rounded-full shadow-sm border" 
                                        style={{ backgroundColor: proc.color_hex }}
                                    />
                                    <span className="font-medium text-gray-700">{proc.nombre}</span>
                                </div>
                                {selectedProcedimiento?.id === proc.id && <FaCheckCircle className="text-blue-500" />}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Formulario de Asignación por Teclado */}
            <div className="p-4 border-t bg-white flex flex-col gap-4 shadow-[0_-5px_15px_rgba(0,0,0,0.02)] relative z-10">
                <h4 className="font-semibold text-sm text-gray-800">Aplicación Directa</h4>
                
                <div className="flex gap-2 mb-2">
                    <div className="w-1/2">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">FDI</label>
                        <Input 
                            type="number" 
                            placeholder="Ej: 18" 
                            value={toothValue}
                            onChange={(e) => setToothValue(e.target.value)}
                            className="text-center font-bold"
                        />
                    </div>
                    <div className="w-1/2">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Evolución</label>
                        <select 
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border disabled:bg-gray-100 disabled:text-gray-400"
                            value={evolucionPorcentajeActivo}
                            onChange={(e) => setEvolucionPorcentaje(e.target.value)}
                            disabled={!selectedProcedimiento}
                        >
                            <option value="25">25% (Ini)</option>
                            <option value="50">50% (Med)</option>
                            <option value="75">75% (Ava)</option>
                            <option value="100">100% (Fin)</option>
                        </select>
                    </div>
                </div>
                
                <div className="w-full">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Cara / Tipo</label>
                        <select 
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border disabled:bg-gray-100 disabled:text-gray-400"
                            value={selectedCara}
                            onChange={(e) => setSelectedCara(e.target.value)}
                            disabled={!selectedProcedimiento || selectedProcedimiento.aplica_diente_completo}
                        >
                            <option value="Completo">Diente Completo</option>
                            <option disabled={selectedProcedimiento && !selectedProcedimiento.aplica_a_cara} value="Oclusal">Oclusal (Centro)</option>
                            <option disabled={selectedProcedimiento && !selectedProcedimiento.aplica_a_cara} value="Mesial">Mesial</option>
                            <option disabled={selectedProcedimiento && !selectedProcedimiento.aplica_a_cara} value="Distal">Distal</option>
                            <option disabled={selectedProcedimiento && !selectedProcedimiento.aplica_a_cara} value="Vestibular">Vestibular (Arriba)</option>
                            <option disabled={selectedProcedimiento && !selectedProcedimiento.aplica_a_cara} value="Lingual">Lingual/Palatina (Abajo)</option>
                        </select>
                    </div>

                <Button 
                    onClick={handleApply}
                    disabled={!selectedProcedimiento || !toothValue}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 mt-2"
                >
                    Aplicar Tratamiento
                </Button>
            </div>
        </div>
    );
};
