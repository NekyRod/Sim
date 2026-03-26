-- =====================================================================
-- Migration 005: Tablas de Facturación, Tarifas y RIPS
-- =====================================================================

-- Tarifas por servicio (CUPS)
CREATE TABLE IF NOT EXISTS tarifas (
    id SERIAL PRIMARY KEY,
    codigo_cups VARCHAR(10) NOT NULL UNIQUE,
    descripcion TEXT NOT NULL,
    valor NUMERIC(12,2) NOT NULL DEFAULT 0,
    iva_porcentaje NUMERIC(4,2) NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- Facturas emitidas
CREATE TABLE IF NOT EXISTS facturas (
    id SERIAL PRIMARY KEY,
    numero_factura VARCHAR(30) UNIQUE NOT NULL,
    prefijo VARCHAR(10),
    fecha_emision TIMESTAMP NOT NULL DEFAULT NOW(),
    paciente_id INTEGER REFERENCES pacientes(id),
    profesional_id INTEGER REFERENCES profesionales(id),
    cita_id INTEGER REFERENCES citas(id),
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    iva NUMERIC(12,2) NOT NULL DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    copago NUMERIC(12,2) DEFAULT 0,
    cuota_moderadora NUMERIC(12,2) DEFAULT 0,
    regimen VARCHAR(20) DEFAULT 'particular',  -- particular, contributivo, subsidiado
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',  -- pendiente, enviada, validada, anulada
    cufe VARCHAR(100),          -- Código Único FE (DIAN)
    cuv VARCHAR(100),           -- Código Único Validación RIPS (MinSalud)
    xml_url TEXT,
    pdf_url TEXT,
    observaciones TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- Detalle de servicios facturados
CREATE TABLE IF NOT EXISTS factura_items (
    id SERIAL PRIMARY KEY,
    factura_id INTEGER NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
    codigo_cups VARCHAR(10) NOT NULL,
    descripcion TEXT NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    valor_unitario NUMERIC(12,2) NOT NULL,
    iva_porcentaje NUMERIC(4,2) NOT NULL DEFAULT 0,
    iva NUMERIC(12,2) NOT NULL DEFAULT 0,
    valor_total NUMERIC(12,2) NOT NULL
);

-- Log de RIPS enviados al MUV
CREATE TABLE IF NOT EXISTS rips_log (
    id SERIAL PRIMARY KEY,
    factura_id INTEGER REFERENCES facturas(id),
    json_rips JSONB NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'generado',  -- generado, enviado, aprobado, rechazado
    cuv VARCHAR(100),
    respuesta_muv JSONB,
    enviado_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Configuración DIAN / RIPS
CREATE TABLE IF NOT EXISTS config_facturacion (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(50) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Semilla de configuración
INSERT INTO config_facturacion (clave, valor, descripcion) VALUES
    ('nit_prestador', '', 'NIT del prestador de servicios de salud'),
    ('razon_social', '', 'Razón social del prestador'),
    ('cod_prestador', '', 'Código REPS del prestador'),
    ('prefijo_factura', 'FE', 'Prefijo de las facturas electrónicas'),
    ('consecutivo_actual', '0', 'Consecutivo actual de facturación'),
    ('resolucion_dian', '', 'Número de resolución de numeración DIAN'),
    ('fecha_resolucion', '', 'Fecha de la resolución DIAN'),
    ('rango_desde', '', 'Rango inicial autorizado'),
    ('rango_hasta', '', 'Rango final autorizado'),
    ('regimen_tributario', 'responsable_iva', 'simplificado o responsable_iva'),
    ('software_id_dian', '', 'Software ID asignado por la DIAN'),
    ('pin_dian', '', 'PIN de habilitación DIAN'),
    ('ambiente_dian', 'pruebas', 'pruebas o produccion')
ON CONFLICT (clave) DO NOTHING;

-- Tarifas CUPS semilla (odontología)
INSERT INTO tarifas (codigo_cups, descripcion, valor, iva_porcentaje) VALUES
    ('890203', 'Consulta de primera vez por odontología general', 50000, 0),
    ('890303', 'Consulta de control o seguimiento por odontología general', 35000, 0),
    ('890703', 'Consulta de urgencias por odontología general', 70000, 0)
ON CONFLICT (codigo_cups) DO NOTHING;
