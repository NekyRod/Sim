from app.database.connection import get_db_connection
import json
from datetime import datetime

def safe_json_loads(val):
    if not val:
        return {}
    if isinstance(val, dict):
        return val
    try:
        return json.loads(val)
    except (json.JSONDecodeError, TypeError):
        return {}

def safe_isoformat(val):
    if hasattr(val, 'isoformat'):
        return val.isoformat()
    return str(val) if val else None

def create_session(patient_id: int = None) -> int:
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                INSERT INTO chat_sessions (patient_id, status, current_flow, current_step, context)
                VALUES (%s, 'bot', 'MAIN_MENU', 'INITIAL', '{}')
                RETURNING id
            """, (patient_id,))
            session_id = cur.fetchone()[0]
            conn.commit()
            return session_id
    finally:
        conn.close()

def get_active_session(patient_id: int):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT id, patient_id, status, current_flow, current_step, context, assigned_user_id
                FROM chat_sessions
                WHERE patient_id = %s AND status != 'closed'
                ORDER BY created_at DESC
                LIMIT 1
            """, (patient_id,))
            row = cur.fetchone()
            if row:
                ctx = safe_json_loads(row[5])
                return {
                    "id": row[0],
                    "patient_id": row[1],
                    "status": row[2],
                    "current_flow": row[3],
                    "current_step": row[4],
                    "context": ctx,
                    "assigned_user_id": row[6]
                }
            return None
    finally:
        conn.close()

def get_session(session_id: int):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT id, patient_id, status, current_flow, current_step, context, assigned_user_id, created_at
                FROM chat_sessions
                WHERE id = %s
            """, (session_id,))
            row = cur.fetchone()
            if row:
                ctx = safe_json_loads(row[5])
                return {
                    "id": row[0],
                    "patient_id": row[1],
                    "status": row[2],
                    "current_flow": row[3],
                    "current_step": row[4],
                    "context": ctx,
                    "assigned_user_id": row[6],
                    "created_at": safe_isoformat(row[7])
                }
            return None
    finally:
        conn.close()

def update_session_state(session_id: int, flow: str, step: str, context: dict, status: str = None):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            sql = """
                UPDATE chat_sessions
                SET current_flow = %s, current_step = %s, context = %s, last_message_at = NOW()
            """
            params = [flow, step, json.dumps(context)]
            
            if status:
                sql += ", status = %s"
                params.append(status)
            
            sql += " WHERE id = %s"
            params.append(session_id)
            
            cur.execute(sql, tuple(params))
            conn.commit()
    finally:
        conn.close()

def update_session_patient(session_id: int, patient_id: int):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                UPDATE chat_sessions
                SET patient_id = %s, last_message_at = NOW()
                WHERE id = %s
            """, (patient_id, session_id))
            conn.commit()
    finally:
        conn.close()

def update_session_context(session_id: int, context: dict):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                UPDATE chat_sessions
                SET context = %s, last_message_at = NOW()
                WHERE id = %s
            """, (json.dumps(context), session_id))
            conn.commit()
    finally:
        conn.close()

def add_message(session_id: int, sender_type: str, content: str, sender_user_id: int = None, meta: dict = None):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                INSERT INTO chat_messages (session_id, sender_type, sender_user_id, content, meta)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (session_id, sender_type, sender_user_id, content, json.dumps(meta or {})))
            msg_id = cur.fetchone()[0]
            
            # Update last_message_at in session
            cur.execute("UPDATE chat_sessions SET last_message_at = NOW() WHERE id = %s", (session_id,))
            
            conn.commit()
            return msg_id
    finally:
        conn.close()

def get_messages(session_id: int, limit: int = 50, target: str = None):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT id, sender_type, sender_user_id, content, meta, created_at
                FROM chat_messages
                WHERE session_id = %s
                ORDER BY created_at ASC
                LIMIT %s
            """, (session_id, limit))
            rows = cur.fetchall()
            results = []
            for r in rows:
                meta = safe_json_loads(r[4])
                msg_target = meta.get('target')
                
                # Filtering logic
                if target:
                    if msg_target and msg_target != target:
                        continue
                
                results.append({
                    "id": r[0],
                    "sender_type": r[1],
                    "sender_user_id": r[2],
                    "content": r[3],
                    "meta": meta,
                    "created_at": safe_isoformat(r[5])
                })
            return results
    finally:
        conn.close()

def create_notification(type: str, session_id: int, payload: dict, user_id: int = None):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                INSERT INTO chat_notifications (type, session_id, payload, user_id, is_read)
                VALUES (%s, %s, %s, %s, FALSE)
                RETURNING id
            """, (type, session_id, json.dumps(payload), user_id))
            notif_id = cur.fetchone()[0]
            conn.commit()
            return notif_id
    finally:
        conn.close()

def get_unread_notifications(user_id: int = None):
    # If user_id provided, get for that user OR broadcast (user_id IS NULL)
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            query = """
                SELECT id, type, session_id, payload, created_at, user_id
                FROM chat_notifications
                WHERE is_read = FALSE
            """
            params = []
            
            if user_id:
                query += " AND (user_id = %s OR user_id IS NULL)"
                params.append(user_id)
            else:
                # If no user_id (e.g. admin requesting all), maybe just get all unread?
                # For now let's assume we get all if no user specified
                pass
                
            query += " ORDER BY created_at DESC"
            
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
            return [
                {
                    "id": r[0],
                    "type": r[1],
                    "session_id": r[2],
                    "payload": safe_json_loads(r[3]),
                    "created_at": safe_isoformat(r[4]),
                    "target_user_id": r[5]
                }
                for r in rows
            ]
    finally:
        conn.close()

def mark_notification_read(notification_id: int):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("UPDATE chat_notifications SET is_read = TRUE WHERE id = %s", (notification_id,))
            conn.commit()
    finally:
        conn.close()

def mark_all_notifications_read(user_id: int = None):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            query = "UPDATE chat_notifications SET is_read = TRUE WHERE is_read = FALSE"
            params = []
            if user_id:
                query += " AND (user_id = %s OR user_id IS NULL)"
                params.append(user_id)
            
            cur.execute(query, tuple(params))
            conn.commit()
    finally:
        conn.close()

def get_all_sessions(status_filter: str = None):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            sql = """
                SELECT s.id, s.patient_id, p.nombre_completo, s.status, s.last_message_at, s.context, p.numero_identificacion
                FROM chat_sessions s
                LEFT JOIN pacientes p ON s.patient_id = p.id
                WHERE s.status != 'bot' AND EXISTS (
                    SELECT 1 FROM chat_messages m 
                    WHERE m.session_id = s.id AND m.sender_type = 'patient'
                    LIMIT 1
                )
            """
            params = []
            if status_filter:
                sql += " AND s.status = %s"
                params.append(status_filter)
            
            sql += " ORDER BY s.last_message_at DESC LIMIT 50"
            
            cur.execute(sql, tuple(params))
            rows = cur.fetchall()
            results = []
            for r in rows:
                ctx = safe_json_loads(r[5])
                
                guest_name = ctx.get('guest_name') if ctx else None
                # Prioritize guest_name (from chat form) over DB name
                display_name = guest_name if guest_name else (r[2] if r[2] else 'Invitado')
                
                # Get document from patient table OR context
                doc_number = r[6] if r[6] else (ctx.get('documento') if ctx else None)
                
                results.append({
                    "id": r[0],
                    "patient_id": r[1],
                    "patient_name": display_name,
                    "document_number": doc_number,
                    "status": r[3],
                    "last_message_at": safe_isoformat(r[4])
                })
            return results
    finally:
        conn.close()

def delete_sessions(session_ids: list[int]):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            # Delete messages first (if no cascade) - Assuming cascade or manual cleanup
            cur.execute("DELETE FROM chat_messages WHERE session_id = ANY(%s)", (session_ids,))
            cur.execute("DELETE FROM chat_notifications WHERE session_id = ANY(%s)", (session_ids,))
            cur.execute("DELETE FROM chat_sessions WHERE id = ANY(%s)", (session_ids,))
            conn.commit()
    finally:
        conn.close()
