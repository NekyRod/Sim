import tkinter as tk
from tkinter import ttk, messagebox
import psycopg2
from psycopg2 import OperationalError
from app.config.config import load_config, save_config

class DatabaseConfigForm(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("PostgreSQL Configuration")
        self.geometry("400x350")
        self.resizable(False, False)
        self.create_widgets()
        self.load_existing_config()

    def create_widgets(self):
        ttk.Label(self, text="Server (Host):").grid(column=0, row=0, padx=10, pady=10, sticky="w")
        self.entry_server = ttk.Entry(self, width=30)
        self.entry_server.grid(column=1, row=0, padx=10, pady=10)

        ttk.Label(self, text="Database Name:").grid(column=0, row=1, padx=10, pady=10, sticky="w")
        self.entry_database = ttk.Entry(self, width=30)
        self.entry_database.grid(column=1, row=1, padx=10, pady=10)

        ttk.Label(self, text="Username:").grid(column=0, row=2, padx=10, pady=10, sticky="w")
        self.entry_username = ttk.Entry(self, width=30)
        self.entry_username.grid(column=1, row=2, padx=10, pady=10)

        ttk.Label(self, text="Password:").grid(column=0, row=3, padx=10, pady=10, sticky="w")
        self.entry_password = ttk.Entry(self, width=30, show="*")
        self.entry_password.grid(column=1, row=3, padx=10, pady=10)

        ttk.Label(self, text="Port:").grid(column=0, row=4, padx=10, pady=10, sticky="w")
        self.entry_port = ttk.Entry(self, width=30)
        self.entry_port.grid(column=1, row=4, padx=10, pady=10)

        btn_save = ttk.Button(self, text="Save", command=self.save_config)
        btn_save.grid(column=0, row=5, padx=10, pady=20)

        btn_test = ttk.Button(self, text="Test Connection", command=self.test_connection)
        btn_test.grid(column=1, row=5, padx=10, pady=20)

    def load_existing_config(self):
        config = load_config()
        if config:
            self.entry_server.insert(0, config.get("host", ""))
            self.entry_database.insert(0, config.get("dbname", ""))
            self.entry_username.insert(0, config.get("user", ""))
            self.entry_password.insert(0, config.get("password", ""))
            self.entry_port.insert(0, str(config.get("port", 5432)))

    def save_config(self):
        config = {
            "host": self.entry_server.get().strip(),
            "dbname": self.entry_database.get().strip(),
            "user": self.entry_username.get().strip(),
            "password": self.entry_password.get().strip(),
            "port": int(self.entry_port.get().strip() or 5432)
        }
        save_config(config)
        messagebox.showinfo("Success", "Configuration saved successfully.")

    def test_connection(self):
        host = self.entry_server.get().strip()
        dbname = self.entry_database.get().strip()
        user = self.entry_username.get().strip()
        password = self.entry_password.get().strip()
        port_str = self.entry_port.get().strip()
        try:
            port = int(port_str) if port_str else 5432
        except ValueError:
            messagebox.showerror("Test Connection", "Port must be a number.")
            return
        try:
            conn = psycopg2.connect(host=host, dbname=dbname, user=user, password=password, port=port, connect_timeout=5)
            conn.close()
            messagebox.showinfo("Test Connection", "Connection successful!")
        except OperationalError as e:
            messagebox.showerror("Test Connection", f"Connection error: {e}")

if __name__ == "__main__":
    app = DatabaseConfigForm()
    app.mainloop()
