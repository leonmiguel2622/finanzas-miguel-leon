from fastapi import APIRouter, HTTPException
from mysql.connector import Error
try:
    from database import get_db
except ImportError:
    from backend.database import get_db
try:
    from models.schemas import UsuarioCreate
except ImportError:
    from backend.models.schemas import UsuarioCreate
try:
    from utils.security import hash_password
except ImportError:
    from backend.utils.security import hash_password

router = APIRouter(prefix="/api/usuarios", tags=["Usuarios"])

CATEGORIAS_DEFAULT = [
    ("Salario", "ingreso"),
    ("Freelance", "ingreso"),
    ("Alimentación", "gasto"),
    ("Transporte", "gasto"),
    ("Entretenimiento", "gasto"),
    ("Salud", "gasto"),
]

@router.post("", status_code=201)
def crear_usuario(payload: UsuarioCreate):
    db = None
    try:
        db = get_db()
        cur = db.cursor()
        # Verificar correo duplicado
        cur.execute("SELECT id_usuario FROM usuarios WHERE correo=%s", (payload.correo,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="El correo ya está registrado")

        hashed = hash_password(payload.contrasena)
        cur.execute(
            "INSERT INTO usuarios (nombre, correo, contrasena_hash) VALUES (%s,%s,%s)",
            (payload.nombre, payload.correo, hashed)
        )
        user_id = cur.lastrowid

        # Crear categorías pre-cargadas para el nuevo usuario
        for nombre, tipo in CATEGORIAS_DEFAULT:
            cur.execute(
                "INSERT INTO categorias (nombre, tipo, id_usuario) VALUES (%s,%s,%s)",
                (nombre, tipo, user_id)
            )

        db.commit()
        return {"id_usuario": user_id, "nombre": payload.nombre, "correo": payload.correo, "mensaje": "Usuario creado con éxito. Categorías por defecto creadas."}

    except HTTPException:
        raise
    except Error as e:
        if db:
            db.rollback()
        # Manejo de UNIQUE violation
        if "Duplicate" in str(e) or "UNIQUE" in str(e):
            raise HTTPException(status_code=400, detail="Correo ya registrado")
        raise HTTPException(status_code=500, detail=f"Error BD: {str(e)}")
    finally:
        if db:
            db.close()

@router.get("", status_code=200)
def listar_usuarios():
    # Solo para debug/admin, no expone hash
    db = get_db()
    try:
        cur = db.cursor(dictionary=True)
        cur.execute("SELECT id_usuario, nombre, correo, fecha_registro FROM usuarios ORDER BY id_usuario DESC")
        return cur.fetchall()
    finally:
        db.close()