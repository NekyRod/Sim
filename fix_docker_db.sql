
-- Add missing columns to anamnesis
ALTER TABLE anamnesis ADD COLUMN IF NOT EXISTS motivo_consulta TEXT;
ALTER TABLE anamnesis ADD COLUMN IF NOT EXISTS escala_dolor INTEGER;
ALTER TABLE anamnesis ADD COLUMN IF NOT EXISTS cie10_codigo TEXT;
ALTER TABLE anamnesis ADD COLUMN IF NOT EXISTS cie10_texto TEXT;
ALTER TABLE anamnesis ADD COLUMN IF NOT EXISTS registrado_por TEXT;

-- Add UNIQUE constraint to paciente_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'idx_unique_paciente_anamnesis'
    ) THEN
        ALTER TABLE anamnesis ADD CONSTRAINT idx_unique_paciente_anamnesis UNIQUE (paciente_id);
    END IF;
END $$;

-- Also fix odontograma_historial and detalle_diente just in case
ALTER TABLE odontograma_historial ADD COLUMN IF NOT EXISTS registrado_por TEXT;
ALTER TABLE odontograma_historial ALTER COLUMN profesional_id DROP NOT NULL;

ALTER TABLE detalle_diente ADD COLUMN IF NOT EXISTS hallazgo TEXT;
ALTER TABLE detalle_diente ADD COLUMN IF NOT EXISTS plan_tratamiento TEXT;
ALTER TABLE detalle_diente ADD COLUMN IF NOT EXISTS cie10_codigo TEXT;
ALTER TABLE detalle_diente ADD COLUMN IF NOT EXISTS cie10_texto TEXT;
ALTER TABLE detalle_diente ADD COLUMN IF NOT EXISTS evolucion_porcentaje INTEGER DEFAULT 100;
