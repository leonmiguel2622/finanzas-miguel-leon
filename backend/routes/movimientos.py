from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import date
from database import get_db
from models.schemas import MovimientoCreate, MovimientoUpdate
from mysql.connector import Error

router = APIRouter(prefix="/api/movimientos", tags=["Movimientos"])

@router.post("", status_code=201)
def crear_movimiento(payload: MovimientoCreate):
    db = get_db()
    try:
        cur = db.cursor(dictionary=True)
        # Validar categoria existe y pertenece al usuario y tipo coincide
        cur.execute("SELECT id_categoria, tipo, id_usuario FROM categorias WHERE id_categoria=%s", (payload.id_categoria,))
        cat = cur.fetchone()
        if not cat:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        if cat["id_usuario"] != payload.id_usuario:
            raise HTTPException(status_code=400, detail="La categoría no pertenece al usuario")
        if cat["tipo"] != payload.tipo:
            raise HTTPException(status_code=400, detail=f"Tipo inconsistente: categoría es '{cat['tipo']}' pero movimiento es '{payload.tipo}'")

        # Validar usuario existe
        cur.execute("SELECT id_usuario FROM usuarios WHERE id_usuario=%s", (payload.id_usuario,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        cur2 = db.cursor()
        cur2.execute(
            """INSERT INTO ingresos_gastos (id_usuario, id_categoria, tipo, monto, fecha, descripcion)
               VALUES (%s,%s,%s,%s,%s,%s)""",
            (payload.id_usuario, payload.id_categoria, payload.tipo, payload.monto, payload.fecha, payload.descripcion)
        )
        db.commit()
        return {"id_movimiento": cur2.lastrowid, "mensaje": "Movimiento registrado"}
    except HTTPException:
        raise
    except Error as e:
        if db:
            db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@router.get("", status_code=200)
def listar_movimientos(
    id_usuario: int = Query(..., gt=0),
    desde: Optional[date] = None,
    hasta: Optional[date] = None,
    categoria: Optional[int] = Query(None, gt=0, description="id_categoria"),
    tipo: Optional[str] = Query(None, pattern="^(ingreso|gasto)$"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    db = get_db()
    try:
        cur = db.cursor(dictionary=True)
        query = """
            SELECT m.id_movimiento, m.id_usuario, m.id_categoria, c.nombre as categoria_nombre, c.tipo as categoria_tipo,
                   m.tipo, m.monto, m.fecha, m.descripcion, m.fecha_creacion
            FROM ingresos_gastos m
            JOIN categorias c ON m.id_categoria = c.id_categoria
            WHERE m.id_usuario=%s
        """
        params = [id_usuario]
        if desde:
            query += " AND m.fecha >= %s"
            params.append(desde)
        if hasta:
            query += " AND m.fecha <= %s"
            params.append(hasta)
        if categoria:
            query += " AND m.id_categoria = %s"
            params.append(categoria)
        if tipo:
            query += " AND m.tipo = %s"
            params.append(tipo)

        query += " ORDER BY m.fecha DESC, m.id_movimiento DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        cur.execute(query, tuple(params))
        rows = cur.fetchall()
        # Convertir Decimal y date a serializable
        for r in rows:
            r["monto"] = float(r["monto"])
            r["fecha"] = r["fecha"].isoformat() if hasattr(r["fecha"], "isoformat") else str(r["fecha"])
            if r.get("fecha_creacion"):
                r["fecha_creacion"] = r["fecha_creacion"].isoformat() if hasattr(r["fecha_creacion"], "isoformat") else str(r["fecha_creacion"])
        return rows
    finally:
        db.close()

@router.get("/{id_movimiento}", status_code=200)
def obtener_movimiento(id_movimiento: int):
    db = get_db()
    try:
        cur = db.cursor(dictionary=True)
        cur.execute("""
            SELECT m.*, c.nombre as categoria_nombre
            FROM ingresos_gastos m JOIN categorias c ON m.id_categoria=c.id_categoria
            WHERE m.id_movimiento=%s
        """, (id_movimiento,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Movimiento no encontrado")
        row["monto"] = float(row["monto"])
        row["fecha"] = row["fecha"].isoformat()
        if row.get("fecha_creacion"):
            row["fecha_creacion"] = row["fecha_creacion"].isoformat()
        return row
    finally:
        db.close()

@router.put("/{id_movimiento}", status_code=200)
def actualizar_movimiento(id_movimiento: int, payload: MovimientoUpdate):
    db = get_db()
    try:
        cur = db.cursor(dictionary=True)
        cur.execute("SELECT * FROM ingresos_gastos WHERE id_movimiento=%s", (id_movimiento,))
        mov = cur.fetchone()
        if not mov:
            raise HTTPException(status_code=404, detail="Movimiento no encontrado")

        # Determinar nuevos valores
        id_categoria = payload.id_categoria if payload.id_categoria is not None else mov["id_categoria"]
        tipo = payload.tipo if payload.tipo is not None else mov["tipo"]
        monto = payload.monto if payload.monto is not None else float(mov["monto"])
        fecha = payload.fecha if payload.fecha is not None else mov["fecha"]
        descripcion = payload.descripcion if payload.descripcion is not None else mov["descripcion"]

        # Validar categoria y tipo
        cur.execute("SELECT tipo, id_usuario FROM categorias WHERE id_categoria=%s", (id_categoria,))
        cat = cur.fetchone()
        if not cat:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        if cat["tipo"] != tipo:
            raise HTTPException(status_code=400, detail=f"Tipo inconsistente con categoría ({cat['tipo']})")
        if cat["id_usuario"] != mov["id_usuario"]:
            raise HTTPException(status_code=400, detail="Categoría no pertenece al mismo usuario del movimiento")

        cur2 = db.cursor()
        cur2.execute(
            "UPDATE ingresos_gastos SET id_categoria=%s, tipo=%s, monto=%s, fecha=%s, descripcion=%s WHERE id_movimiento=%s",
            (id_categoria, tipo, monto, fecha, descripcion, id_movimiento)
        )
        db.commit()
        return {"mensaje": "Movimiento actualizado", "id_movimiento": id_movimiento}
    except HTTPException:
        raise
    except Error as e:
        if db:
            db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@router.delete("/{id_movimiento}", status_code=200)
def eliminar_movimiento(id_movimiento: int):
    db = get_db()
    try:
        cur = db.cursor()
        cur.execute("SELECT id_movimiento FROM ingresos_gastos WHERE id_movimiento=%s", (id_movimiento,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Movimiento no encontrado")
        cur.execute("DELETE FROM ingresos_gastos WHERE id_movimiento=%s", (id_movimiento,))
        db.commit()
        return {"mensaje": "Movimiento eliminado"}
    except HTTPException:
        raise
    except Error as e:
        if db:
            db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
