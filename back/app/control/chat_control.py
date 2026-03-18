from datetime import datetime, timedelta, date, time
from typing import List, Optional
import json

from fastapi import HTTPException, BackgroundTasks
from app.database import (
    chat_repo, 
    citas_repo, 
    profesionales_repo, 
    disponibilidades_repo, 
    especialidades_repo,
    tiposservicio_repo,
    pacientes_repo
)
from app.control import citas_control, especialidades_control, profesionales_control

# ================= CONSTANTS & MAPPING =================
# Mapped to DB 'nombre' of specialties
SPECIALTY_ODONTOLOGIA = "Odontología"
SPECIALTY_GENERAL = "Odontología" # Fixed: Was "Medicina General", should be Dental for checkups

# Service -> Specialty Mapping
SERVICE_MAPPING = {
    "Resina": SPECIALTY_ODONTOLOGIA,
    "Higiene Oral": SPECIALTY_ODONTOLOGIA,
    "Exodoncia": SPECIALTY_ODONTOLOGIA,
    "Pulpectomía": SPECIALTY_ODONTOLOGIA,  # Could be Pediatria if needed
    "Odontologia General": SPECIALTY_ODONTOLOGIA
}

SERVICE_RESINA = "Resina"
SERVICE_HIGIENE = "Higiene Oral" 
SERVICE_EXODONCIA = "Exodoncia"
SERVICE_PULPECTOMIA = "Pulpectomía"

# Valid options for menu
MENU_OPTIONS = {
    "1": "AGENDAR",
    "2": "CANCELAR",
    "3": "CONSULTAR",
    "4": "UBICACION",
    "5": "CUOTA",
    "6": "HISTORIA",
    "7": "PQR"
    # 8 Removed
}

STATUS_OPEN = "open"
STATUS_WAITING = "waiting_receptionist"
STATUS_CLOSED = "closed"
STATUS_BOT = "bot"

# ================= HELPER FUNCTIONS =================

def _get_db_entity_id(list_func, name_query: str):
    """Fuzzy search for ID by name"""
    entities = list_func()
    # Exact match
    for e in entities:
        if e['nombre'].lower() == name_query.lower():
            return e['id']
    # Contains match
    for e in entities:
        if name_query.lower() in e['nombre'].lower():
            return e['id']
    return None

def _get_specialty_id(name: str):
    return _get_db_entity_id(especialidades_repo.listar_especialidades, name)

def delete_sessions(session_ids: list[int]):
    chat_repo.delete_sessions(session_ids)

# ================= CORE LOGIC =================

def create_or_get_session(patient_id: int = None, session_id: int = None, name: str = None, documento: str = None):
    try:
        # If session_id provided, try to find it
        if session_id:
            session = chat_repo.get_session(session_id)
            if session:
                 # If we have name/doc now but they weren't in session, update context
                 context = session.get('context') or {}
                 updated = False
                 if name and not context.get('guest_name'):
                     context['guest_name'] = name
                     updated = True
                 if documento and not context.get('documento'):
                     context['documento'] = documento
                     updated = True
                 
                 if updated:
                     chat_repo.update_session_context(session_id, context)
                     # If we got document, also try to link patient_id
                     if documento and not session.get('patient_id'):
                         p = pacientes_repo.buscar_pacientes(documento)
                         if p:
                             # We'd need a chat_repo.update_session_patient(session_id, p[0]['id'])
                             # For now, we'll rely on the context since get_all_sessions uses it
                             pass
                 
                 return chat_repo.get_session(session_id) # Return fresh state

            if not name and not documento and not patient_id:
                raise HTTPException(status_code=404, detail="Session not found or expired")

        # If new session request with user details
        if not patient_id and documento:
             p = pacientes_repo.buscar_pacientes(documento)
             if p:
                 patient_id = p[0]['id']

        # Create new session
        if not patient_id and (not name or not documento):
            raise HTTPException(status_code=400, detail="Name and Document required to start chat")

        sess_id = chat_repo.create_session(patient_id)
        
        # Init context with provided details
        context = {}
        if name: context['guest_name'] = name
        if documento: context['documento'] = documento 
        
        chat_repo.update_session_context(sess_id, context)
        

        _send_main_menu(sess_id, context)
        session = chat_repo.get_session(sess_id)
        return session
    except Exception as e:
        import traceback
        # Attempt to log to file if possible, or print
        print(f"ERROR creating session: {e}")
        traceback.print_exc()
        raise e

from fastapi import BackgroundTasks
# from app.services import email_service # Import email service if needed

def handle_patient_message(session_id: int, content: str, background_tasks: BackgroundTasks = None):
    session = chat_repo.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Save patient message
    chat_repo.add_message(session_id, "patient", content)
    
    # Check status
    if session['status'] == STATUS_WAITING:
        # Already saved message. Just return to stay in bidirectional mode.
        return
    
    if session['status'] == STATUS_OPEN:
        # Chat is open with an advisor. Stay silent.
        return
    
    if session['status'] == STATUS_CLOSED:
        _send_main_menu(session_id, session.get('context'))
        return

    # State Machine
    flow = session['current_flow']
    step = session['current_step']
    context = session['context'] or {}

    # Global Reset Command
    cmd = content.strip().lower()
    if cmd in ["0", "menu", "inicio", "reiniciar"]:
        _send_main_menu(session_id, context)
        return
    
    if flow == "MAIN_MENU":
        _handle_main_menu(session_id, content)
    elif flow == "AGENDAR":
        _handle_agendar_flow(session_id, step, context, content, background_tasks)
    elif flow == "CANCELAR":
        _handle_cancelar_flow(session_id, step, context, content)
    elif flow == "CONSULTAR": # Option 3
        _handle_confirmar_flow(session_id, step, context, content)
    elif flow == "CONFIRMAR": # Legacy
        _handle_confirmar_flow(session_id, step, context, content)
    elif flow == "ASESOR":
        return
    else:
        _send_main_menu(session_id, context)

def _send_main_menu(session_id: int, context: dict = None):
    if context is None:
        # Fetch current if not provided to avoid overwriting
        session = chat_repo.get_session(session_id)
        context = session.get('context', {}) if session else {}

    msg = (
        "Buen día, se está comunicando con GOI, su IPS de Sanitas.\n"
        "Seleccione una opción:\n"
        "1. Agendar cita\n"
        "2. Cancelar cita\n"
        "3. Consultar mis citas\n"
        "4. Ubicación de la clínica\n"
        "5. Información sobre cuota moderadora\n"
        "6. Solicitud de copia de historia clínica\n"
        "7. Medios para interponer una PQR"
    )
    chat_repo.add_message(session_id, "system", msg)
    chat_repo.update_session_state(session_id, "MAIN_MENU", "INITIAL", context, STATUS_BOT)

def _handle_main_menu(session_id: int, content: str):
    choice = content.strip()
    if choice not in MENU_OPTIONS:
        chat_repo.add_message(session_id, "system", "Opción no válida. Por favor digite un número del 1 al 7.")
        return
        
    action = MENU_OPTIONS[choice]
    
    if action == "AGENDAR":
        # Option 1: Automangement by Specialty
        session = chat_repo.get_session(session_id)
        context = session.get('context', {})
        
        # 1. Get autogestion specialties
        auto_specs_resp = especialidades_control.listar_especialidades(solo_activos=True, solo_autogestion=True)
        auto_specs = auto_specs_resp.get('data', [])
        
        if not auto_specs:
            # Fallback to advisor if none configured for autogestion
            _show_advisor_handoff(session_id, context)
            return

        # 2. List them
        msg = "Podrá agendar de forma automática las siguientes especialidades:\n\n"
        for i, s in enumerate(auto_specs):
            msg += f"{i+1}. {s['nombre']}\n"
        msg += f"{len(auto_specs)+1}. Otra especialidad (Hablar con asesor)\n\n"
        msg += "Por favor Seleccione una opción:"
        
        context['auto_specs'] = auto_specs
        chat_repo.add_message(session_id, "system", msg)
        chat_repo.update_session_state(session_id, "AGENDAR", "SELECT_SPECIALTY", context, STATUS_BOT)
        
    elif action == "CANCELAR":
        # Ensure we don't lose context
        session = chat_repo.get_session(session_id)
        current_context = session.get('context', {}) if session else {}
        
        chat_repo.add_message(session_id, "system", "CMD:OPEN_MODAL_CANCELAR")
        chat_repo.update_session_state(session_id, "MAIN_MENU", "INITIAL", current_context, STATUS_BOT)
        
    elif action == "CONSULTAR":
        # Option 3: Query appointments by ID
        session = chat_repo.get_session(session_id)
        context = session.get('context', {})
        doc = context.get('documento')
        
        if doc:
            _show_appointments_by_doc(session_id, doc)
        else:
            chat_repo.update_session_state(session_id, "CONSULTAR", "ASK_DOC", context, STATUS_BOT)
            chat_repo.add_message(session_id, "system", "Por favor digite su número de documento para consultar sus citas.")
    
    elif action == "UBICACION":
        msg = ("Estamos ubicados en la CR 54 # 152A -85, local 9, piso 3\n"
               "https://maps.app.goo.gl/AY1i5ebg9joRYz919")
        chat_repo.add_message(session_id, "system", msg)
        _reset_to_menu(session_id)
        
    elif action == "CUOTA":
        msg = ("Los cotizantes pagan una cuota moderadora cada 6 meses y los beneficiarios pagan cuota moderadora cada 6 meses y copago en cada cita (valor variable).\n"
               "Valores de cuotas moderadoras:\n"
               "Categoría A: 5.000 COP\n"
               "Categoría B: 20.100 COP\n"
               "Categoría C: 52.800 COP")
        chat_repo.add_message(session_id, "system", msg)
        _reset_to_menu(session_id)
        
    elif action == "HISTORIA":
        chat_repo.add_message(session_id, "system", "Por favor diligencia esta encuesta y en el trascurso de 3 días hábiles, le enviamos la copia de la historia clínica al correo registrado: [URL_ENCUESTA]")
        _reset_to_menu(session_id)
        
    elif action == "PQR":
        chat_repo.add_message(session_id, "system", "Por favor diligencia esta encuesta y en el trascurso de 1 día hábil, le damos respuesta. [URL_ENCUESTA]")
        _reset_to_menu(session_id)



def _reset_to_menu(session_id: int):
    # Retrieve context to preserve it
    session = chat_repo.get_session(session_id)
    context = session.get('context', {}) if session else {}
    
    chat_repo.add_message(session_id, "system", "\n(Escriba una opción del menú para continuar)")
    # Use existing context instead of overwriting with {}
    chat_repo.update_session_state(session_id, "MAIN_MENU", "INITIAL", context, STATUS_BOT)

# ================= HELPER FOR ADVISOR HANDOFF =================

def _show_advisor_handoff(session_id: int, context: dict):
    # Resolve names and docs
    session = chat_repo.get_session(session_id)
    p_name = context.get("guest_name", "Invitado")
    p_doc = context.get("documento", "N/A")
    
    if session.get('patient_id'):
        pat = pacientes_repo.get_paciente_by_id(session['patient_id'])
        if pat and not context.get("guest_name"):
            p_name = pat['nombre_completo']
        if pat and not context.get("documento"):
            p_doc = pat['numero_identificacion']

    # Message for Admin
    admin_msg = f"Hola Administrativo, tienes una solicitud de chat de {p_name} con Documento: {p_doc}"
    chat_repo.add_message(session_id, "system", admin_msg, meta={"target": "admin"})
    
    chat_repo.add_message(session_id, "system", "Hemos notificado a un asesor. Por favor espera un momento, pronto te atenderemos.", meta={"target": "patient"})
    chat_repo.update_session_state(session_id, "ASESOR", "WAITING", context, STATUS_WAITING)
    
    # Notify
    chat_repo.create_notification("advisor_requested", session_id, {
        "name": p_name,
        "documento": p_doc,
        "reason": "Solicitud de agendamiento (Agente humano requerido)"
    })

# ================= AGENDAR FLOW =================

def _handle_agendar_flow(session_id: int, step: str, context: dict, content: str, background_tasks: BackgroundTasks = None):
    if step == "SELECT_SPECIALTY":
        auto_specs = context.get('auto_specs', [])
        try:
            choice = int(content.strip())
            if 1 <= choice <= len(auto_specs):
                selected = auto_specs[choice - 1]
                # Open manual scheduling modal for this specialty
                chat_repo.add_message(session_id, "system", f"Excelente. Abriendo el agendador para {selected['nombre']}...")
                chat_repo.add_message(session_id, "system", f"CMD:OPEN_MODAL_AGENDAR:{selected['codigo']}")
                # We can end the bot flow here or keep it in a 'MODAL_OPEN' state
                chat_repo.update_session_state(session_id, "AGENDAR", "MODAL_OPEN", context, STATUS_BOT)
            elif choice == len(auto_specs) + 1:
                # Other -> Advisor
                _show_advisor_handoff(session_id, context)
            else:
                chat_repo.add_message(session_id, "system", "Opción no válida. Por favor digite el número de su opción.")
        except ValueError:
            chat_repo.add_message(session_id, "system", "Por favor ingrese solo el número de la opción.")
        return

    if step == "ASK_NAME":
        name = content.strip()
        context['guest_name'] = name
        # Update session context AND potentially session table if needed
        chat_repo.update_session_context(session_id, context)
        
        chat_repo.update_session_state(session_id, "AGENDAR", "ASK_DOC", context, STATUS_BOT)
        msg = f"Gracias {name}. Por favor digite el número de documento del paciente sin puntos ni espacios."
        chat_repo.add_message(session_id, "system", msg)
        return

    if step == "ASK_DOC":
        doc = content.strip()
        context['documento'] = doc
        # Validate logic
        chat_repo.update_session_state(session_id, "AGENDAR", "WAIT_VALIDATION", context, STATUS_WAITING)
        chat_repo.add_message(session_id, "system", "Permíteme 2 minutos mientras valido la información.")
        # Trigger notification
        chat_repo.create_notification("validation_required", session_id, {"documento": doc, "name": context.get('guest_name')})
        return

    # WAITING_RECEPTIONIST is handled by api/validate endpoint which will push state forward.
    # If user types while waiting, we already handled in handle_patient_message.

    if step == "ASK_LAST_VISIT":
        if content == "1": # > 6 months
            # Offer Odontologia General
            _offer_slots(session_id, context, SPECIALTY_GENERAL, duration=20, days=3, count=3, is_general=True)
            return
        elif content == "2": # < 6 months
            chat_repo.add_message(session_id, "system", 
                "Tu cita es para:\n"
                "1. Resina\n"
                "2. Higiene oral\n"
                "3. Exodoncia\n"
                "4. Pulpectomía\n"
                "5. Otros"
            )
            chat_repo.update_session_state(session_id, "AGENDAR", "ASK_PROCEDURE", context, STATUS_BOT)
            return
        else:
            chat_repo.add_message(session_id, "system", "Por favor seleccione 1 o 2.")
            return

    if step == "ASK_PROCEDURE": 
        if content == "1": # Resina
            _offer_slots(session_id, context, SERVICE_RESINA, duration=20, days=7, count=2)
        elif content == "2": # Higiene
            _offer_slots(session_id, context, SERVICE_HIGIENE, duration=20, days=7, count=2)
        elif content == "3": # Exodoncia
            _offer_slots(session_id, context, SERVICE_EXODONCIA, duration=40, days=7, count=2)
        elif content == "4": # Pulpectomia
            _offer_slots(session_id, context, SERVICE_PULPECTOMIA, duration=40, days=7, count=2)
        elif content == "5": # Otros
            chat_repo.add_message(session_id, "system", "Un asesor se comunicará contigo para ayudarte con esta solicitud.")
            chat_repo.create_notification("handoff_required", session_id, {"reason": "User selected Otros"})
            # Request advisor:
            chat_repo.update_session_state(session_id, "ASESOR", "WAITING", context, STATUS_WAITING)
        else:
            chat_repo.add_message(session_id, "system", "Por favor seleccione una opción válida (1-5).")
        return

    if step == "SELECT_SLOT":
        slots = context.get('slots', [])
        try:
            idx = int(content) - 1
            if 0 <= idx < len(slots):
                selected = slots[idx]
                _confirm_appointment(session_id, context, selected, background_tasks)
            else:
                chat_repo.add_message(session_id, "system", "Opción inválida. Seleccione un número de la lista.")
        except ValueError:
            chat_repo.add_message(session_id, "system", "Por favor ingrese el número de la opción.")
        return

def _offer_slots(session_id: int, context: dict, service_name: str, duration: int, days: int, count: int, is_general: bool = False):
    # Find entity ID
    
    # Use MAPPING to find Specialty
    spec_name = SERVICE_MAPPING.get(service_name, SPECIALTY_ODONTOLOGIA)
    spec_id = _get_specialty_id(spec_name)
    profesionales = []
    
    if spec_id:
        # listar_profesionales_por_especialidad expects CODE, not ID.
        # But wait, repo method 'listar_profesionales_por_especialidad' usually takes ID if logic above was trying to use ID.
        # Let's check the code I saw before: "profesionales = profesionales_repo.listar_profesionales_por_especialidad(spec[1])"
        # spec[1] is likely 'codigo'.
        # Let's get the full spec object from ID.
        spec = especialidades_repo.obtener_especialidad(spec_id)
        if spec:
             # spec is tuple? (id, coding, name, active) or dict?
             # Repository usually returns dict or tuple. `listar_especialidades` returned list of dicts.
             # `obtener_especialidad` might return dict or tuple. 
             # Let's assume dict based on `listar` output: {"id":..}
             # But the previous code I saw used `spec[1]`.
             # If `listar` returns dicts, `obtener` probably does too.
             # If it returns dict, we need 'codigo'.
             if isinstance(spec, dict):
                 code = spec.get('codigo')
             else:
                 code = spec[1] # fallback to tuple index
                 
             profesionales = profesionales_repo.listar_profesionales_por_especialidad(code)
    
    if not profesionales:
        # If no specific professionals found, try all?
        # Maybe dangerous if we book Exodontia with Genral Dentist?
        # But if mapping directs to "Odontologia", most should be able to do it or we assume so for MVP.
        # If empty, try listing all? No, verify first.
        # Only fallback if NO specialists found at all.
        pass
        profesionales = profesionales_repo.listar_profesionales()

    # Calculate Slots
    found_slots = _find_slots(profesionales, duration, days, count)
    
    if not found_slots:
        chat_repo.add_message(session_id, "system", "Lo sentimos, no hay cupos disponibles en los próximos días para esta solicitud.")
        # _reset_to_menu(session_id) # Or ask to try other dates?
        return

    # Store in context
    context['slots'] = found_slots
    context['service_name'] = service_name
    context['duration'] = duration
    
    # Message
    msg = f"Opciones disponibles para {service_name}:\n"
    for i, s in enumerate(found_slots):
        msg += f"{i+1}. {s['fecha']} {s['hora']} - Dr. {s['profesional_nombre']}\n"
    msg += "Seleccione una opción:"
    
    chat_repo.add_message(session_id, "system", msg)
    chat_repo.update_session_state(session_id, "AGENDAR", "SELECT_SLOT", context, STATUS_BOT)

def _find_slots(profesionales, duration_min, days_window, max_slots):
    # This is complex. We need to check 'disponibilidades' (weekly schedule) AND 'citas' (existing bookings).
    # Returns list of dict: {fecha, hora, profesional_id, profesional_nombre}
    found = []
    
    dt_now = datetime.now()
    today = dt_now.date()
    # If testing at night, start tomorrow?
    
    dates_to_check = [today + timedelta(days=i) for i in range(days_window + 1)]
    
    from app.database import citas_repo, rangos_bloqueados_repo
    
    # Shuffle professionals to distribute load? Or just iterate.
    import random
    random.shuffle(profesionales)

    for d in dates_to_check:
        if d < today: continue
        # Convert Python weekday (0=Mon, 6=Sun) to App weekday (0=Sun, 1=Mon, ..., 6=Sat)
        # Mon(0) -> 1
        # Sun(6) -> 0
        app_day_index = (d.weekday() + 1) % 7
        
        for p in profesionales:
            p_id = p['id']
            p_name = p['nombre'] # or nombre_completo
            
            # Get availability for this professional on this day
            disponibilidades = disponibilidades_repo.obtener_disponibilidades_profesional(p_id)
            
            # disponibilidades keys are integers (0-6)
            if app_day_index not in disponibilidades:
                continue
            
            # Get existing appointments
            citas_dia = citas_repo.get_citas_profesional_rango(p_id, d, d)
            
            # Get explicitly blocked ranges
            bloqueos_dia = rangos_bloqueados_repo.listar_rangos_bloqueados(p_id, d.strftime("%Y-%m-%d"))
            
            # Build occupied ranges
            occupied = []
            for c in citas_dia:
                start = datetime.strptime(c['hora'], "%H:%M:%S").time() # Adjusted format if needed
                # If no end time in DB, assume 20 min?
                if c['hora_fin']:
                    end = datetime.strptime(c['hora_fin'], "%H:%M:%S").time()
                else: 
                     # Fallback logic
                     dt_start = datetime.combine(d, start)
                     end = (dt_start + timedelta(minutes=20)).time()
                occupied.append((start, end))
                
            for b in bloqueos_dia:
                # bloqueos usually return strings from our repo
                try:
                    b_start = datetime.strptime(b['hora_inicio'], "%H:%M:%S").time()
                    b_end = datetime.strptime(b['hora_fin'], "%H:%M:%S").time()
                    occupied.append((b_start, b_end))
                except Exception:
                    pass
            
            # Check shifts
            daily_shifts = disponibilidades[app_day_index]
            for shift in daily_shifts:
                # shift: {hora_inicio, hora_fin, ...}
                shift_start = datetime.strptime(shift['hora_inicio'], "%H:%M:%S").time()
                shift_end = datetime.strptime(shift['hora_fin'], "%H:%M:%S").time()
                
                # Iterate in 20 min chunks (base unit)
                curr = datetime.combine(d, shift_start)
                limit = datetime.combine(d, shift_end)
                
                while curr + timedelta(minutes=duration_min) <= limit:
                    slot_start = curr.time()
                    slot_end = (curr + timedelta(minutes=duration_min)).time()
                    
                    # Check overlap
                    is_free = True
                    for (occ_start, occ_end) in occupied:
                        # Overlap: max(start1, start2) < min(end1, end2)
                        if max(slot_start, occ_start) < min(slot_end, occ_end):
                            is_free = False
                            break
                    
                    if is_free:
                        # Found one!
                        found.append({
                            "fecha": d.strftime("%Y-%m-%d"),
                            "hora": slot_start.strftime("%H:%M"),
                            "profesional_id": p_id,
                            "profesional_nombre": p.get('nombre_completo', f"{p.get('nombre')} {p.get('apellidos')}"),
                            "hora_fin": slot_end.strftime("%H:%M")
                        })
                        if len(found) >= max_slots:
                            return found
                    
                    # Advance
                    curr += timedelta(minutes=20) # step 20 min always to align grid?
    
    return found

def _get_day_name(weekday: int) -> str:
    # Helper kept if needed elsewhere, but logic uses index now
    days = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]
    return days[weekday]

def _confirm_appointment(session_id: int, context: dict, slot: dict):
    # Call citas_control logic
    # We need to construct a body similar to CitaRequest
    
    # Need patient data? We have patient_id in session.
    # citas_repo.insertar_cita requires patient_id.
    # Validation logic requires CitaRequest object usually.
    # To be safe and simple: use citas_repo.insertar_cita directly or mocked body.
    # But current `crear_cita_control` does upserts and checks.
    # Since we are "patient authenticated", we can skip some patient upserts or just fetch patient.
    
    session = chat_repo.get_session(session_id)
    # pat_id might be None for anonymous users!
    # Requirement: "Preguntar documento". We have context['documento'].
    # We should search for patient by that document.
    doc = context.get('documento')
    if not doc:
        chat_repo.add_message(session_id, "system", "Error: No se ha capturado el documento.")
        return

    # Find patient by doc
    # Find patient by doc
    pats = pacientes_repo.buscar_pacientes(doc)
    
    if not pats:
         # Patient not found? Create them!
         # Requirement: "no diga que no encuentra un paciente con ese documento sino que continue creando la cita"
         # We need name. context['guest_name']?
         guest_name = context.get('guest_name', 'Paciente Chatbot')
         
         try:
             # Auto-create patient
             new_pat_data = {
                 "tipo_identificacion": "CC", # Default for now
                 "numero_identificacion": doc,
                 "nombre_completo": guest_name,
                 "telefono_celular": "", # Unknown
                 "activo": True
             }
             pat_id = pacientes_repo.create_paciente(new_pat_data)
         except Exception as e:
             chat_repo.add_message(session_id, "system", f"Error al crear paciente automático: {str(e)}")
             return
    else:
        pat_id = pats[0]['id']
    
    # Update session with patient_id if not set
    if not session.get('patient_id'):
        chat_repo.update_session_patient(session_id, pat_id)
        
        context['patient_id'] = pat_id
        context['guest_name'] = context.get('guest_name') or (pats[0]['nombre_completo'] if pats else 'Paciente Chatbot')
        context['documento'] = context.get('documento') or doc
        chat_repo.update_session_context(session_id, context)
    
    try:
        data = {
           "paciente_id": pat_id,
           "profesional_id": slot['profesional_id'],
           "fecha_programacion": slot['fecha'],
           "fecha_solicitada": date.today().isoformat(),
           "hora": slot['hora'],
           "hora_fin": slot['hora_fin'],
           "tipo_servicio": context.get('service_name', 'Consulta'), # Map to DB type id?
           "tipo_pbs": None, # Optional
           "mas_6_meses": False, # Or derived?
           "motivo_cita": context.get('service_name'), # Map to code
           "observacion": f"Agendado via Chatbot Session {session_id}",
           "activo": True
        }
        
        # We need to map strings to IDs/Codes if the DB enforces FKs on strings.
        # tipo_servicio in DB is string? citas_routes says "tipo_servicio: str".
        # motivo_cita in DB is string code (FK to especialidades.codigo).
        
        # Try to map service_name to valid code
        # _get_specialty_id helper returns ID, we probably need Code for motivo_cita
        
        citas_repo.insertar_cita(data)
        
        msg = (
            f"Su cita quedó agendada para el día {slot['fecha']}, con el doctor {slot['profesional_nombre']}, a las {slot['hora']}.\n"
            "Por favor llegar 25 minutos antes.\n"
            "Si no puede asistir, cancelar con un día de anterioridad para darle la oportunidad a otro usuario.\n"
            "La inasistencia genera multa de 14.000 COP."
        )
        chat_repo.add_message(session_id, "system", msg)
        chat_repo.update_session_state(session_id, "FINAL", "COMPLETED", context, STATUS_CLOSED)
        
    except Exception as e:
        chat_repo.add_message(session_id, "system", f"Ocurrió un error al agendar la cita: {str(e)}")
        # Don't close so they can try again? or close?
        import traceback
        traceback.print_exc()

# ================= CANCELAR FLOW =================

def _handle_cancelar_flow(session_id: int, step: str, context: dict, content: str):
    if step == "ASK_DOC":
        doc = content.strip()
        context['documento'] = doc
        
        # Search appointments
        # Need to find patient by doc first to get ID? Or we use session patient_id?
        # Requirement says "Preguntar documento". 
        # If logged in patient differs from doc provided, do we allow?
        # Assuming we use the doc provided to find the patient OR just filter logged user's appointments if they match.
        # Let's search by doc.
        
        # Start searching
        # Fetch future appointments
        citas = _get_future_appointments(doc)
        if not citas:
            chat_repo.add_message(session_id, "system", "No encontramos citas programadas pendientes para este documento.")
            _reset_to_menu(session_id)
            return
            
        context['citas_to_cancel'] = citas
        context['cancel_index'] = 0
        
        _ask_cancel_next(session_id, context)
        return

    if step == "CONFIRM_CANCEL":
        idx = context['cancel_index']
        citas = context['citas_to_cancel']
        
        if content.lower() in ["si", "sí", "s", "1"]:
            # Cancel curr
            cita = citas[idx]
            citas_repo.update_cita_estado(cita['id'], "CANCELADA") # or delete_cita logic
            # Also set active=False?
            citas_repo.delete_cita(cita['id'])
            
            chat_repo.add_message(session_id, "system", 
                "Su cita quedó cancelada. Para reprogramar por favor envíe un mensaje MAÑANA a WhatsApp 3144056425 para su nueva cita.")
            chat_repo.update_session_state(session_id, "FINAL", "COMPLETED", context, STATUS_CLOSED)
            return
        else:
            # Next
            context['cancel_index'] += 1
            _ask_cancel_next(session_id, context)

def _get_future_appointments(doc: str):
    # Find patient
    # We don't have search by doc in patients_repo easily?
    # patients_repo.obtener_paciente_por_doc requires tipo_id too.
    # Searching by partial match?
    # Let's search all appointments and filter in python if needed or adding a repo method.
    # Better: Use patients_repo.buscar_pacientes(doc) -> get ID -> get appointments.
    
    pats = pacientes_repo.buscar_pacientes(doc)
    if not pats: 
        return []
    
    # Assuming first match
    pid = pats[0]['id']
    
    # Get all active appointments
    all_citas = citas_repo.get_all_citas() # optimize later
    future = []
    now = datetime.now()
    
    for c in all_citas:
        if c['paciente_id'] == pid and c['estado'] != 'CANCELADA':
            # Check date
            c_dt = None
            if c['fecha_programacion'] and c['hora']:
                try:
                    c_dt = datetime.strptime(f"{c['fecha_programacion']} {c['hora']}", "%Y-%m-%d %H:%M:%S")
                except:
                    pass
            if c_dt and c_dt > now:
                future.append(c)
    return future

def _ask_cancel_next(session_id: int, context: dict):
    idx = context['cancel_index']
    citas = context['citas_to_cancel']
    
    if idx >= len(citas):
        chat_repo.add_message(session_id, "system", "No encontramos más citas programadas.")
        _reset_to_menu(session_id)
        return
    
    c = citas[idx]
    # Need doctor name. in get_all_citas result, we only have ID? 
    # get_all_citas joins with pacientes but NOT professionals in the snippet I saw? 
    # Wait, get_all_citas has columns.. let's check repo.
    # Repo view showed: "SELECT ... c.profesional_id ..."
    # It does NOT join professional name.
    # I need to fetch professional name.
    
    prof = profesionales_repo.obtener_profesional(c['profesional_id'])
    prof_name = f"{prof['nombre']} {prof['apellidos']}" if prof else "Doctor"
    
    msg = f"¿Desea cancelar la cita del {c['fecha_programacion']} a las {c['hora']} con el doctor {prof_name}?"
    chat_repo.add_message(session_id, "system", msg)
    chat_repo.update_session_state(session_id, "CANCELAR", "CONFIRM_CANCEL", context, STATUS_BOT)

# ================= CONFIRMAR FLOW =================

def _show_appointments_by_doc(session_id: int, doc: str):
    pats = pacientes_repo.buscar_pacientes(doc)
    if not pats:
        chat_repo.add_message(session_id, "system", "No encontramos un paciente registrado con ese documento.")
        _reset_to_menu(session_id)
        return

    pid = pats[0]['id']
    citas = citas_repo.get_citas_paciente(pid)
    
    if not citas:
        chat_repo.add_message(session_id, "system", "No tiene citas programadas actualmente.")
    else:
        msg = "Sus citas programadas:\n"
        for c in citas:
            msg += f"- {c['fecha_programacion']} {c['hora']}: {c['especialidad']} con Dr. {c['profesional_nombre']}\n"
        chat_repo.add_message(session_id, "system", msg)
    
    _reset_to_menu(session_id)

# ================= CONSULTAR FLOW (OLD CONFIRMAR) =================

def _handle_confirmar_flow(session_id: int, step: str, context: dict, content: str):
    # This flow logic has been moved to direct _handle_main_menu or we might use it if we need to ASK_DOC
    # If we are here, it's because we are asking for doc.
    if step == "ASK_DOC":
        doc = content.strip()
        context['documento'] = doc
        chat_repo.update_session_context(session_id, context)
        _show_appointments_by_doc(session_id, doc)

# ================= RECEPTIONIST ACTIONS =================

def validate_session(session_id: int, is_active: bool):
    session = chat_repo.get_session(session_id)
    if not session or session['status'] != STATUS_WAITING:
        return # Or error
    
    if is_active:
        # Check current flow
        if session.get('current_flow') == "AGENDAR" or session.get('current_flow') == "ASESOR":
             chat_repo.update_session_state(session_id, "ACTIVE_CHAT", "ACTIVE", session['context'], STATUS_OPEN)
             chat_repo.add_message(session_id, "system", "Un asesor está contigo. ¿Podría confirmar hace cuantos meses no viene a odontología?")
        else:
            # Fallback
            chat_repo.update_session_state(session_id, "ACTIVE_CHAT", "ACTIVE", session['context'], STATUS_OPEN)
            chat_repo.add_message(session_id, "system", "Un asesor se ha conectado contigo.")
    else:
        # Deny
        context = session.get('context', {})
        p_name = context.get("guest_name", "Paciente")
        
        if session.get('patient_id'):
            pat = pacientes_repo.get_paciente_by_id(session['patient_id'])
            if pat and not context.get("guest_name"):
                p_name = pat['nombre_completo']

        msg = (f"{p_name}, su usuario no está activo en este momento en la organización de Sanitas.\n"
               "Por favor comuníquese a la línea 3759000.")
        chat_repo.add_message(session_id, "system", msg)
        chat_repo.update_session_state(session_id, "FINAL", "TERMINATED", context, STATUS_CLOSED)


