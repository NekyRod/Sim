import React, { useState, useEffect, useRef } from 'react';
import { FaCheckCircle, FaStethoscope, FaSearch } from 'react-icons/fa';
import ModalBase from '../ModalBase';
import { Input, Button } from '../ui';
import { odontogramaApi } from '../../api/odontograma';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export const QuickAnamnesisModal = ({ isOpen, onClose, pacienteId, initialData, onSaveSuccess }) => {
    const { user } = useAuth();
    const [anamnesis, setAnamnesis] = useState({
        motivo_consulta: '',
        escala_dolor: 0,
        cie10_codigo: '',
        cie10_texto: '',
        antece_medicos: {}
    });
    const [cie10Search, setCie10Search] = useState('');
    const [cie10Results, setCie10Results] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isSearchingCie10, setIsSearchingCie10] = useState(false);
    const cie10Ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (cie10Ref.current && !cie10Ref.current.contains(event.target)) {
                setCie10Results([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && initialData) {
            setAnamnesis({
                motivo_consulta: initialData.motivo_consulta || '',
                escala_dolor: initialData.escala_dolor || 0,
                cie10_codigo: initialData.cie10_codigo || '',
                cie10_texto: initialData.cie10_texto || '',
                antece_medicos: initialData.antece_medicos || {}
            });
            setCie10Search(initialData.cie10_codigo ? `${initialData.cie10_codigo} - ${initialData.cie10_texto}` : '');
        }
    }, [isOpen, initialData]);

    const handleCie10Search = async (val) => {
        setCie10Search(val);
        
        // Limpiar selección previa si el usuario vuelve a escribir
        setAnamnesis(prev => ({ ...prev, cie10_codigo: '', cie10_texto: '' }));
        
        if (val.length < 2) {
            setCie10Results([]);
            return;
        }

        setIsSearchingCie10(true);
        try {
            const results = await odontogramaApi.searchCie10(val);
            setCie10Results(results);
            
            // Auto-selección si hay un match exacto por código
            const exactMatch = results.find(r => r.codigo.toLowerCase() === val.trim().toLowerCase());
            if (exactMatch) {
                setAnamnesis(prev => ({
                    ...prev, 
                    cie10_codigo: exactMatch.codigo, 
                    cie10_texto: exactMatch.nombre
                }));
            }
        } catch (error) {
            console.error("Error searching CIE10:", error);
        } finally {
            setIsSearchingCie10(false);
        }
    };

    const handleSave = async () => {
        console.log("Saving anamnesis for patient:", pacienteId, "with data:", anamnesis);
        setIsSaving(true);
        try {
            const payload = {
                ...anamnesis,
                registrado_por: user?.username || 'admin'
            };
            console.log("Payload to send:", payload);
            await odontogramaApi.saveAnamnesis(pacienteId, payload);
            toast.success("Anamnesis actualizada correctamente");
            onSaveSuccess(anamnesis);
            onClose();
        } catch (error) {
            console.error("Critical error saving anamnesis:", error);
            const errorMsg = error.message || "No se pudo guardar la anamnesis";
            toast.error(errorMsg);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ModalBase open={isOpen} onClose={onClose} title="Completar Ficha Clínica Obligatoria">
            <div className="space-y-6">
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded flex items-start gap-4">
                    <div className="text-amber-500 mt-1"><FaStethoscope size={20} /></div>
                    <div>
                        <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wide">Información Normativa Requerida</h4>
                        <p className="text-xs text-amber-700 mt-0.5">Estos campos son obligatorios según la resolución 1995 de 1999 para habilitar la firma del registro.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Motivo de Consulta *</label>
                            <textarea 
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px]"
                                placeholder="Describa el motivo principal..."
                                value={anamnesis.motivo_consulta}
                                onChange={e => setAnamnesis(prev => ({...prev, motivo_consulta: e.target.value}))}
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2.5 uppercase flex justify-between">
                                <span>Escala de Dolor (EVA) *</span>
                                <span className={`font-black ${anamnesis.escala_dolor > 7 ? 'text-red-500' : anamnesis.escala_dolor > 3 ? 'text-orange-500' : 'text-green-500'}`}>
                                    {anamnesis.escala_dolor}/10
                                </span>
                            </label>
                            <input 
                                type="range" min="0" max="10" 
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                value={anamnesis.escala_dolor}
                                onChange={e => setAnamnesis(prev => ({...prev, escala_dolor: parseInt(e.target.value)}))}
                            />
                            <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase mt-1.5">
                                <span>Sin Dolor</span>
                                <span>Moderado</span>
                                <span>Severo</span>
                            </div>
                        </div>

                        <div className="relative" ref={cie10Ref}>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase flex items-center gap-2">
                                <FaSearch size={12} className="text-gray-400" /> Diagnóstico CIE-10 (Principal) *
                            </label>
                            <div className="relative">
                                <Input 
                                    placeholder="Buscar por código o nombre..."
                                    value={cie10Search}
                                    onChange={e => handleCie10Search(e.target.value)}
                                    className="text-sm shadow-sm"
                                />
                                {anamnesis.cie10_codigo && (
                                    <FaCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                                )}
                            </div>
                            {isSearchingCie10 && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                </div>
                            )}
                             {cie10Results.length > 0 && (
                                <div className="absolute z-[60] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-2xl max-h-[220px] overflow-y-auto ring-1 ring-black ring-opacity-5 animate-slideUp">
                                    {cie10Results.map(item => (
                                        <div 
                                            key={item.codigo}
                                            onClick={() => {
                                                setAnamnesis(prev => ({...prev, cie10_codigo: item.codigo, cie10_texto: item.nombre}));
                                                setCie10Results([]);
                                                setCie10Search(`${item.codigo} - ${item.nombre}`);
                                            }}
                                            className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                                        >
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className="font-black text-blue-600 text-[10px] tracking-tight uppercase bg-blue-50 px-1.5 py-0.5 rounded">{item.codigo}</span>
                                            </div>
                                            <div className="text-xs font-medium text-gray-700 leading-tight">{item.nombre}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {cie10Search.trim().length >= 2 && !isSearchingCie10 && cie10Results.length === 0 && !anamnesis.cie10_codigo && (
                                <div className="absolute z-[60] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-4 text-center text-xs text-gray-400 animate-slideUp">
                                    No se encontraron diagnósticos clínicos.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                    <Button 
                        onClick={handleSave} 
                        loading={isSaving}
                        disabled={!anamnesis.motivo_consulta?.trim() || !anamnesis.cie10_codigo}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 px-8"
                    >
                        Guardar Obligatorios
                    </Button>
                </div>
            </div>
        </ModalBase>
    );
};
