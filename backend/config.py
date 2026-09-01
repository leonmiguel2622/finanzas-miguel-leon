import os
from dotenv import load_dotenv

load_dotenv()

# Soporta tanto DB_* (Render) como MYSQL_ADDON_* (Clever Cloud)
DB_HOST = os.getenv("DB_HOST") or os.getenv("MYSQL_ADDON_HOST") or "localhost"
DB_PORT = int(os.getenv("DB_PORT") or os.getenv("MYSQL_ADDON_PORT") or "3306")
DB_USER = os.getenv("DB_USER") or os.getenv("MYSQL_ADDON_USER") or "root"
DB_PASSWORD = os.getenv("DB_PASSWORD") or os.getenv("MYSQL_ADDON_PASSWORD") or ""
DB_NAME = os.getenv("DB_NAME") or os.getenv("MYSQL_ADDON_DB") or "finanzas_personales"

# Render inyecta PORT, usar 0.0.0.0 en producción
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("PORT") or os.getenv("API_PORT") or "8000")
