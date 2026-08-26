import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

# Umbral elegido por usuario: código actual (1.5) no spec (2.0)
UMBRAL_Z_DEFAULT = 1.5

def cargar_datos(conn, id_usuario: int) -> pd.DataFrame:
    query = """
        SELECT m.fecha, m.tipo, m.monto, m.id_categoria, c.nombre as categoria_nombre, m.descripcion, m.id_movimiento
        FROM ingresos_gastos m
        JOIN categorias c ON m.id_categoria = c.id_categoria
        WHERE m.id_usuario = %s
    """
    df = pd.read_sql(query, conn, params=(id_usuario,))
    if not df.empty:
        df['fecha'] = pd.to_datetime(df['fecha'])
        df['mes'] = df['fecha'].dt.to_period('M').astype(str)  # YYYY-MM para JSON
        df['monto'] = df['monto'].astype(float)
        # Para agrupar por mes ordenado
        df['mes_period'] = pd.to_datetime(df['fecha']).dt.to_period('M')
    return df

def predecir_gasto_proximo_mes(df: pd.DataFrame) -> dict:
    gastos = df[df['tipo'] == 'gasto'] if not df.empty else pd.DataFrame()
    if gastos.empty:
        return {
            "prediccion": 0.0,
            "prediccion_proximo_mes": 0.0,
            "confianza": "baja",
            "razon": "Sin registros de gastos",
            "metodo": "regresion_lineal",
            "detalle_por_categoria": {}
        }

    # Agrupar por mes_period para ordenar cronológicamente
    resumen_mensual = gastos.groupby('mes_period')['monto'].sum().reset_index().sort_values('mes_period')
    cant_meses = len(resumen_mensual)

    if cant_meses < 2:
        promedio = float(resumen_mensual['monto'].mean())
        # detalle por categoria: promedio mensual por categoria
        detalle = gastos.groupby('categoria_nombre')['monto'].mean().round(2).to_dict()
        return {
            "prediccion": round(promedio, 2),
            "prediccion_proximo_mes": round(promedio, 2),
            "confianza": "baja",
            "razon": f"Datos insuficientes (<2 meses, {cant_meses} mes). Se usó promedio simple.",
            "metodo": "promedio",
            "detalle_por_categoria": {k: float(v) for k, v in detalle.items()}
        }

    resumen_mensual['n_mes'] = range(cant_meses)
    X = resumen_mensual[['n_mes']]
    y = resumen_mensual['monto']

    modelo = LinearRegression()
    modelo.fit(X, y)

    siguiente_mes_idx = np.array([[cant_meses]])
    prediccion = modelo.predict(siguiente_mes_idx)[0]
    prediccion_final = max(0.0, float(prediccion))

    confianza = "alta" if cant_meses >= 6 else "media"
    # R2 para info adicional si hay suficientes puntos
    try:
        r2 = modelo.score(X, y)
    except:
        r2 = 0

    detalle = gastos.groupby('categoria_nombre')['monto'].mean().round(2).to_dict()

    return {
        "prediccion": round(prediccion_final, 2),
        "prediccion_proximo_mes": round(prediccion_final, 2),
        "confianza": confianza,
        "razon": f"Regresión Lineal con {cant_meses} meses (R2={round(r2,2)})",
        "metodo": "regresion_lineal",
        "r2": round(float(r2), 3),
        "meses_procesados": cant_meses,
        "historico_mensual": [
            {"mes": str(row['mes_period']), "total": float(row['monto'])}
            for _, row in resumen_mensual.iterrows()
        ],
        "detalle_por_categoria": {k: float(v) for k, v in detalle.items()}
    }

def detectar_anomalias(df: pd.DataFrame, umbral_z: float = UMBRAL_Z_DEFAULT) -> list:
    if df.empty:
        return []
    gastos = df[df['tipo'] == 'gasto'].copy()
    if gastos.empty or len(gastos) < 2:
        return []

    # Estadísticas por categoría
    stats = gastos.groupby('id_categoria')['monto'].agg(['mean', 'std', 'count']).reset_index()
    stats['std'] = stats['std'].fillna(0)

    gastos = gastos.merge(stats, on='id_categoria', suffixes=('', '_stats'))

    # Z-score, evita división por cero
    gastos['z_score'] = np.where(
        gastos['std'] > 0,
        (gastos['monto'] - gastos['mean']) / gastos['std'],
        0
    )

    # Solo categorías con al menos 2 movimientos y std >0 pueden generar anomalías reales
    # Pero permitimos que si hay 2+ y uno muy alejado se detecte
    anomalias = gastos[gastos['z_score'].abs() > umbral_z].copy()

    resultado = []
    for _, row in anomalias.iterrows():
        resultado.append({
            "id_movimiento": int(row['id_movimiento']),
            "fecha": row['fecha'].strftime('%Y-%m-%d'),
            "id_categoria": int(row['id_categoria']),
            "categoria": str(row['categoria_nombre']),
            "monto": float(row['monto']),
            "descripcion": str(row['descripcion']) if pd.notna(row['descripcion']) else "",
            "promedio_categoria": float(round(row['mean'], 2)),
            "desviacion_categoria": float(round(row['std'], 2)),
            "z_score": round(float(row['z_score']), 2),
            "umbral": umbral_z
        })
    # Ordenar por z_score descendente (más anómalo primero)
    resultado.sort(key=lambda x: abs(x['z_score']), reverse=True)
    return resultado
