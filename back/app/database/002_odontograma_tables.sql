-- back/app/database/002_odontograma_tables.sql

CREATE TABLE IF NOT EXISTS procedimientos_personalizados (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- Diagnóstico, Tratamiento, Condición
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
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE RESTRICT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'Borrador', -- Borrador, Finalizado, Anulado
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS detalle_diente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    odontograma_id UUID NOT NULL REFERENCES odontograma_historial(id) ON DELETE CASCADE,
    procedimiento_id INTEGER NOT NULL REFERENCES procedimientos_personalizados(id) ON DELETE RESTRICT,
    pieza_dental INTEGER NOT NULL,
    cara VARCHAR(20) NOT NULL, -- Oclusal, Mesial, Distal, Vestibular, Lingual, Palatina, Completo
    estado_completado BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices de optimización para búsquedas rápidas en el backend
CREATE INDEX IF NOT EXISTS idx_odontograma_paciente ON odontograma_historial(paciente_id);
CREATE INDEX IF NOT EXISTS idx_odontograma_estado ON odontograma_historial(estado);
CREATE INDEX IF NOT EXISTS idx_detalle_odontograma ON detalle_diente(odontograma_id);
CREATE INDEX IF NOT EXISTS idx_detalle_pieza ON detalle_diente(pieza_dental);

-- Insertar procedimientos básicos por defecto para la paleta de herramientas
INSERT INTO procedimientos_personalizados (nombre, tipo, aplica_a_cara, aplica_diente_completo, color_hex, es_extraccion, es_borrador) 
VALUES 
    ('Sano', 'Condición', TRUE, FALSE, '#FFFFFF', FALSE, FALSE),
    ('Caries Activa', 'Diagnóstico', TRUE, FALSE, '#EF4444', FALSE, FALSE),
    ('Resina', 'Tratamiento', TRUE, FALSE, '#3B82F6', FALSE, FALSE),
    ('Amalgama', 'Tratamiento', TRUE, FALSE, '#94A3B8', FALSE, FALSE),
    ('Corona', 'Tratamiento', FALSE, TRUE, '#EAB308', FALSE, FALSE),
    ('Exodoncia', 'Tratamiento', FALSE, TRUE, '#000000', TRUE, FALSE),
    ('Implante', 'Tratamiento', FALSE, TRUE, '#10B981', FALSE, FALSE)
ON CONFLICT DO NOTHING;
