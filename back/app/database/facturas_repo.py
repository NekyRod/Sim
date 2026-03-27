# app/database/facturas_repo.py
from psycopg2.extras import RealDictCursor
from app.database.connection import get_db_connection


def _get_config_value(cur, clave: str) -> str:
    cur.execute("SELECT valor FROM config_facturacion WHERE clave = %s", (clave,))
    row = cur.fetchone()
    return row['valor'] if row else ''


def _increment_consecutivo(cur) -> int:
    """Lee e incrementa el consecutivo atómicamente (dentro de la misma conexión/transacción)."""
    cur.execute(
        "SELECT COALESCE(valor, '0')::int AS n FROM config_facturacion WHERE clave = 'consecutivo_actual' FOR UPDATE"
    )
    row = cur.fetchone()
    nuevo = (row['n'] if row else 0) + 1
    cur.execute(
        "UPDATE config_facturacion SET valor = %s, updated_at = NOW() WHERE clave = 'consecutivo_actual'",
        (str(nuevo),)
    )
    return nuevo


def create_factura(data: dict) -> dict:
    """
    data keys:
      paciente_id, profesional_id, cita_id (opcional),
      regimen ('particular'|'contributivo'|'subsidiado'),
      copago, cuota_moderadora, observaciones,
      items: [{ codigo_cups, descripcion, cantidad, valor_unitario, iva_porcentaje }]
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # 1. Leer config
            prefijo = _get_config_value(cur, 'prefijo_factura') or 'FE'
            consecutivo = _increment_consecutivo(cur)
            numero_factura = f"{prefijo}-{consecutivo}"

            # 2. Calcular totales
            items = data.get('items', [])
            subtotal = 0.0
            iva_total = 0.0
            for item in items:
                qty = item.get('cantidad', 1)
                val = float(item.get('valor_unitario', 0))
                iva_pct = float(item.get('iva_porcentaje', 0))
                item_subtotal = qty * val
                item_iva = item_subtotal * iva_pct / 100
                item['iva'] = round(item_iva, 2)
                item['valor_total'] = round(item_subtotal + item_iva, 2)
                subtotal += item_subtotal
                iva_total += item_iva

            copago = float(data.get('copago', 0) or 0)
            cuota_moderadora = float(data.get('cuota_moderadora', 0) or 0)
            total = round(subtotal + iva_total, 2)

            # 3. Insertar factura
            cur.execute(
                """
                INSERT INTO facturas (
                    numero_factura, prefijo, paciente_id, profesional_id, cita_id,
                    subtotal, iva, total, copago, cuota_moderadora,
                    regimen, estado, observaciones
                )
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'pendiente',%s)
                RETURNING *
                """,
                (
                    numero_factura, prefijo,
                    data.get('paciente_id'), data.get('profesional_id'), data.get('cita_id'),
                    round(subtotal, 2), round(iva_total, 2), total,
                    copago, cuota_moderadora,
                    data.get('regimen', 'particular'),
                    data.get('observaciones')
                )
            )
            factura = dict(cur.fetchone())
            factura_id = factura['id']

            # 4. Insertar items
            for item in items:
                cur.execute(
                    """
                    INSERT INTO factura_items
                        (factura_id, codigo_cups, descripcion, cantidad, valor_unitario, iva_porcentaje, iva, valor_total)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                    """,
                    (
                        factura_id,
                        item['codigo_cups'], item['descripcion'],
                        item.get('cantidad', 1),
                        float(item['valor_unitario']),
                        float(item.get('iva_porcentaje', 0)),
                        item['iva'], item['valor_total']
                    )
                )

        conn.commit()
        return factura
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def get_facturas(paciente_id=None, estado=None, fecha_desde=None, fecha_hasta=None, limit=100):
    conn = get_db_connection()
    try:
        with conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
            conditions = []
            params = []
            if paciente_id:
                conditions.append("f.paciente_id = %s")
                params.append(paciente_id)
            if estado:
                conditions.append("f.estado = %s")
                params.append(estado)
            if fecha_desde:
                conditions.append("f.fecha_emision >= %s")
                params.append(fecha_desde)
            if fecha_hasta:
                conditions.append("f.fecha_emision <= %s")
                params.append(fecha_hasta)

            where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
            cur.execute(
                f"""
                SELECT f.*,
                       p.nombre_completo AS paciente_nombre,
                       p.numero_identificacion AS paciente_doc,
                       pr.nombre_completo AS profesional_nombre
                FROM facturas f
                LEFT JOIN pacientes p ON f.paciente_id = p.id
                LEFT JOIN profesionales pr ON f.profesional_id = pr.id
                {where}
                ORDER BY f.fecha_emision DESC
                LIMIT %s
                """,
                params + [limit]
            )
            return [dict(r) for r in cur.fetchall()]
    finally:
        conn.close()


def get_factura_by_id(factura_id: int):
    conn = get_db_connection()
    try:
        with conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT f.*,
                       p.nombre_completo AS paciente_nombre,
                       p.numero_identificacion AS paciente_doc,
                       pr.nombre_completo AS profesional_nombre
                FROM facturas f
                LEFT JOIN pacientes p ON f.paciente_id = p.id
                LEFT JOIN profesionales pr ON f.profesional_id = pr.id
                WHERE f.id = %s
                """,
                (factura_id,)
            )
            factura = cur.fetchone()
            if not factura:
                return None
            factura = dict(factura)

            cur.execute(
                "SELECT * FROM factura_items WHERE factura_id = %s ORDER BY id",
                (factura_id,)
            )
            factura['items'] = [dict(r) for r in cur.fetchall()]
            return factura
    finally:
        conn.close()


def anular_factura(factura_id: int) -> int:
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute(
                "UPDATE facturas SET estado = 'anulada', updated_at = NOW() WHERE id = %s AND estado != 'anulada'",
                (factura_id,)
            )
            return cur.rowcount
    finally:
        conn.close()
