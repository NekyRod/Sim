import React, { useState, useEffect } from 'react';
import { FaTimes, FaSearch, FaCheckCircle, FaStethoscope, FaClipboardList } from 'react-icons/fa';
import ModalBase from '../ModalBase';
import { Input, Button } from '../ui';
import { odontogramaApi } from '../../api/odontograma';

export const MicroFormModal = ({ isOpen, onClose, onSave, fdiNumber, cara, initialData }) => {
    const [hallazgo, setHallazgo] = useState('');
    const [planTratamiento, setPlanTratamiento] = useState('');
    const [cie10Query, setCie10Query] = useState('');
    const [cie10Results, setCie10Results] = useState([]);
    const [selectedCie10, setSelectedCie10] = useState(null);
    const [isLoadingCie10, setIsLoadingCie10] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setHallazgo(initialData?.hallazgo || '');
            setPlanTratamiento(initialData?.plan_tratamiento || '');
            setSelectedCie10(initialData?.cie10_codigo ? { 
                codigo: initialData.cie10_codigo, 
                nombre: initialData.cie10_texto 
            } : null);
            setCie10Query(initialData?.cie10_codigo ? `${initialData.cie10_codigo} - ${initialData.cie10_texto}` : '');
            setCie10Results([]);
        }
    }, [isOpen, initialData]);

    const handleCie10Search = async (val) => {
        setCie10Query(val);
        if (val.length < 2) {
            setCie10Results([]);
            return;
        }

        setIsLoadingCie10(true);
        try {
            const results = await odontogramaApi.searchCie10(val);
            setCie10Results(results);
        } catch (error) {
            console.error("Error searching CIE10:", error);
        } finally {
            setIsLoadingCie10(false);
        }
    };

    const handleSelectCie10 = (item) => {
        setSelectedCie10(item);
        setCie10Query(`${item.codigo} - ${item.nombre}`);
        setCie10Results([]);
    };

    const handleSave = () => {
        onSave({
            hallazgo,
            plan_tratamiento: planTratamiento,
            cie10_codigo: selectedCie10?.codigo,
            cie10_texto: selectedCie10?.nombre
        });
        onClose();
    };

    return (
        <ModalBase isOpen={isOpen} onClose={onClose} title={`Registro Clínico - Diente ${fdiNumber} (${cara})`}>
            <div className="space-y-6 p-1">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r flex items-start gap-3">
                    <div className="text-blue-500 mt-0.5"><FaStethoscope size={18} /></div>
                    <div>
                        <h4 className="text-sm font-bold text-blue-800 uppercase tracking-tight">Registro de Hallazgo</h4>
                        <p className="text-[11px] text-blue-600 font-medium">Capture el estado actual y el plan propuesto para esta superficie.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 flex items-center gap-1.5">
                            <FaStethoscope className="text-gray-400" /> Hallazgo Clínico *
                        </label>
                        <textarea 
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[80px]"
                            placeholder="Describa el hallazgo clínico (ej: Caries de dentina, fractura, etc.)"
                            value={hallazgo}
                            onChange={(e) => setHallazgo(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 flex items-center gap-1.5">
                            <FaClipboardList className="text-gray-400" /> Plan de Tratamiento *
                        </label>
                        <textarea 
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[80px]"
                            placeholder="Describa el plan de tratamiento propuesto"
                            value={planTratamiento}
                            onChange={(e) => setPlanTratamiento(e.target.value)}
                            required
                        />
                    </div>

                    <div className="relative">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 flex items-center gap-1.5">
                            <FaSearch className="text-gray-400" /> Diagnóstico CIE-10 *
                        </label>
                        <div className="relative">
                            <Input 
                                placeholder="Buscar código o nombre CIE-10..." 
                                value={cie10Query}
                                onChange={(e) => handleCie10Search(e.target.value)}
                                className="text-sm font-medium pr-10"
                            />
                            {isLoadingCie10 && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                </div>
                            )}
                            {selectedCie10 && !isLoadingCie10 && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                                    <FaCheckCircle />
                                </div>
                            )}
                        </div>

                        {cie10Results.length > 0 && (
                            <div className="absolute z-[60] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-[200px] overflow-y-auto">
                                {cie10Results.map(item => (
                                    <div 
                                        key={item.codigo}
                                        onClick={() => handleSelectCie10(item)}
                                        className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                                    >
                                        <div className="font-bold text-blue-600 text-xs">{item.codigo}</div>
                                        <div className="text-sm text-gray-700">{item.nombre}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button 
                        onClick={handleSave} 
                        disabled={!hallazgo || !planTratamiento || !selectedCie10}
                        className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
                    >
                        Guardar Registro
                    </Button>
                </div>
            </div>
        </ModalBase>
    );
};
