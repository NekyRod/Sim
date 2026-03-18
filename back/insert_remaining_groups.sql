INSERT INTO permission_groups (code, name, description, active) 
VALUES 
('TIPOS_SERVICIO', 'Tipos de Servicio', 'Gestión de tipos de servicios médicos', TRUE), 
('ESPECIALIDADES', 'Especialidades', 'Gestión de especialidades médicas', TRUE), 
('PBS', 'Tipos PBS', 'Gestión de tipos de beneficios (PBS)', TRUE), 
('FESTIVOS', 'Festivos', 'Calendario de días no laborales', TRUE), 
('IDENTIFICACION', 'Tipos de Identificación', 'Parámetros de documentos legales', TRUE), 
('CIUDADES', 'Ciudades', 'Maestro de ciudades y departamentos', TRUE), 
('SISTEMA', 'Sistema', 'Configuraciones técnicas (SMTP, etc.)', TRUE), 
('USUARIOS', 'Usuarios', 'Gestión de usuarios y accesos', TRUE)
ON CONFLICT (code) DO NOTHING;
