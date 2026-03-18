-- back/app/database/003_flexible_session_identity.sql

-- 1. Odontograma Historial: Allow NULL profesional_id and add registrado_por
ALTER TABLE odontograma_historial ALTER COLUMN profesional_id DROP NOT NULL;
ALTER TABLE odontograma_historial ADD COLUMN IF NOT EXISTS registrado_por VARCHAR(100);

-- 2. Anamnesis: Add registrado_por column
ALTER TABLE anamnesis ADD COLUMN IF NOT EXISTS registrado_por VARCHAR(100);
