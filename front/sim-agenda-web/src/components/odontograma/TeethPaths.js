// src/components/odontograma/TeethPaths.js

/**
 * Este archivo contiene los paths SVG realistas para las siluetas dentales.
 * Están diseñados con la raíz apuntando hacia arriba (Y=5) y la corona hacia abajo (Y=95).
 * 
 * - Incisivos: Raíz única recta y corona plana.
 * - Caninos: Raíz única, robusta, con corona puntiaguda.
 * - Premolares: Raíz doble/ancha, corona bicúspide.
 * - Molares: Coronas anchas con múltiples raíces (dibujadas 2-3 para impacto visual).
 */

export const TEETH_PATHS = {
    // 1 y 2 (Incisivos Central y Lateral)
    incisor: "M 50 7 C 43 7 40 25 40 45 C 40 55 34 65 34 85 C 34 92 40 96 50 96 C 60 96 66 92 66 85 C 66 65 60 55 60 45 C 60 25 57 7 50 7 Z",

    // 3 (Canino)
    canine: "M 50 4 C 41 4 38 30 38 50 C 38 60 32 70 32 85 C 32 90 44 98 50 98 C 56 98 68 90 68 85 C 68 70 62 60 62 50 C 62 30 59 4 50 4 Z",

    // 4 y 5 (Premolares)
    premolar: "M 44 10 C 38 10 36 28 36 50 C 36 60 30 70 30 88 C 30 94 38 97 50 94 C 62 97 70 94 70 88 C 70 70 64 60 64 50 C 64 28 62 10 56 10 C 51 10 50 25 50 25 C 50 25 49 10 44 10 Z",

    // 6, 7 y 8 (Molares)
    molar: "M 34 10 C 26 12 28 35 32 48 C 28 58 24 68 24 82 C 24 92 34 96 40 96 C 45 96 50 91 50 91 C 50 91 55 96 60 96 C 66 96 76 92 76 82 C 76 68 72 58 68 48 C 72 35 74 12 66 10 C 56 8 55 32 55 32 C 55 32 45 32 45 32 C 45 32 44 8 34 10 Z"
};

/**
 * Devuelve el path anatómico realista de un diente basado en el último dígito del FDI
 */
export const getAnatomicalPath = (fdiNumber) => {
    const type = fdiNumber % 10;
    if (type === 1 || type === 2) return TEETH_PATHS.incisor;
    if (type === 3) return TEETH_PATHS.canine;
    if (type === 4 || type === 5) return TEETH_PATHS.premolar;
    return TEETH_PATHS.molar; 
};
