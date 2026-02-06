// src/pages/Informes.jsx
export default function Informes() {
  return (
    <section id="informes-section">
      <div className="informes-container">
        <h2>Reporte Trimestral</h2>

        <div className="informes-filtros">
          <label>
            Año
            <input type="number" id="informes-anio" min="2000" max="2100" />
          </label>
          <label>
            Trimestre
            <select id="informes-trimestre">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </label>
        </div>

        <div className="informes-tabla-wrapper">
          <table className="informes-tabla">
            <thead>
              <tr>
                <th>Tipo de Documento</th>
                <th>No de Documento</th>
                <th>Nombre Paciente</th>
                <th>Fecha de Nacimiento</th>
                <th>Fecha en que asignó la cita</th>
                <th>Fecha en la que quiere el paciente</th>
                <th>Fecha en la que quedó programada la cita</th>
                <th>Diferencia entre fechas</th>
                <th>Género</th>
              </tr>
            </thead>
            <tbody id="informes-body">
              {/* datos del reporte se cargarán por API */}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
