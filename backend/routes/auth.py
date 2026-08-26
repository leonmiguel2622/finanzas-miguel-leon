from fastapi import APIRouter, HTTPException
from database import get_db
from models.schemas import UsuarioLogin
from utils.security import verify_password

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/login")
def login(payload: UsuarioLogin):
    db = get_db()
    try:
        cur = db.cursor(dictionary=True)
        cur.execute("SELECT id_usuario, nombre, correo, contrasena_hash FROM usuarios WHERE correo=%s", (payload.correo.lower().strip(),))
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="Credenciales inválidas")

        if not verify_password(payload.contrasena, user["contrasena_hash"]):
            raise HTTPException(status_code=401, detail="Credenciales inválidas")

        return {
            "id_usuario": user["id_usuario"],
            "nombre": user["nombre"],
            "correo": user["correo"],
            "mensaje": "Login exitoso"
        }
    finally:
        db.close()
