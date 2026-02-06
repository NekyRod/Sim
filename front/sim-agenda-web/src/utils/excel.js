import * as XLSX from 'xlsx';

/**
 * Exporta un array de objetos a un archivo Excel (.xlsx)
 * @param {Array} data - Los datos filtrados que se muestran en pantalla
 * @param {string} fileName - Nombre sugerido del archivo
 * @param {string} sheetName - Nombre de la hoja de cálculo
 */
export const exportToExcel = (data, fileName = 'export.xlsx', sheetName = 'Datos') => {
  if (!data || data.length === 0) {
    console.warn('No hay datos para exportar');
    return;
  }

  // Crear una nueva hoja de trabajo a partir de los datos
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Crear un nuevo libro de trabajo
  const workbook = XLSX.utils.book_new();
  
  // Añadir la hoja al libro
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Generar el archivo Excel y disparar la descarga
  // Esto activará el diálogo de "Guardar como" del navegador si el usuario lo tiene configurado
  XLSX.writeFile(workbook, fileName);
};
