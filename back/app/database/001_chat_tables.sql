-- Create new tables for Chatbot (State Machine)
-- Idempotent check: strictly CREATE TABLE IF NOT EXISTS

-- 1. CHAT SESSIONS
CREATE TABLE IF NOT EXISTS chat_sessions (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES pacientes(id),
    status TEXT NOT NULL DEFAULT 'open', -- open, waiting_receptionist, in_progress, closed
    current_flow TEXT, -- 'MAIN_MENU', 'AGENDAR', 'CANCELAR', etc.
    current_step TEXT, -- 'ASK_DOC', 'WAIT_VALIDATION', etc.
    context JSONB DEFAULT '{}',
    assigned_user_id INTEGER, -- For handoff logic later
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_patient_id ON chat_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);

-- 2. CHAT MESSAGES
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES chat_sessions(id),
    sender_type TEXT NOT NULL, -- 'system', 'patient', 'receptionist'
    sender_user_id INTEGER, -- Null if system or patient (if creating user context not needed for patient)
    content TEXT,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);

-- 3. CHAT NOTIFICATIONS (For receptionists)
CREATE TABLE IF NOT EXISTS chat_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER, -- Targeted user, nullable if broadcast
    type TEXT NOT NULL, -- 'validation_required', 'new_message', 'handoff_required'
    session_id INTEGER REFERENCES chat_sessions(id),
    payload JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_notifications_is_read ON chat_notifications(is_read);
