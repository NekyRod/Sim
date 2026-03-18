import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client';
import { showToast } from '../../utils/ui';
import { Input, Select, Button, Textarea } from '../../components/ui';
import { FaUserShield } from 'react-icons/fa';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const initForm = {
  id: null,
  tipo_identificacion: '',
  numero_identificacion: '',
  nombre_completo: '',
  telefono_fijo: '',
  telefono_celular: '',
  segundo_telefono_celular: '',
  titular_segundo_celular: '',
  correo_electronico: '',
  direccion: '',
  lugar_residencia: '',
  fecha_nacimiento: '',
  // Campos del acompañante
  tipo_doc_acompanante: '',
  nombre_acompanante: '',
  parentesco_acompanante: '',
};

export default function PatientForm({ 
  initialData, 
  onSuccess, 
  onCancel, 
  ismodal = false // Para ajustar estilos si es necesario
}) {
  const [form, setForm] = useState(initForm);
  const [tiposIdentificacion, setTiposIdentificacion] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [edad, setEdad] = useState(null);
  const [mostrarCamposAcompanante, setMostrarCamposAcompanante] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cargar catálogos
  useEffect(() => {
    cargarCatalogos();
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    if (initialData) {
      setForm(prev => ({ ...prev, ...initialData }));
    } else {
      setForm(initForm);
    }
  }, [initialData]);

  // Calcular edad
  useEffect(() => {
    if (form.fecha_nacimiento) {
      setEdad(calcularEdad(form.fecha_nacimiento));
    } else {
      setEdad(null);
    }
  }, [form.fecha_nacimiento]);

  // Mostrar campos acompañante (Lógica robusta)
  useEffect(() => {
    const tipo = (form.tipo_identificacion || '').trim().toUpperCase();
    const codigosMenores = ['RC', 'TI', 'NUIP', 'R.C.', 'T.I.'];

    if (codigosMenores.includes(tipo)) {
      setMostrarCamposAcompanante(true);
    } else {
      setMostrarCamposAcompanante(false);
      // Solo limpiar si el usuario cambia el tipo, no al cargar
      if (!initialData || (initialData.tipo_identificacion !== form.tipo_identificacion)) {
         // Opcional: limpiar
      }
    }
  }, [form.tipo_identificacion]);

  async function cargarCatalogos() {
    try {
      const [respTipos, respCiudades] = await Promise.all([
        apiFetch(`${BACKEND_URL}/tiposidentificacion/`),
        apiFetch(`${BACKEND_URL}/ciudadesresidencia/`)
      ]);
      setTiposIdentificacion(respTipos.data || []);
      setCiudades(respCiudades.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  function calcularEdad(fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad;
  }

  function validarEdadYTipoDocumento() {
    if (!form.fecha_nacimiento || !form.tipo_identificacion) return true;
    const edadPaciente = calcularEdad(form.fecha_nacimiento);
    const tipo = (form.tipo_identificacion || '').trim().toUpperCase();
    if (edadPaciente >= 0 && edadPaciente <= 6 && !['RC', 'NUIP', 'R.C.'].includes(tipo)) {
      showToast('Menores de 6 años deben tener Registro Civil (RC/NUIP)', 'error');
      return false;
    }
    if (edadPaciente >= 7 && edadPaciente <= 17 && !['TI', 'T.I.'].includes(tipo)) {
      showToast('Menores de 7 a 17 años deben tener Tarjeta de Identidad (TI)', 'error');
      return false;
    }
    return true;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.tipo_identificacion || !form.numero_identificacion || !form.nombre_completo) {
      showToast('Campos obligatorios incompletos', 'error');
      return;
    }
    if (!validarEdadYTipoDocumento()) return;

    if (mostrarCamposAcompanante) {
      if (!form.tipo_doc_acompanante || !form.nombre_acompanante || !form.parentesco_acompanante) {
        showToast('Datos del acompañante incompletos', 'error');
        return;
      }
    }

    setLoading(true);
    try {
      if (form.id) {
        await apiFetch(`${BACKEND_URL}/pacientes/${form.id}`, { method: 'PUT', body: JSON.stringify(form) });
        showToast('Paciente actualizado correctamente');
      } else {
        await apiFetch(`${BACKEND_URL}/pacientes/`, { method: 'POST', body: JSON.stringify(form) });
        showToast('Paciente creado correctamente');
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <Select
            label="Tipo Identificación *"
            name="tipo_identificacion"
            value={form.tipo_identificacion}
            onChange={handleChange}
            options={[{value:'', label:'Seleccione...'}, ...tiposIdentificacion.map(t => ({value:t.codigo, label:t.nombre}))]}
            required
         />
         <Input
            label="Número Identificación *"
            name="numero_identificacion"
            value={form.numero_identificacion}
            onChange={handleChange}
            required
         />
         <Input
            label="Nombre Completo *"
            name="nombre_completo"
            value={form.nombre_completo}
            onChange={handleChange}
            required
         />
         <Input
            label="Fecha Nacimiento"
            type="date"
            name="fecha_nacimiento"
            value={form.fecha_nacimiento || ''}
            onChange={handleChange}
            helper={edad !== null ? `${edad} años` : ''}
         />
         <Input
            label="Celular"
            type="tel"
            name="telefono_celular"
            value={form.telefono_celular || ''}
            onChange={handleChange}
         />
         <Input
            label="Teléfono Fijo"
            type="tel"
            name="telefono_fijo"
            value={form.telefono_fijo || ''}
            onChange={handleChange}
         />
         <Input
            label="Email"
            type="email"
            name="correo_electronico"
            value={form.correo_electronico || ''}
            onChange={handleChange}
         />
         <Select
            label="Ciudad Residencia"
            name="lugar_residencia"
            value={form.lugar_residencia || ''}
            onChange={handleChange}
            options={[{value:'', label:'Seleccione...'}, ...ciudades.map(c => ({value:c.nombre, label:c.nombre}))]}
         />
         <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2">
             <Textarea
                label="Dirección"
                name="direccion"
                value={form.direccion || ''}
                onChange={handleChange}
                rows={1}
             />
           </div>
           <Input
              label="Segundo Celular (Opcional)"
              name="segundo_telefono_celular"
              value={form.segundo_telefono_celular || ''}
              onChange={handleChange}
           />
           <Input
              label="Titular Segundo Celular"
              name="titular_segundo_celular"
              value={form.titular_segundo_celular || ''}
              onChange={handleChange}
              placeholder="Ej: Esposo, Madre..."
           />
         </div>
      </div>

      {mostrarCamposAcompanante && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-100 bg-blue-50/50 p-4 rounded-lg">
           <div className="md:col-span-3 flex items-center gap-2 text-blue-800 font-semibold mb-2">
             <FaUserShield /> Datos del Acompañante
           </div>
           <Select
              label="Tipo Doc Acompañante *"
              name="tipo_doc_acompanante"
              value={form.tipo_doc_acompanante || ''}
              onChange={handleChange}
              options={[{value:'', label:'Seleccione...'}, ...tiposIdentificacion.filter(t => t.codigo!=='RC' && t.codigo!=='TI').map(t => ({value:t.codigo, label:t.nombre}))]}
              required
           />
           <Input
              label="Nombre Acompañante *"
              name="nombre_acompanante"
              value={form.nombre_acompanante || ''}
              onChange={handleChange}
              required
           />
           <Input
              label="Parentesco *"
              name="parentesco_acompanante"
              value={form.parentesco_acompanante || ''}
              onChange={handleChange}
              required
           />
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
         {onCancel && (
           <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
             Cancelar
           </Button>
         )}
         <Button type="submit" variant="primary" disabled={loading}>
           {loading ? 'Guardando...' : (form.id ? 'Actualizar Datos' : 'Guardar Paciente')}
         </Button>
      </div>
    </form>
  );
}
