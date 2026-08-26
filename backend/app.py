from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import config
from routes import usuarios, auth, categorias, movimientos, resumen, analitica

app = FastAPI(
    title="Finanzas Personales API",
    description="API REST para finanzas personales con módulo analítico Pandas + Scikit-learn",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(usuarios.router)
app.include_router(auth.router)
app.include_router(categorias.router)
app.include_router(movimientos.router)
app.include_router(resumen.router)
app.include_router(analitica.router)

@app.get("/", tags=["Root"])
def root():
    return {
        "mensaje": "API Finanzas Personales funcionando",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": [
            "POST /api/usuarios",
            "POST /api/auth/login",
            "GET /api/categorias",
            "POST /api/categorias",
            "PUT /api/categorias/{id}",
            "DELETE /api/categorias/{id}",
            "POST /api/movimientos",
            "GET /api/movimientos",
            "PUT /api/movimientos/{id}",
            "DELETE /api/movimientos/{id}",
            "GET /api/resumen",
            "GET /api/analitica/prediccion",
            "GET /api/analitica/anomalias"
        ]
    }

@app.get("/health", tags=["Root"])
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host=config.API_HOST, port=config.API_PORT, reload=True)
