import os
from dotenv import load_dotenv

load_dotenv()

# Si Render/Clever proporciona DATABASE_URL o MYSQL_ADDON_URI, parsearlo
# Ej: mysql://user:pass@host:3306/db  o  mysql://u9rbmsykuc9xheqr:xxx@bhoaaacrey4xvrzjdpdc-mysql.services.clever-cloud.com:3306/bhoaaacrey4xvrzjdpdc
def _parse_db_url(url: str):
    try:
        from urllib.parse import urlparse, unquote
        p = urlparse(url)
        return {
            "host": p.hostname or "localhost",
            "port": str(p.port or 3306),
            "user": unquote(p.username or ""),
            "password": unquote(p.password or ""),
            "db": (p.path or "").lstrip("/"),
        }
    except Exception:
        return {}

_db_url = os.getenv("DATABASE_URL") or os.getenv("MYSQL_ADDON_URI") or ""
_parsed = _parse_db_url(_db_url) if _db_url else {}

# Soporta tanto DB_* (Render) como MYSQL_ADDON_* (Clever Cloud) y DATABASE_URL
DB_HOST = _parsed.get("host") or os.getenv("DB_HOST") or os.getenv("MYSQL_ADDON_HOST") or "localhost"
DB_PORT = int(_parsed.get("port") or os.getenv("DB_PORT") or os.getenv("MYSQL_ADDON_PORT") or "3306")
DB_USER = _parsed.get("user") or os.getenv("DB_USER") or os.getenv("MYSQL_ADDON_USER") or "root"
DB_PASSWORD = _parsed.get("password") or os.getenv("DB_PASSWORD") or os.getenv("MYSQL_ADDON_PASSWORD") or ""
DB_NAME = _parsed.get("db") or os.getenv("DB_NAME") or os.getenv("MYSQL_ADDON_DB") or "finanzas_personales"

# Render inyecta PORT, usar 0.0.0.0 en producción
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("PORT") or os.getenv("API_PORT") or "8000")
