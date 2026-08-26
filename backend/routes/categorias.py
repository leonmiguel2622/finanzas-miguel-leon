from fastapi import APIRouter, HTTPException, Query
from database import get_db
from models.schemas import CategoriaCreate, CategoriaUpdate
from mysql.connector import Error

router = APIRouter(prefix="/api/categorias", tags=["Categorias"])

@router.post("", status_code=201)
def crear_categoria(payload: CategoriaCreate):
    db = get_db()
    try:
        cur = db.cursor()
        # Validar usuario existe
        cur.execute("SELECT id_usuario FROM usuarios WHERE id_usuario=%s", (payload.id_usuario,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # Validar no duplicada
        cur.execute("SELECT id_categoria FROM categorias WHERE id_usuario=%s AND nombre=%s", (payload.id_usuario, payload.nombre))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Ya existe una categoría con ese nombre para el usuario")

        cur.execute(
            "INSERT INTO categorias (nombre, tipo, id_usuario) VALUES (%s,%s,%s)",
            (payload.nombre, payload.tipo, payload.id_usuario)
        )
        db.commit()
        return {"id_categoria": cur.lastrowid, "mensaje": "Categoría creada"}
    except HTTPException:
        raise
    except Error as e:
        if db:
            db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@router.get("", status_code=200)
def listar_categorias(id_usuario: int = Query(..., gt=0)):
    db = get_db()
    try:
        cur = db.cursor(dictionary=True)
        cur.execute("SELECT id_categoria, nombre, tipo, id_usuario FROM categorias WHERE id_usuario=%s ORDER BY tipo DESC, nombre ASC", (id_usuario,))
        rows = cur.fetchall()
        return rows
    finally:
        db.close()

@router.get("/{id_categoria}", status_code=200)
def obtener_categoria(id_categoria: int):
    db = get_db()
    try:
        cur = db.cursor(dictionary=True)
        cur.execute("SELECT * FROM categorias WHERE id_categoria=%s", (id_categoria,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        return row
    finally:
        db.close()

@router.put("/{id_categoria}", status_code=200)
def actualizar_categoria(id_categoria: int, payload: CategoriaUpdate):
    db = get_db()
    try:
        cur = db.cursor(dictionary=True)
        cur.execute("SELECT * FROM categorias WHERE id_categoria=%s", (id_categoria,))
        cat = cur.fetchone()
        if not cat:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")

        nombre = payload.nombre if payload.nombre is not None else cat["nombre"]
        tipo = payload.tipo if payload.tipo is not None else cat["tipo"]

        # Validar no duplicar nombre
        if nombre != cat["nombre"]:
            cur.execute("SELECT id_categoria FROM categorias WHERE id_usuario=%s AND nombre=%s AND id_categoria<>%s",
                        (cat["id_usuario"], nombre, id_categoria))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="Ya existe otra categoría con ese nombre")

        # Si cambia tipo, validar que no haya movimientos que queden inconsistentes? Permitimos pero advertimos
        cur2 = db.cursor()
        cur2.execute("UPDATE categorias SET nombre=%s, tipo=%s WHERE id_categoria=%s", (nombre, tipo, id_categoria))
        db.commit()
        return {"mensaje": "Categoría actualizada", "id_categoria": id_categoria, "nombre": nombre, "tipo": tipo}
    except HTTPException:
        raise
    except Error as e:
        if db:
            db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@router.delete("/{id_categoria}", status_code=200)
def eliminar_categoria(id_categoria: int):
    db = get_db()
    try:
        cur = db.cursor(dictionary=True)
        cur.execute("SELECT * FROM categorias WHERE id_categoria=%s", (id_categoria,))
        cat = cur.fetchone()
        if not cat:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")

        cur2 = db.cursor()
        try:
            cur2.execute("DELETE FROM categorias WHERE id_categoria=%s", (id_categoria,))
            db.commit()
        except Error as e:
            db.rollback()
            # FK RESTRICT
            if "foreign key" in str(e).lower() or "1451" in str(e):
                raise HTTPException(status_code=400, detail="No se puede eliminar: tiene movimientos asociados")
            raise HTTPException(status_code=500, detail=str(e))

        return {"mensaje": "Categoría eliminada"}
    finally:
        db.close()
