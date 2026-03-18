import os
import json
import sys

# We need the crypt_util from the BACK service
sys.path.append(os.path.join(os.getcwd(), "back"))
from app.config.crypt_util import decrypt_text

CONFIG_FILE = "back/app/config/app.conf"

if os.path.exists(CONFIG_FILE):
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            encrypted_data = f.read()
        decrypted_data = decrypt_text(encrypted_data)
        config = json.loads(decrypted_data)
        print("BACK Config:", config)
    except Exception as e:
        print("Error:", e)
else:
    print("File not found")
