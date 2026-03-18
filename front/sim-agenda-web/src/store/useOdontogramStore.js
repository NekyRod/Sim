import { create } from 'zustand';

const initialState = {}; 

export const useOdontogramStore = create((set, get) => ({
  dientes: initialState, // Estado "aplanado" (vista actual)
  sessionChanges: {},    // Cambios realizados en la sesión actual
  historialEventos: [],  // Todos los eventos para "viaje en el tiempo"
  
  // Procedimiento seleccionado: { id, nombre, color_hex, es_extraccion, es_borrador, aplica_diente_completo }
  procedimientoActivo: null,
  // Porcentaje seleccionado (100 por defecto)
  evolucionPorcentajeActivo: 100,
  
  setProcedimientoActivo: (procedimiento) => set((state) => ({ 
    procedimientoActivo: state.procedimientoActivo?.id === procedimiento?.id ? null : procedimiento 
  })),
  setEvolucionPorcentaje: (porcentaje) => set({ evolucionPorcentajeActivo: parseInt(porcentaje) || 100 }),

  // Carga el historial desde el backend y calcula el estado aplanado
  hidratarOdontograma: (timelineBackend) => {
    // Almacenamos todo el historial
    set({ historialEventos: timelineBackend });
    
    // Calculamos el estado actual (última capa)
    const flattened = get().flattenDientes(timelineBackend);
    set({ dientes: flattened, sessionChanges: {} }); // Limpiar cambios de sesión al hidratar
  },

  // Función de Oro: Aplana el historial para ver el estado actual del paciente
  flattenDientes: (eventos) => {
    const newState = {};
    
    // Los eventos vienen del backend ordenados por fecha DESC
    // Recorremos de más viejo a más nuevo para que los nuevos sobrescriban
    const sortedEvents = [...eventos].sort((a, b) => new Date(a.fecha_registro) - new Date(b.fecha_registro));

    sortedEvents.forEach(sesion => {
      sesion.dientes.forEach(detalle => {
        const { fdi, cara, procedimiento_nombre, color_hex, aplica_diente_completo, evolucion_porcentaje = 100 } = detalle;
        const pieza_dental = fdi.toString();

        if (!newState[pieza_dental]) {
          newState[pieza_dental] = { caras: {}, completo: null };
        }

        const data = { 
          id: detalle.procedimiento_id || detalle.id, 
          color_hex, 
          procedimiento_nombre,
          evolucion_porcentaje,
          hallazgo: detalle.hallazgo,
          plan_tratamiento: detalle.plan_tratamiento,
          cie10_codigo: detalle.cie10_codigo,
          cie10_texto: detalle.cie10_texto,
          fecha: sesion.fecha_registro
        };

        if (cara === 'Completo' || aplica_diente_completo) {
          newState[pieza_dental].completo = data;
        } else {
          newState[pieza_dental].caras[cara] = data;
        }
      });
    });
    return newState;
  },

  // Aplicar un procedimiento manual (UI)
  aplicarProcedimiento: (pieza_dental, cara, datosExtra = {}) => {
    const { procedimientoActivo, evolucionPorcentajeActivo } = get();
    if (!procedimientoActivo) return; 

    set((state) => {
      const piezaStr = pieza_dental.toString();
      const dienteActual = state.dientes[piezaStr] || { caras: {}, completo: null };
      
      const nuevoDetalle = {
        id: procedimientoActivo.id,
        color_hex: procedimientoActivo.color_hex,
        procedimiento_nombre: procedimientoActivo.nombre,
        evolucion_porcentaje: evolucionPorcentajeActivo,
        es_extraccion: procedimientoActivo.es_extraccion,
        ...datosExtra
      };

      // 1. REGLA: Manejo del Borrador
      let stateUpdate = {};
      
      if (procedimientoActivo.es_borrador) {
        if (cara === 'Completo') {
          stateUpdate = {
            dientes: { ...state.dientes, [piezaStr]: { ...dienteActual, completo: null } }
          };
        } else {
          const nuevasCaras = { ...dienteActual.caras };
          delete nuevasCaras[cara];
          stateUpdate = {
            dientes: { ...state.dientes, [piezaStr]: { ...dienteActual, caras: nuevasCaras } }
          };
        }
      } 
      // 2. REGLA: Diente Completo
      else if (procedimientoActivo.es_extraccion || procedimientoActivo.aplica_diente_completo || cara === 'Completo') {
        stateUpdate = {
          dientes: {
            ...state.dientes,
            [piezaStr]: { ...dienteActual, completo: nuevoDetalle }
          }
        };
      }
      // 3. REGLA: Cara Específica
      else {
        stateUpdate = {
          dientes: {
            ...state.dientes,
            [piezaStr]: {
              ...dienteActual,
              caras: { ...dienteActual.caras, [cara]: nuevoDetalle }
            }
          }
        };
      }

      // REGISTRAR CAMBIO DE SESIÓN
      const sessionUpdate = { ...state.sessionChanges };
      if (!sessionUpdate[piezaStr]) {
        sessionUpdate[piezaStr] = { caras: {}, completo: null };
      }

      if (procedimientoActivo.es_borrador) {
        if (cara === 'Completo') {
            sessionUpdate[piezaStr].completo = null;
        } else {
            // Clonamos caras para no mutar el estado anterior
            sessionUpdate[piezaStr].caras = { ...sessionUpdate[piezaStr].caras };
            delete sessionUpdate[piezaStr].caras[cara];
        }
      } else if (procedimientoActivo.es_extraccion || procedimientoActivo.aplica_diente_completo || cara === 'Completo') {
        const fullDienteDetail = {
           ...nuevoDetalle,
           aplica_diente_completo: true
        };
        sessionUpdate[piezaStr].completo = fullDienteDetail;
        sessionUpdate[piezaStr].caras = {};
      } else {
        // Clonamos caras para no mutar el estado anterior
        sessionUpdate[piezaStr].caras = { 
          ...sessionUpdate[piezaStr].caras,
          [cara]: nuevoDetalle 
        };
        sessionUpdate[piezaStr].completo = null;
      }

      return { ...stateUpdate, sessionChanges: sessionUpdate };
    });
  }
}));
