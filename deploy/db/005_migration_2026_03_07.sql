-- Migration 2026-03-07: Odontograma, Anamnesis extensions, Clinical modules
-- Idempotent — safe to run multiple times

-- ── Anamnesis: new columns ──
ALTER TABLE anamnesis ADD COLUMN IF NOT EXISTS motivo_consulta TEXT;
ALTER TABLE anamnesis ADD COLUMN IF NOT EXISTS escala_dolor INTEGER DEFAULT 0;
ALTER TABLE anamnesis ADD COLUMN IF NOT EXISTS cie10_codigo TEXT;
ALTER TABLE anamnesis ADD COLUMN IF NOT EXISTS cie10_texto TEXT;
ALTER TABLE anamnesis ADD COLUMN IF NOT EXISTS registrado_por VARCHAR(100);

-- ── Odontograma ──
CREATE TABLE IF NOT EXISTS procedimientos_personalizados (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    aplica_a_cara BOOLEAN DEFAULT TRUE,
    aplica_diente_completo BOOLEAN DEFAULT FALSE,
    color_hex VARCHAR(20) DEFAULT '#FFFFFF',
    es_extraccion BOOLEAN DEFAULT FALSE,
    es_borrador BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS odontograma_historial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    profesional_id INTEGER REFERENCES profesionales(id) ON DELETE RESTRICT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'Borrador',
    registrado_por VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS detalle_diente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    odontograma_id UUID NOT NULL REFERENCES odontograma_historial(id) ON DELETE CASCADE,
    procedimiento_id INTEGER NOT NULL REFERENCES procedimientos_personalizados(id) ON DELETE RESTRICT,
    pieza_dental INTEGER NOT NULL,
    cara VARCHAR(20) NOT NULL,
    estado_completado BOOLEAN DEFAULT TRUE,
    evolucion_porcentaje INTEGER DEFAULT 100,
    hallazgo TEXT,
    plan_tratamiento TEXT,
    cie10_codigo TEXT,
    cie10_texto TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_odontograma_paciente ON odontograma_historial(paciente_id);
CREATE INDEX IF NOT EXISTS idx_odontograma_estado ON odontograma_historial(estado);
CREATE INDEX IF NOT EXISTS idx_detalle_odontograma ON detalle_diente(odontograma_id);
CREATE INDEX IF NOT EXISTS idx_detalle_pieza ON detalle_diente(pieza_dental);

INSERT INTO procedimientos_personalizados (nombre, tipo, aplica_a_cara, aplica_diente_completo, color_hex, es_extraccion, es_borrador)
VALUES
    ('Sano',          'Condicion',    TRUE,  FALSE, '#FFFFFF', FALSE, FALSE),
    ('Caries Activa', 'Diagnostico',  TRUE,  FALSE, '#EF4444', FALSE, FALSE),
    ('Resina',        'Tratamiento',  TRUE,  FALSE, '#3B82F6', FALSE, FALSE),
    ('Amalgama',      'Tratamiento',  TRUE,  FALSE, '#94A3B8', FALSE, FALSE),
    ('Corona',        'Tratamiento',  FALSE, TRUE,  '#EAB308', FALSE, FALSE),
    ('Exodoncia',     'Tratamiento',  FALSE, TRUE,  '#000000', TRUE,  FALSE),
    ('Implante',      'Tratamiento',  FALSE, TRUE,  '#10B981', FALSE, FALSE)
ON CONFLICT DO NOTHING;

-- ── Clinical Modules ──
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

CREATE TABLE IF NOT EXISTS evoluciones (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id) ON DELETE CASCADE,
    profesional_id INTEGER REFERENCES profesionales(id) ON DELETE SET NULL,
    fecha_evolucion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nota TEXT NOT NULL DEFAULT '',
    registrado_por TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recetas (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id) ON DELETE CASCADE,
    profesional_id INTEGER REFERENCES profesionales(id) ON DELETE SET NULL,
    fecha_receta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    medicamentos JSONB,
    indicaciones_generales TEXT,
    registrado_por TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS paciente_documentos (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id) ON DELETE CASCADE,
    profesional_id INTEGER REFERENCES profesionales(id) ON DELETE SET NULL,
    tipo_documento TEXT,
    nombre_archivo TEXT NOT NULL DEFAULT '',
    url_archivo TEXT NOT NULL DEFAULT '',
    observaciones TEXT,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registrado_por TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
