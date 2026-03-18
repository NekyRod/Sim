from app.database import settings_repo
from app.utils.security_utils import encrypt_value, decrypt_value
from app.services import email_service
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def get_settings_masked():
    s = settings_repo.get_smtp_settings()
    if not s: return {}
    # Mask password
    if s.get('password_encrypted'):
        s['password'] = "********"
    else:
        s['password'] = ""
    del s['password_encrypted']
    return s

def update_settings(data: dict, user: str):
    # Handle password
    current = settings_repo.get_smtp_settings()
    
    new_pass = data.get('password')
    encrypted = None
    
    if new_pass and new_pass != "********":
        encrypted = encrypt_value(new_pass)
    elif current:
        encrypted = current.get('password_encrypted') # Keep existing
    
    data['password_encrypted'] = encrypted
    return settings_repo.save_smtp_settings(data, user)

def test_smtp_connection(test_email: str):
    # Get config from DB (unmasked)
    s = settings_repo.get_smtp_settings()
    if not s or not s.get('enabled'):
        return {"success": False, "message": "SMTP no habilitado o no configurado en DB"}
    
    try:
        host = s['host']
        port = int(s['port'])
        user = s['username']
        # Decrypt
        password = decrypt_value(s['password_encrypted'])
        
        # Test connection logic similar to email_service but synchronous and verbose
        msg = MIMEMultipart()
        msg['From'] = s.get('from_email', user)
        msg['To'] = test_email
        msg['Subject'] = "Prueba de Configuración SMTP - GOI"
        msg.attach(MIMEText("Si lees esto, el SMTP está funcionando correctamente.", 'plain'))
        
        if port == 465 or s.get('use_ssl'):
            server = smtplib.SMTP_SSL(host, port, timeout=10)
        else:
            server = smtplib.SMTP(host, port, timeout=10)
            if s.get('use_tls'):
                server.starttls()
        
        if user and password:
            server.login(user, password)
            
        server.sendmail(msg['From'], test_email, msg.as_string())
        server.quit()
        return {"success": True, "message": "Correo de prueba enviado correctamente"}
        
    except Exception as e:
        return {"success": False, "message": f"Error: {str(e)}"}
