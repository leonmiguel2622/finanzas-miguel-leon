from fastapi import APIRouter, Query, HTTPException
from typing import Optional
try:
    from database import get_db
except ImportError:
    from backend.database import get_db
from datetime import datetime
import calendar

router = APIRouter(prefix="/api/resumen", tags=["Resumen"])

@router.get("", status_code=200)
def obtener_resumen(
    id_usuario: int = Query(..., gt=0),
    mes: Optional[str] = Query(None, description="YYYY-MM o YYYY-MM-DD"),
    desde: Optional[str] = None,
    hasta: Optional[str] = None
):
    db = get_db()
    try:
        cur = db.cursor(dictionary=True)

        # Construir filtro de fecha
        params = [id_usuario]
        where_fecha = ""
        # Si se pasa mes, filtra ese mes
        if mes:
            # Normalizar mes
            try:
                if len(mes) == 7:  # YYYY-MM
                    y, m = map(int, mes.split("-"))
                    last_day = calendar.monthrange(y, m)[1]
                    desde_f = f"{y}-{m:02d}-01"
                    hasta_f = f"{y}-{m:02d}-{last_day}"
                elif len(mes) == 10:
                    desde_f = hasta_f = mes
                else:
                    raise ValueError
                where_fecha = " AND fecha BETWEEN %s AND %s"
                params.extend([desde_f, hasta_f])
            except:
                raise HTTPException(status_code=400, detail="Parámetro mes inválido, use YYYY-MM")
        elif desde or hasta:
            if desde and hasta:
                where_fecha = " AND fecha BETWEEN %s AND %s"
                params.extend([desde, hasta])
            elif desde:
                where_fecha = " AND fecha >= %s"
                params.append(desde)
            elif hasta:
                where_fecha = " AND fecha <= %s"
                params.append(hasta)

        # Totales
        cur.execute(f"""
            SELECT
                COALESCE(SUM(CASE WHEN tipo='ingreso' THEN monto ELSE 0 END),0) as total_ingresos,
                COALESCE(SUM(CASE WHEN tipo='gasto' THEN monto ELSE 0 END),0) as total_gastos,
                COUNT(*) as total_movimientos
            FROM ingresos_gastos WHERE id_usuario=%s {where_fecha}
        """, tuple(params))
        row = cur.fetchone()
        ingresos = float(row["total_ingresos"] or 0)
        gastos = float(row["total_gastos"] or 0)
        balance = ingresos - gastos
        porcentaje = round((balance / ingresos * 100), 2) if ingresos > 0 else 0

        # Por categoría (solo gastos)
        cur.execute(f"""
            SELECT c.nombre as categoria, c.id_categoria, SUM(m.monto) as total, COUNT(*) as cantidad
            FROM ingresos_gastos m JOIN categorias c ON m.id_categoria=c.id_categoria
            WHERE m.id_usuario=%s AND m.tipo='gasto' {where_fecha}
            GROUP BY c.id_categoria, c.nombre ORDER BY total DESC
        """, tuple(params))
        por_categoria = [{"categoria": r["categoria"], "id_categoria": r["id_categoria"], "total": float(r["total"]), "cantidad": int(r["cantidad"])} for r in cur.fetchall()]

        # Por mes (últimos 12 meses o rango filtrado)
        cur.execute(f"""
            SELECT DATE_FORMAT(fecha, '%Y-%m') as mes,
                   SUM(CASE WHEN tipo='ingreso' THEN monto ELSE 0 END) as ingresos,
                   SUM(CASE WHEN tipo='gasto' THEN monto ELSE 0 END) as gastos
            FROM ingresos_gastos WHERE id_usuario=%s {where_fecha}
            GROUP BY mes ORDER BY mes ASC
        """, tuple(params))
        por_mes = [{"mes": r["mes"], "ingresos": float(r["ingresos"] or 0), "gastos": float(r["gastos"] or 0)} for r in cur.fetchall()]

        # Si no hay filtro, traer últimos 6 meses para tendencia
        if not where_fecha and not por_mes:
            por_mes = []

        return {
            "id_usuario": id_usuario,
            "total_ingresos": ingresos,
            "total_gastos": gastos,
            "balance": balance,
            "porcentaje_ahorro": porcentaje,
            "total_movimientos": int(row["total_movimientos"] or 0),
            "gastos_por_categoria": por_categoria,
            "tendencia_mensual": por_mes
        }
    finally:
        db.close()
