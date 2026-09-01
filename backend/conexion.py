"""
conexion.py - Conexión simple a MySQL con PyMySQL para Render / pruebas rápidas
Usa variables de entorno (.env) si existen, si no usa localhost.
Para FastAPI usa database.py (mysql-connector). Este archivo es helper estilo sigirec.
"""
import os
import pymysql
import pymysql.cursors
from dotenv import load_dotenv

load_dotenv()

def conectar():
    # Lee credenciales de entorno (Render/Clever Cloud) - no hardcodear
    import config
    return pymysql.connect(
        host=config.DB_HOST,
        user=config.DB_USER,
        password=config.DB_PASSWORD,
        database=config.DB_NAME,
        port=config.DB_PORT,
        cursorclass=pymysql.cursors.DictCursor
    )


# Ejemplo de uso rápido (como en sigirec):
if __name__ == "__main__":
    try:
        conn = conectar()
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) as total FROM usuarios")
            print(cur.fetchone())
            cur.execute("SELECT id_usuario, nombre, correo FROM usuarios LIMIT 5")
            for row in cur.fetchall():
                print(row)
        conn.close()
        print("Conexión OK - finanzas_personales")
    except Exception as e:
        print("Error de conexión:", e)
