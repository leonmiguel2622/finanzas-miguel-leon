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
    return pymysql.connect(
        host="bhoaaacrey4xvrzjdpdc-mysql.services.clever-cloud.com",
        user="u9rbmsykuc9xheqr",
        password="u9rbmsykuc9xheqr", 
        database="bhoaaacrey4xvrzjdpdc",
        port=3306,
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
