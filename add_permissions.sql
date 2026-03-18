
-- Insert new permission groups
INSERT INTO permission_groups (code, name, description) VALUES
('CONSULTA', 'Consulta de Atención', 'Gestión de la consulta y motivo de atención'),
('EVOLUCIONES', 'Evoluciones Clínicas', 'Notas de evolución del tratamiento'),
('ANAMNESIS', 'Ficha Anamnesis', 'Antecedentes y alertas médicas'),
('ODONTOGRAMA', 'Odontograma', 'Esquema dental y hallazgos clínicos'),
('RX_DOCUMENTOS', 'Rx y Documentos', 'Imágenes diagnósticas y archivos del paciente'),
('RECETAS', 'Recetas Médicas', 'Generación de fórmulas y recetas'),
('CONSENTIMIENTOS', 'Consentimientos', 'Formatos de consentimiento informado')
ON CONFLICT (code) DO NOTHING;

-- Assign all actions (view=1, create=2, edit=3, delete=4) to Administrador (id=1)
INSERT INTO role_permissions (role_id, permission_group_id, action_id)
SELECT 1, pg.id, a.id
FROM permission_groups pg
CROSS JOIN actions a
WHERE pg.code IN ('CONSULTA', 'EVOLUCIONES', 'ANAMNESIS', 'ODONTOGRAMA', 'RX_DOCUMENTOS', 'RECETAS', 'CONSENTIMIENTOS')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = 1 
    AND rp.permission_group_id = pg.id 
    AND rp.action_id = a.id
);
