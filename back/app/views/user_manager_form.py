import tkinter as tk
from tkinter import ttk, messagebox
from werkzeug.security import generate_password_hash
import sys
sys.path.append('.')  # Ajusta si el import de auth_service no lo encuentra

try:
    from app.services.auth_service import get_db_connection
except ImportError:
    from auth_service import get_db_connection

class UserManageForm(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Gestión de Usuarios - Wolf Arena")
        self.geometry("410x430")
        self.resizable(False, False)
        self.create_widgets()

    def create_widgets(self):
        ttk.Label(self, text="Registro/Cambio de Usuario").grid(column=0, row=0, columnspan=2, pady=14)
        ttk.Label(self, text="Username").grid(column=0, row=1, padx=10, pady=8, sticky='w')
        self.entry_username = ttk.Entry(self, width=30)
        self.entry_username.grid(column=1, row=1, padx=10, pady=8)

        ttk.Label(self, text="Contraseña").grid(column=0, row=2, padx=10, pady=8, sticky='w')
        self.entry_password = ttk.Entry(self, width=30, show="*")
        self.entry_password.grid(column=1, row=2, padx=10, pady=8)

        ttk.Label(self, text="Confirmar Contraseña").grid(column=0, row=3, padx=10, pady=8, sticky='w')
        self.entry_password2 = ttk.Entry(self, width=30, show="*")
        self.entry_password2.grid(column=1, row=3, padx=10, pady=8)

        ttk.Button(self, text="Crear usuario", command=self.create_user).grid(column=0, row=4, columnspan=2, pady=12)
        ttk.Separator(self, orient='horizontal').grid(row=5, column=0, columnspan=2, sticky="ew", pady=8)
        ttk.Label(self, text="Usuario existente").grid(column=0, row=6, padx=10, pady=4, sticky='w')
        self.entry_existing = ttk.Entry(self, width=30)
        self.entry_existing.grid(column=1, row=6, padx=10, pady=4)

        ttk.Label(self, text="Nueva Contraseña").grid(column=0, row=7, padx=10, pady=8, sticky='w')
        self.entry_newpass = ttk.Entry(self, width=30, show="*")
        self.entry_newpass.grid(column=1, row=7, padx=10, pady=8)

        ttk.Label(self, text="Confirmar Nueva Contraseña").grid(column=0, row=8, padx=10, pady=8, sticky='w')
        self.entry_newpass2 = ttk.Entry(self, width=30, show="*")
        self.entry_newpass2.grid(column=1, row=8, padx=10, pady=8)

        ttk.Button(self, text="Actualizar contraseña", command=self.change_password).grid(column=0, row=9, columnspan=2, pady=12, sticky='ew', ipadx=30)


    def create_user(self):
        username = self.entry_username.get().strip()
        password = self.entry_password.get().strip()
        password2 = self.entry_password2.get().strip()
        if not username or not password:
            messagebox.showerror("Error", "Usuario y contraseña son obligatorios.")
            return
        if password != password2:
            messagebox.showerror("Error", "Las contraseñas no coinciden.")
            return

        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT 1 FROM usuario WHERE username=%s", (username,))
            if cur.fetchone():
                messagebox.showerror("Error", "El usuario ya existe.")
                cur.close()
                conn.close()
                return
            hash = generate_password_hash(password)
            cur.execute("INSERT INTO usuario (username, password_hash) VALUES (%s, %s)", (username, hash))
            conn.commit()
            cur.close()
            conn.close()
            messagebox.showinfo("Éxito", f"Usuario '{username}' creado correctamente.")
        except Exception as e:
            messagebox.showerror("Error de conexión o inserción", str(e))

    def change_password(self):
        username = self.entry_existing.get().strip()
        newpass = self.entry_newpass.get().strip()
        newpass2 = self.entry_newpass2.get().strip()

        if not username or not newpass:
            messagebox.showerror("Error", "Usuario y nueva contraseña son obligatorios.")
            return
        if newpass != newpass2:
            messagebox.showerror("Error", "Las contraseñas no coinciden.")
            return

        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT 1 FROM usuario WHERE username=%s", (username,))
            if not cur.fetchone():
                messagebox.showerror("Error", "El usuario NO existe.")
                cur.close()
                conn.close()
                return
            hash = generate_password_hash(newpass)
            cur.execute("UPDATE usuario SET password_hash=%s WHERE username=%s", (hash, username))
            conn.commit()
            cur.close()
            conn.close()
            messagebox.showinfo("Éxito", f"Contraseña de '{username}' cambiada correctamente.")
        except Exception as e:
            messagebox.showerror("Error al cambiar la contraseña", str(e))

if __name__ == "__main__":
    app = UserManageForm()
    app.mainloop()
