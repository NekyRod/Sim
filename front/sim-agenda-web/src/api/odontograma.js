import { apiFetch } from "./client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

export const odontogramaApi = {
  // Obtener los procedimientos configurados en admin
  getProcedimientos: () => apiFetch(`${BACKEND_URL}/odontogramas/procedimientos`, {
    method: 'GET'
  }),

  // Obtener historial de evolución del paciente
  getTimeline: (pacienteId) => apiFetch(`${BACKEND_URL}/odontogramas/paciente/${pacienteId}/timeline`, {
    method: 'GET'
  }),

  // Autoguardado silencioso del borrador (Debounced PUT request)
  autoguardarDraft: (evaluacionId, data) => apiFetch(`${BACKEND_URL}/odontogramas/draft/${evaluacionId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  // Cierre final del odontograma (POST)
  finalizarEvaluacion: (evaluacionId) => apiFetch(`${BACKEND_URL}/odontogramas/${evaluacionId}/finalizar`, {
    method: 'POST'
  }),

  // Eliminar registro del historial (DELETE)
  eliminarOdontograma: (evaluacionId) => apiFetch(`${BACKEND_URL}/odontogramas/${evaluacionId}`, {
    method: 'DELETE'
  }),

  // Buscar códigos CIE-10 (GET)
  searchCie10: (query) => apiFetch(`${BACKEND_URL}/odontogramas/cie10/search?q=${query}`, {
    method: 'GET'
  }),

  // Obtener anamnesis para validación
  getAnamnesis: (pacienteId) => apiFetch(`${BACKEND_URL}/pacientes/${pacienteId}/anamnesis`, {
    method: 'GET'
  }),

  // Guardar anamnesis desde el odontograma
  saveAnamnesis: (pacienteId, data) => apiFetch(`${BACKEND_URL}/pacientes/${pacienteId}/anamnesis`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
};
