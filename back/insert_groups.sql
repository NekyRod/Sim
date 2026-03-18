INSERT INTO permission_groups (code, name, description, active) 
VALUES 
('AGENDAS', 'Agendas', 'Gestión de Agendas Médicas', TRUE), 
('DISPONIBILIDAD', 'Disponibilidad', 'Configuración de Disponibilidad', TRUE), 
('INFORMES', 'Informes', 'Acceso a Reportes y Estadísticas', TRUE)
ON CONFLICT (code) DO NOTHING;
