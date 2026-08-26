# Finanzas Personales — Dashboard Analítico 

Aplicación web full-stack para registrar ingresos/gastos, visualizar ahorro, categorías, tendencia mensual, predicción próximo mes (Regresión Lineal) y anomalías (Z-Score |Z|>1.5). Proyecto ADSO basado en el repositorio de la actividad Carchaloneo22.

## Tecnologías
- **Frontend:** HTML5, CSS3 (morado #7C3AED), JavaScript `fetch` async/await, Chart.js 4.4
- **Backend:** Python 3.9+, FastAPI, Pydantic, mysql-connector-python, bcrypt
- **BD:** MySQL 8.0+, 3FN, índices `idx_mov_usuario_fecha`, `idx_mov_categoria`
- **Analítica:** Pandas + Scikit-learn (LinearRegression + Z-Score por categoría)

## Arquitectura
```
Frontend HTML/CSS/JS+Chart.js --fetch/JSON--> FastAPI (routes/services/database) --mysql--> MySQL
                                                      |-> services/analitica_service.py (Pandas/Sklearn) -> JSON -> Dashboard
```

## Estructura
```
finanzas miguel leon/
├── backend/
│   ├── app.py, config.py, database.py, requirements.txt
│   ├── models/schemas.py
│   ├── routes/ usuarios.py, auth.py, categorias.py, movimientos.py, resumen.py, analitica.py
│   ├── services/analitica_service.py
│   └── utils/security.py (bcrypt)
├── frontend/
│   ├── index.html (dashboard), login.html, register.html
│   ├── css/style.css
│   └── js/api.js, charts.js, app.js
├── database/schema.sql, seed.sql
└── README.md
```

## Modelo de Datos (3FN)
- **usuarios**(id_usuario PK, nombre, correo UNIQUE, contrasena_hash, fecha_registro)
- **categorias**(id_categoria PK, nombre, tipo ENUM, id_usuario FK CASCADE, UNIQUE(id_usuario,nombre))
- **ingresos_gastos**(id_movimiento PK, id_usuario FK CASCADE, id_categoria FK RESTRICT, tipo ENUM, monto DECIMAL12,2, fecha, descripcion, fecha_creacion)
- Índices: `idx_mov_usuario_fecha`, `idx_mov_categoria`, `idx_categoria_usuario`

## API REST
Base `http://127.0.0.1:8000`
- `POST /api/usuarios` {nombre,correo,contrasena} -> crea 6 categorías por defecto
- `POST /api/auth/login` {correo,contrasena}
- `GET /api/categorias?id_usuario=`
- `POST /api/categorias` {nombre,tipo,id_usuario}
- `PUT /api/categorias/{id}` {nombre,tipo}
- `DELETE /api/categorias/{id}`
- `POST /api/movimientos` {id_usuario,id_categoria,tipo,monto,fecha,descripcion}
- `GET /api/movimientos?id_usuario=&desde=&hasta=&categoria=&tipo=` (filtros)
- `PUT /api/movimientos/{id}`
- `DELETE /api/movimientos/{id}`
- `GET /api/resumen?id_usuario=&mes=YYYY-MM` -> {total_ingresos,total_gastos,balance,porcentaje_ahorro,gastos_por_categoria,tendencia_mensual}
- `GET /api/analitica/prediccion?id_usuario=` -> {prediccion,confianza,metodo,historico_mensual,detalle_por_categoria}
- `GET /api/analitica/anomalias?id_usuario=&umbral=1.5` -> {anomalias:[{categoria,fecha,monto,promedio_categoria,z_score}]}

Ver `http://127.0.0.1:8000/docs` (Swagger).

## Instalación

### 1. Clonar
```bash
git clone https://github.com/tu-usuario/finanzas-personales.git
cd "finanzas miguel leon"
```

### 2. Base de datos (MySQL)
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
# Usuario demo: ana@example.com / 12345678  (hash se re-crea al registrar, seed usa placeholder)
# Si el hash del seed no valida, registra un usuario nuevo en /register.html
```

### 3. Backend
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env   # editar si tu MySQL tiene password/puerto distinto
python app.py
# o: uvicorn app:app --reload --port 8000
# API en http://127.0.0.1:8000 , docs en /docs
```

### 4. Frontend
Abre `frontend/login.html` o `frontend/register.html` en navegador (Live Server o doble click). El dashboard es `frontend/index.html` y requiere login (guarda `id_usuario` en localStorage).

Si cambias puerto/host API:
```js
localStorage.setItem('API_URL','http://127.0.0.1:8000/api')
```

## Módulo Analítico
- **Predicción:** `services/analitica_service.py:predecir_gasto_proximo_mes` agrupa gastos por mes (`Period M`), `LinearRegression(n_mes -> total)`. Si `<2 meses` usa promedio. `predicción = max(0, pred)`. Confianza: `alta>=6 meses`, `media 2-5`, `baja<2`. Retorna `historico_mensual` y `detalle_por_categoria`.
- **Anomalías:** `detectar_anomalias(umbral_z=1.5)` por categoría. `Z=(monto-mean)/std`. `std NaN->0`, evita división por cero. Solo `|Z|>1.5` (elegido en diseño, spec pedía 2.0). Retorna ordenado por |Z|.

Si datos insuficientes, el API responde `confianza:baja` y `razon` explicativa; el frontend lo muestra en `card-predicción-sub`.

## Seguridad
- Contraseñas con `bcrypt` (12 rounds) en `utils/security.py`, nunca texto plano.
- Validación Pydantic, `CHECK monto>0`, `correo REGEXP`, `tipo` validado contra `categoria.tipo`.
- CORS abierto (ajustar a dominios específicos en prod).

## Frontend
- Morado primario #7C3AED, responsive `grid auto-fit` + media queries 900/600/420px.
- `fetch` con `try/catch`, spinners, estados vacíos, mensajes error.
- Charts dinámicos: dona `gastos_por_categoria`, línea `tendencia_mensual`, con `Chart.js` y datos reales de `/api/resumen`.

## Rúbrica (100pts)
BD 15 | API 20 | Frontend 20 | Analítico 25 | Chart.js 10 | Doc 10

## Usuario demo
- **Ana:** `ana@example.com` / `12345678` (6 meses de datos + anomalía Salud 800k julio)
- O registra nuevo en `register.html` (crea 6 categorías automáticamente).

## Deploy a GitHub
- No subas `.env` (está en `.gitignore`), sube `.env.example`.
- Incluye `database/` y `frontend/` tal cual.
- Para cloud: backend en Render/Railway, DB en PlanetScale/Railway MySQL, frontend en Vercel/Netlify (cambia `API_URL`).

---
Hecho para ADSO — Miguel Leon.
