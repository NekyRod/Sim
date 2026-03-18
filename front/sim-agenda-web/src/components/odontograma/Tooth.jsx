import React, { memo } from 'react';
import { useOdontogramStore } from '../../store/useOdontogramStore';
import { getAnatomicalPath } from './TeethPaths';

const AnatomicalTooth = ({ fdiNumber, isLowerJaw, rootColor, isCompleto, esExtraccion, procedimientoNombre, evolucion = 100, onClick }) => {
  const path = getAnatomicalPath(fdiNumber);
  
  // Estilos y resaltes al estilo Dentalink
  const strokeColor = "#a1a1aa"; // Borde gris suave por defecto
  // Si hay color de hallazgo activo, colorea tenuamente el diente anatómico (Fill) y resalta el borde
  const fillColor = rootColor ? rootColor : "transparent";
  const currentStroke = rootColor ? rootColor : strokeColor;

  // Opacidad base (menos opaco si evolución es baja)
  const baseOpac = isCompleto ? 0.3 : (rootColor ? 0.15 : 0);
  const fillOpacity = evolucion < 100 ? (baseOpac * (evolucion / 100)).toString() : baseOpac.toString();
  
  // Las siluetas base están dibujadas con Corona abajo y Raíz arriba (Maxilar Superior).
  // Para el maxilar inferior, debemos rotarlas 180°.
  const transform = isLowerJaw ? "rotate(180 50 50)" : "";

  // Acrónimo del procedimiento (ej: Prótesis Fija -> PF)
  const getAcronym = (name) => {
    if (!name) return "";
    return name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <div className="relative cursor-pointer" onClick={onClick}>
      <svg 
        viewBox="0 0 100 100" 
        className="w-10 h-16 transition-all duration-300 ease-in-out hover:brightness-95 drop-shadow-sm"
      >
        <path 
          d={path} 
          stroke={currentStroke} 
          strokeWidth="2.5" 
          fill={fillColor}
          fillOpacity={fillOpacity}
          transform={transform}
          strokeLinejoin="round"
        />
        
        {/* Marcador Circulo + Badge si es Diente Completo (Ej. Corona, Implante) y NO es exodoncia */}
        {isCompleto && !esExtraccion && (
          <circle cx="50" cy="50" r="48" fill="none" stroke={rootColor || "#3B82F6"} strokeWidth="3" />
        )}

        {/* Marcador X para Exodoncias */}
        {isCompleto && esExtraccion && (
          <path 
            d="M 20 20 L 80 80 M 80 20 L 20 80" 
            stroke={rootColor || "#EF4444"} 
            strokeWidth="8" 
            fill="none" 
            strokeLinecap="round"
          />
        )}
      </svg>
      
      {/* Badge acrónimo del procedimiento (Ej: 'PR') visual estilo Dentalink */}
      {isCompleto && !esExtraccion && procedimientoNombre && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        >
          <span 
            className="text-[9px] font-black tracking-tighter decoration-clone drop-shadow-md text-white px-0.5 rounded"
            style={{ 
              backgroundColor: rootColor || 'transparent',
              textShadow: '0px 1px 2px rgba(0,0,0,0.8)'
            }}
          >
            {getAcronym(procedimientoNombre)}
          </span>
          {evolucion < 100 && (
            <span className="text-[8px] font-black text-white bg-black/60 px-1 rounded-sm mt-0.5">
              {evolucion}%
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const ToothComponent = ({ fdiNumber, isLowerJaw = false, onSurfaceClick }) => {
  // ⚡ SELECCIÓN ESTRICTA: Solo suscribe este componente a SU pieza dental.
  const dienteData = useOdontogramStore((state) => state.dientes[fdiNumber]);
  // Ya no aplicamos directo, notificamos al padre (Board) para que abra el MicroForm
  // const aplicarProcedimiento = useOdontogramStore((state) => state.aplicarProcedimiento);

  const caras = dienteData?.caras || {};
  const completo = dienteData?.completo || null;

  const handleSurfaceClick = (cara) => {
    if (onSurfaceClick) {
      onSurfaceClick(fdiNumber, cara);
    }
  };

  // Nomenclatura ajustada según maxilar
  const topSurface = isLowerJaw ? 'Lingual' : 'Vestibular';
  const bottomSurface = isLowerJaw ? 'Vestibular' : 'Palatina';

  // Lógica Clínica: Orientación Mesial/Distal
  const cuadrante = Math.floor(fdiNumber / 10);
  const esLadoDerechoPaciente = cuadrante === 1 || cuadrante === 4;

  const leftSurface = esLadoDerechoPaciente ? 'Distal' : 'Mesial';
  const rightSurface = esLadoDerechoPaciente ? 'Mesial' : 'Distal';

  // Geometría SVG Circular (Dentalink Style)
  // R = 45, r = 20, Centro = 50,50
  const TopFacePath = "M 18.18 18.18 A 45 45 0 0 1 81.82 18.18 L 64.14 35.86 A 20 20 0 0 0 35.86 35.86 Z";
  const RightFacePath = "M 81.82 18.18 A 45 45 0 0 1 81.82 81.82 L 64.14 64.14 A 20 20 0 0 0 64.14 35.86 Z";
  const BottomFacePath = "M 81.82 81.82 A 45 45 0 0 1 18.18 81.82 L 35.86 64.14 A 20 20 0 0 0 64.14 64.14 Z";
  const LeftFacePath = "M 18.18 81.82 A 45 45 0 0 1 18.18 18.18 L 35.86 35.86 A 20 20 0 0 0 35.86 64.14 Z";

  const baseSVGClass = "stroke-[#64748b] stroke-[2.5] hover:brightness-90 transition-all cursor-pointer";
  const defaultFillColor = "transparent"; // Blanco/Transparente por defecto

  const isCompleto = completo !== null;
  // Extraemos si el procedimiento global de diente completo es una exodoncia (si no, asumimos que no, o lo buscamos del store real)
  // Como Pydantic y el backend mandan los parámetros aplanados `es_extraccion`, lo leemos de allí si es_extraccion existe
  // En `useOdontogramStore.js`, enviamos o leemos los ids. Si es DB, viene `es_extraccion`. Si es front activo, viene del store.
  // En useOdontogramStore, cuando "aplicarProcedimiento" se llama, guardamos todo como isCompleto (pero en el store se guarda `es_extraccion` si lo inyectamos). 
  // Intentaremos derivarlo. Si es azul, probablemente no es extraccion.
  // Para asegurar exactitud visual:
  const rootColor = isCompleto 
    ? completo.color_hex 
    : (Object.keys(caras).length > 0 ? Object.values(caras)[0].color_hex : null);
    
  // Vamos a usar la herramienta del API o Zustand para inferir. Pero si no lo tenemos a la mano, 
  // Asumiremos que Exodoncia = Color Negro u oscuro (#000000) o que la data `es_extraccion` existe en el objeto `completo`
  // Nota: Deberías modificar `useOdontogramStore.js` para que guarde `es_extraccion` dentro de `completo`
  const esExtraccion = isCompleto && (completo?.color_hex === '#000000' || completo?.es_extraccion);

  const renderFaces = () => {
    if (isCompleto) {
      // Si el diente está completo (Y NO es exodoncia), Dentalink a veces pinta todo el círculo de un color,
      // Pero mantendremos el componente de Diente Circulo inactivo / sombreado o lo ocultamos si es exodoncia.
      const evoCompl = completo?.evolucion_porcentaje || 100;
      return (
        <svg viewBox="0 0 100 100" className="w-[42px] h-[42px] cursor-pointer drop-shadow-sm" onClick={() => handleSurfaceClick('Completo')}>
          <circle cx="50" cy="50" r="45" fill={rootColor} fillOpacity={evoCompl < 100 ? "0.2" : "0.4"} stroke={rootColor} strokeWidth="3" />
          {esExtraccion && (
            <path d="M 20 20 L 80 80 M 80 20 L 20 80" stroke="#EF4444" strokeWidth="8" strokeLinecap="round" />
          )}
          {evoCompl < 100 && !esExtraccion && (
             <text x="50" y="55" fontSize="30" fontWeight="bold" textAnchor="middle" fill={rootColor} opacity="0.8">
               {evoCompl}%
             </text>
          )}
        </svg>
      );
    }
    
    // Gráfico de Oclusales Estilo Circular
    return (
      <svg viewBox="0 0 100 100" className="w-[42px] h-[42px] drop-shadow-sm">
        {/* Borde circular base para que se vea la silueta completa siempre */}
        <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="1" />
        
        {/* Top Face */}
        <path d={TopFacePath} fill={caras[topSurface]?.color_hex || defaultFillColor} className={baseSVGClass} onClick={() => handleSurfaceClick(topSurface)} />
        {/* Bottom Face */}
        <path d={BottomFacePath} fill={caras[bottomSurface]?.color_hex || defaultFillColor} className={baseSVGClass} onClick={() => handleSurfaceClick(bottomSurface)} />
        {/* Left Face */}
        <path d={LeftFacePath} fill={caras[leftSurface]?.color_hex || defaultFillColor} className={baseSVGClass} onClick={() => handleSurfaceClick(leftSurface)} />
        {/* Right Face */}
        <path d={RightFacePath} fill={caras[rightSurface]?.color_hex || defaultFillColor} className={baseSVGClass} onClick={() => handleSurfaceClick(rightSurface)} />
        {/* Center Face (Oclusal) */}
        <circle cx="50" cy="50" r="20" fill={caras['Oclusal']?.color_hex || defaultFillColor} className={baseSVGClass} onClick={() => handleSurfaceClick('Oclusal')} />
      </svg>
    );
  };

  return (
    <div className="flex flex-col items-center group relative gap-2 w-14 pb-2">
      {/* Tooltip Dinámico */}
      {(isCompleto || Object.keys(caras).length > 0) && (
        <div className="absolute z-20 top-1/2 left-full -translate-y-1/2 ml-2 w-max text-[11px] hidden flex-col group-hover:flex bg-gray-800 text-white px-2 py-1.5 rounded shadow-lg whitespace-nowrap opacity-95 pointer-events-none">
          {isCompleto 
            ? <span><b className="text-gray-400 mr-1">Diente:</b> {completo.procedimiento_nombre}</span>
            : Object.entries(caras).map(([c, val]) => (
                <span key={c}><b className="text-gray-400 mr-1">{c}:</b> {val.procedimiento_nombre}</span>
              ))
          }
        </div>
      )}
      
      {/* Maxilar Superior: Dibujo Anatómico arriba */}
      {!isLowerJaw && (
        <AnatomicalTooth 
          fdiNumber={fdiNumber} 
          isLowerJaw={false} 
          rootColor={rootColor} 
          isCompleto={isCompleto} 
          esExtraccion={esExtraccion}
          procedimientoNombre={completo?.procedimiento_nombre}
          evolucion={completo?.evolucion_porcentaje || 100}
          onClick={() => handleSurfaceClick('Completo')} 
        />
      )}
      
      {/* Esquema Circular (Dentalink Style) */}
      <div className="flex flex-col items-center gap-1.5">
        {!isLowerJaw && <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-1.5 rounded">{fdiNumber}</span>}
        {renderFaces()}
        {isLowerJaw && <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-1.5 rounded">{fdiNumber}</span>}
      </div>

      {/* Maxilar Inferior: Dibujo Anatómico abajo */}
      {isLowerJaw && (
        <AnatomicalTooth 
          fdiNumber={fdiNumber} 
          isLowerJaw={true} 
          rootColor={rootColor} 
          isCompleto={isCompleto} 
          esExtraccion={esExtraccion}
          procedimientoNombre={completo?.procedimiento_nombre}
          evolucion={completo?.evolucion_porcentaje || 100}
          onClick={() => handleSurfaceClick('Completo')} 
        />
      )}
    </div>
  );
};

export const Tooth = memo(ToothComponent);
