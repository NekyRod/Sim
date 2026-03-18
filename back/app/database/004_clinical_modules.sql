
-- clinical modules: Evoluciones, Recetas, Documentos, Consultas

-- 1. Consultas de Atención
CREATE TABLE IF NOT EXISTS consultas_atencion (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id) ON DELETE CASCADE,
    profesional_id INTEGER REFERENCES profesionales(id) ON DELETE SET NULL,
    fecha_consulta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    motivo TEXT,
    enfermedad_actual TEXT,
    diagnostico_cie10_codigo TEXT,
    diagnostico_cie10_texto TEXT,
    plan_tratamiento TEXT,
    observaciones TEXT,
    registrado_por TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Evoluciones (Notas de progreso)
CREATE TABLE IF NOT EXISTS evoluciones (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id) ON DELETE CASCADE,
    profesional_id INTEGER REFERENCES profesionales(id) ON DELETE SET NULL,
    fecha_evolucion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nota TEXT NOT NULL,
    registrado_por TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Recetas (Prescripciones)
CREATE TABLE IF NOT EXISTS recetas (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id) ON DELETE CASCADE,
    profesional_id INTEGER REFERENCES profesionales(id) ON DELETE SET NULL,
    fecha_receta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    medicamentos JSONB, -- List of {nombre, dosis, frecuencia, duracion}
    indicaciones_generales TEXT,
    registrado_por TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Documentos del Paciente (RX, Consentimientos, etc)
CREATE TABLE IF NOT EXISTS paciente_documentos (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id) ON DELETE CASCADE,
    profesional_id INTEGER REFERENCES profesionales(id) ON DELETE SET NULL,
    tipo_documento TEXT, -- 'RX', 'CONSENTIMIENTO', 'RESULTADO_LAB', 'OTRO'
    nombre_archivo TEXT NOT NULL,
    url_archivo TEXT NOT NULL,
    observaciones TEXT,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registrado_por TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_consultas_atencion_modtime BEFORE UPDATE ON consultas_atencion FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_evoluciones_modtime BEFORE UPDATE ON evoluciones FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_recetas_modtime BEFORE UPDATE ON recetas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_paciente_documentos_modtime BEFORE UPDATE ON paciente_documentos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
