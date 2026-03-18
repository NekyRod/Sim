import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from app.database import settings_repo
from app.utils.security_utils import decrypt_value

def send_email_background(to_email: str, subject: str, body: str):
    """
    Sends an email in the background using SMTP configuration.
    Priority: Database Settings > Environment Variables.
    """
    # 1. Try DB Config
    db_conf = settings_repo.get_smtp_settings()
    
    smtp_host = None
    smtp_port = None
    smtp_user = None
    smtp_password = None
    from_email = None
    use_tls = True
    use_ssl = False
    
    if db_conf and db_conf.get('enabled'):
        smtp_host = db_conf['host']
        smtp_port = db_conf['port']
        smtp_user = db_conf['username']
        smtp_password = decrypt_value(db_conf['password_encrypted'])
        from_email = db_conf.get('from_email')
        use_tls = db_conf.get('use_tls')
        use_ssl = db_conf.get('use_ssl')
    
    # 2. Fallback to Env
    if not smtp_host:
        smtp_host = os.getenv("SMTP_HOST")
        smtp_port = os.getenv("SMTP_PORT")
        smtp_user = os.getenv("SMTP_USER")
        smtp_password = os.getenv("SMTP_PASSWORD")
        from_email = os.getenv("SMTP_FROM_EMAIL", smtp_user)
        # Default Env behavior
        if smtp_port and int(smtp_port) == 465:
            use_ssl = True
            use_tls = False
        else:
            use_tls = True

    if not all([smtp_host, smtp_port]): # User/Pass might be optional for some internal relays
        logger.warning("SMTP configuration missing. Email not sent.")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = from_email or smtp_user
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(body, 'html'))

        # Connect
        if use_ssl:
            server = smtplib.SMTP_SSL(smtp_host, int(smtp_port))
        else:
            server = smtplib.SMTP(smtp_host, int(smtp_port))
            if use_tls:
                server.starttls()

        if smtp_user and smtp_password:
            server.login(smtp_user, smtp_password)
            
        text = msg.as_string()
        server.sendmail(msg['From'], to_email, text)
        server.quit()
        
        logger.info(f"Email sent successfully to {to_email}")

    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
