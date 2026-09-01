import os, sys
sys.path.insert(0, os.path.dirname(__file__))
import mysql.connector
from mysql.connector import Error
try:
    import config
except ImportError:
    from backend import config

def get_db():
    """Retorna conexión MySQL. Caller debe cerrar con db.close()"""
    try:
        conn = mysql.connector.connect(
            host=config.DB_HOST,
            port=config.DB_PORT,
            user=config.DB_USER,
            password=config.DB_PASSWORD,
            database=config.DB_NAME,
            charset="utf8mb4",
            collation="utf8mb4_unicode_ci",
            autocommit=False
        )
        return conn
    except Error as e:
        raise e

def get_db_dict_cursor(conn):
    return conn.cursor(dictionary=True, buffered=True)
