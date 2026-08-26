from fastapi import APIRouter, Query
from database import get_db
from services.analitica_service import cargar_datos, predecir_gasto_proximo_mes, detectar_anomalias, UMBRAL_Z_DEFAULT

router = APIRouter(prefix="/api/analitica", tags=["Analítica"])

@router.get("/prediccion")
def get_prediccion(id_usuario: int = Query(..., gt=0)):
    db = get_db()
    try:
        df = cargar_datos(db, id_usuario)
        res = predecir_gasto_proximo_mes(df)
        return {"id_usuario": id_usuario, **res}
    finally:
        db.close()

@router.get("/anomalias")
def get_anomalias(
    id_usuario: int = Query(..., gt=0),
    umbral: float = Query(UMBRAL_Z_DEFAULT, ge=0.5, le=5.0, description="Umbral Z-score, por defecto 1.5")
):
    db = get_db()
    try:
        df = cargar_datos(db, id_usuario)
        anomalias = detectar_anomalias(df, umbral_z=umbral)
        return {"id_usuario": id_usuario, "umbral_z": umbral, "total_anomalias": len(anomalias), "anomalias": anomalias}
    finally:
        db.close()
