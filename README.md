# FACES UC · Sistema de Constancias de Notas de Postgrado

Sistema interno para la **Facultad de Ciencias Económicas y Sociales (FACES)** de la
**Universidad de Carabobo (UC)**. Permite que una profesora/administradora inicie sesión,
busque un estudiante por cédula, revise su expediente y descargue una constancia de notas
en formato `.docx` generada a partir de una plantilla institucional de Microsoft Word.

---

## 1. Arquitectura general

```text
┌──────────────────────┐        HTTP /api        ┌───────────────────────┐
│  Frontend React SPA  │ ──────────────────────▶ │   Backend Node/Express │
│  Vite + Tailwind     │                         │   TypeScript + Prisma  │
│  Nginx (producción)  │ ◀────────────────────── │   JWT + bcryptjs       │
└──────────────────────┘    .docx / JSON          └───────────┬───────────┘
                                                              │ SQL
                                                              ▼
                                                   ┌───────────────────────┐
                                                   │ PostgreSQL 16         │
                                                   │ Esquema 3FN           │
                                                   └───────────────────────┘
                                                              │
                              ┌───────────────────────────────┴──────────────┐
                              │  docxtemplater + pizzip + Notas.docx          │
                              │  Plantilla Word con etiquetas {{ ... }}       │
                              └──────────────────────────────────────────────┘
```

Servicios de Docker Compose:

- `db`: PostgreSQL 16 con volumen persistente `facesuc-pgdata`.
- `backend`: API Node.js/TypeScript en el puerto interno `4000`.
- `frontend`: build de React servido por Nginx en el puerto `80` (expuesto como `5173`).
- `facesuc-net`: red interna para que Nginx resuelva `backend:4000`.

---

## 2. Inicio rápido con Docker

### 2.1 Requisitos

- Docker Engine 24+ y Docker Compose v2.
- Archivo `backend/data/baseDeDatosSistemaConstancia.csv` (dataset real).
- Opcional: una plantilla `backend/templates/Notas.docx` propia. Si no existe, el
  contenedor genera una plantilla base automáticamente.

### 2.2 Configurar variables

```bash
cp .env.example .env
# Edite .env: cambie POSTGRES_PASSWORD, JWT_SECRET, ADMIN_PASSWORD, etc.
```

### 2.3 Levantar los servicios

```bash
docker compose up -d --build
```

Esto:

1. Crea la base de datos.
2. Sincroniza el esquema Prisma (`prisma db push`).
3. Genera `templates/Notas.docx` si no existe.
4. Crea/actualiza el usuario administrador definido en `.env`.
5. Inicia la API y el frontend.

Abrir: **http://localhost:5173**

Credenciales iniciales (según `.env`):

```text
Cédula:    12345678
Contraseña: Cambiar123!
```

> Cambie la contraseña en `.env` y reinicie el backend para actualizarla. El seed es
> idempotente y actualiza el hash en cada arranque.

### 2.4 Importar el dataset CSV

Con los contenedores levantados:

```bash
docker compose exec backend node dist/scripts/importCsv.js /app/data/baseDeDatosSistemaConstancia.csv
```

> El contenedor de producción solo instala dependencias de ejecución. Por eso los
> scripts dentro de Docker se ejecutan desde `dist/` con `node`, no con `tsx`/npm.
> Los comandos `npm run ...` son para desarrollo local.

También se puede importar automáticamente al arrancar:

```env
IMPORT_CSV_ON_START=true
CSV_PATH=/app/data/baseDeDatosSistemaConstancia.csv
```

El importador es idempotente: puede ejecutarse varias veces sin duplicar notas, gracias a
las restricciones `UNIQUE` y a `skipDuplicates`.

### 2.5 Probar con datos de ejemplo

```bash
cd backend
cp data/baseDeDatosSistemaConstancia.sample.csv data/baseDeDatosSistemaConstancia.csv
npm run import:csv
```

Estudiantes de prueba del CSV de ejemplo:

| Cédula | Nombre | Programa |
|---|---|---|
| `12345678` | Ana María Pérez Rojas | Maestría en Gerencia Empresarial |
| `87654321` | Luis Alberto Gómez Silva | Especialización en Finanzas |

---

## 3. Flujo funcional

```text
Login (cédula + contraseña)
        │
        ▼
Panel principal
        │  Buscar por cédula (validación 5–9 dígitos)
        ▼
GET /api/constancias/:cedula
        │
        ├── Tarjeta resumen: nombre, programa, créditos, índice académico
        ├── Tabla de notas con nota numérica y en letras
        └── Botón "Descargar Constancia (.docx)"
                    │
                    ▼
        GET /api/constancias/download/:cedula
                    │
                    ▼
        docxtemplater inyecta datos en Notas.docx
                    │
                    ▼
        El navegador muestra el diálogo "Guardar como"
        (File System Access API; si no está disponible,
         descarga directa con <a download>)
```

---

## 4. Estructura del proyecto

```text
facesuc/
├── docker-compose.yml            # PostgreSQL + Backend + Frontend + red interna
├── .env.example                  # Variables para Docker Compose
├── .gitignore
├── README.md                     # Este documento
│
├── backend/
│   ├── Dockerfile                # Multi-stage build (TypeScript → producción)
│   ├── docker-entrypoint.sh      # Espera DB, db push, seed admin, import opcional
│   ├── .dockerignore
│   ├── .env.example              # Variables para desarrollo local
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   │
│   ├── prisma/
│   │   └── schema.prisma         # Modelos ORM (fuente de verdad)
│   │
│   ├── db/
│   │   └── schema.sql            # Esquema SQL equivalente, 3FN (referencia/manual)
│   │
│   ├── data/
│   │   ├── README.md
│   │   └── baseDeDatosSistemaConstancia.sample.csv
│   │
│   ├── templates/
│   │   ├── README.md             # Guía de etiquetas {{ ... }}
│   │   └── Notas.docx            # Plantilla (generada o personalizada)
│   │
│   ├── scripts/
│   │   ├── importCsv.ts          # CSV desnormalizado → tablas 3FN
│   │   ├── seedAdmin.ts          # Usuario administrador inicial
│   │   └── createTemplate.ts     # Genera plantilla Word base
│   │
│   └── src/
│       ├── server.ts             # Arranque HTTP y apagado ordenado
│       ├── app.ts                # Express, CORS, Helmet, rutas, errores
│       ├── config/env.ts         # Validación de variables con Zod
│       ├── lib/prisma.ts         # Cliente Prisma singleton
│       ├── types/auth.ts         # Tipos de JWT y request autenticado
│       ├── middleware/
│       │   ├── auth.ts           # Verifica Bearer JWT
│       │   └── errorHandler.ts   # Respuestas uniformes de error
│       ├── routes/
│       │   ├── auth.routes.ts    # POST /login, GET /me
│       │   └── constancias.routes.ts # Vista previa y descarga .docx
│       ├── services/
│       │   ├── auth.service.ts   # bcrypt + JWT
│       │   ├── constancia.service.ts # Consulta, cálculos y datos de plantilla
│       │   └── docx.service.ts   # docxtemplater + pizzip
│       └── utils/
│           ├── AppError.ts
│           ├── asyncHandler.ts
│           ├── cedula.ts         # Normalización/validación de cédula
│           ├── format.ts         # Números con coma decimal
│           └── numberToWords.ts  # 18 → "Dieciocho"
│
└── frontend/
    ├── Dockerfile                # Build Vite → Nginx
    ├── nginx.conf                # SPA + proxy /api → backend:4000
    ├── .dockerignore
    ├── .env.example
    ├── package.json
    ├── package-lock.json
    ├── tsconfig.json
    ├── vite.config.ts            # Proxy de desarrollo
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.tsx              # Punto de entrada + Router
        ├── App.tsx               # Rutas /login y / protegida
        ├── index.css             # Tailwind + componentes base
        ├── api/client.ts         # Tipos y llamadas HTTP
        ├── context/AuthContext.tsx # Sesión JWT persistida
        ├── utils/download.ts     # Diálogo Guardar como / fallback
        ├── components/
        │   ├── ProtectedRoute.tsx
        │   ├── LoginForm.tsx
        │   ├── SearchBar.tsx
        │   ├── StudentSummary.tsx
        │   └── NotesTable.tsx
        └── pages/
            ├── LoginPage.tsx
            └── DashboardPage.tsx
```

---

## 5. Base de datos (3FN)

El dataset original es desnormalizado (27 columnas, una fila por nota). Se normaliza así:

| Tabla | Propósito | Claves / restricciones |
|---|---|---|
| `programas` | Catálogo de postgrados | `codigo_programa` único |
| `estudiantes` | Datos del alumno | `cedula` única, FK a `programas` |
| `asignaturas` | Catálogo de materias | `codigo_asignatura` único, FK a `programas`, `uc`, `nivel` |
| `usuarios` | Docentes/administradores | `cedula` única, `password_hash` bcrypt, rol/activo |
| `historico_notas` | Hecho académico | FKs a estudiante/asignatura; único por estudiante + asignatura + período + año |

Decisiones de normalización:

- El nombre del programa y su descripción viven una sola vez en `programas`.
- La descripción, UC y nivel de la materia viven en `asignaturas`, no repetidos por fila.
- Las notas referencian IDs, no texto duplicado.
- El nombre del profesor se conserva como dato histórico de la nota (`nombre_profesor`),
  porque puede cambiar entre períodos y la constancia debe reflejar el registro original.
- `periodo_lectivo` y `anno_lectivo` se guardan en el hecho académico para permitir
  múltiples períodos y repeticiones de una materia.

El archivo `backend/db/schema.sql` contiene el DDL equivalente para auditoría o creación
manual. La aplicación usa `prisma db push` para sincronizar el esquema.

> Supuestos del dataset: cada cédula pertenece a un programa de postgrado y el código de
> asignatura es único. Si en su institución un estudiante cursa varios programas a la vez,
> el modelo puede extenderse con una tabla de inscripción `estudiante_programa` y un
> selector de programa en el panel.

---

## 6. Plantilla Word `Notas.docx`

Sintaxis configurada en el backend:

```text
Etiquetas simples: {{nombres}}
Bucle de materias: {{#materias}} ... {{/materias}}
```

Etiquetas principales:

| Etiqueta | Contenido |
|---|---|
| `{{nombres}}` | Nombre completo |
| `{{cedula}}` | Cédula solo dígitos |
| `{{cedula_formateada}}` | Cédula con formato `V-12.345.678` |
| `{{programa}}` / `{{programa_codigo}}` | Programa de postgrado |
| `{{total_asignaturas}}` | Cantidad de registros |
| `{{total_creditos}}` | Créditos cursados |
| `{{creditos_aprobados}}` | Créditos aprobados |
| `{{indice_academico}}` | Índice con 2 decimales y coma (`18,33`) |
| `{{fecha_actual}}` | Fecha actual en español |
| `{{ultimo_periodo}}` | Último período registrado |

Dentro del bucle `{{#materias}} ... {{/materias}}`:

`{{codigo}}`, `{{asignatura}}`, `{{nivel}}`, `{{uc}}`, `{{periodo_lectivo}}`,
`{{anno_lectivo}}`, `{{periodo}}`, `{{seccion}}`, `{{nota}}`, `{{nota_letras}}`,
`{{aprobada}}` (`SI`/`NO`), `{{profesor}}`, `{{calculo_promedio}}`.

La fila de la tabla que contiene `{{#materias}}` al inicio y `{{/materias}}` al final se
clona una vez por asignatura. Guía detallada: [`backend/templates/README.md`](backend/templates/README.md).

Generar la plantilla base:

```bash
cd backend
npm run template:create
```

El contenedor la genera automáticamente si no existe. Para reemplazarla, edite
`backend/templates/Notas.docx`; el volumen de Compose la refleja sin reconstruir la imagen.

---

## 7. API

Base: `http://localhost:4000/api` (o `/api` a través de Nginx).

### 7.1 Login

```http
POST /api/auth/login
Content-Type: application/json

{ "cedula": "12345678", "password": "Cambiar123!" }
```

Respuesta:

```json
{
  "token": "eyJhbGciOi...",
  "usuario": { "id": 1, "cedula": "12345678", "nombre": "Prof. Administradora FACES", "rol": "ADMIN" }
}
```

También acepta `{ "usuario": "..." }` como alias de cédula.

### 7.2 Usuario actual

```http
GET /api/auth/me
Authorization: Bearer <token>
```

### 7.3 Vista previa del expediente

```http
GET /api/constancias/:cedula
Authorization: Bearer <token>
```

Respuesta resumida:

```json
{
  "nombres": "Ana María Pérez Rojas",
  "cedula": "12345678",
  "cedula_formateada": "V-12.345.678",
  "programa": "Maestría en Gerencia Empresarial",
  "programa_codigo": "001",
  "total_asignaturas": 5,
  "total_creditos": 18,
  "creditos_aprobados": 18,
  "indice_academico": "18,22",
  "fecha_actual": "8 de noviembre de 2026",
  "ultimo_periodo": "1-2025",
  "materias": [
    {
      "codigo": "MGE-01",
      "asignatura": "Gerencia Estratégica",
      "nivel": 1,
      "uc": 4,
      "periodo_lectivo": "1-2024",
      "anno_lectivo": "2024",
      "periodo": "1-2024",
      "seccion": "A",
      "nota": "18",
      "nota_letras": "Dieciocho",
      "aprobada": "SI",
      "profesor": "Prof. Luis Martínez",
      "calculo_promedio": "18"
    }
  ]
}
```

### 7.4 Descarga `.docx`

```http
GET /api/constancias/download/:cedula
Authorization: Bearer <token>
```

Respuesta con cabeceras:

```http
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename="Constancia_Notas_12345678.docx"
```

Ejemplo con `curl`:

```bash
TOKEN=$(curl -s http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"cedula":"12345678","password":"Cambiar123!"}' | jq -r .token)

curl -L -o Constancia.docx \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/constancias/download/12345678
```

### 7.5 Salud

```http
GET /api/health
```

---

## 8. Cálculos realizados por el backend

- **Créditos cursados**: suma de `uc` de todas las notas del estudiante.
- **Créditos aprobados**: suma de `uc` de las notas con `aprobada = true`.
- **Índice académico**: promedio ponderado por UC:

```text
índice = Σ (nota_final × uc) / Σ uc
```

Se formatea siempre con dos decimales y coma decimal, por ejemplo `18,33`.
- **Nota en letras**: conversión a español (`18` → `Dieciocho`, `20` → `Veinte`,
  `18.5` → `Dieciocho coma cincuenta`).

---

## 9. Importación del CSV

El script `scripts/importCsv.ts`:

1. Lee el archivo con `csv-parse` y detecta separador `,` o `;`.
2. Normaliza encabezados (mayúsculas, tildes, espacios).
3. Acepta alias comunes de columnas (`nota`/`nota_final`, `ano_lectivo`/`anno_lectivo`, etc.).
4. Construye catálogos de programas, asignaturas y estudiantes.
5. Inserta por lotes con `createMany` + `skipDuplicates`.
6. Ignora filas sin cédula, programa, asignatura o nota válida, e informa el resumen.

Columnas mínimas requeridas: `cedula`, `nombres`, `codigo_programa`,
`codigo_asignatura`, `nota_final`.

Columnas reconocidas adicionales: `desc_programa`, `periodo_lectivo`, `anno_lectivo`,
`desc_asignatura`, `nivel`, `uc`, `seccion`, `aprobada`, `calculo_promedio`,
`nombre_profesor`. Cualquier otra columna del dataset de 27 se ignora sin error.

---

## 10. Desarrollo local (sin Docker)

### 10.1 Backend

Requiere PostgreSQL local.

```bash
cd backend
cp .env.example .env           # ajuste DATABASE_URL y JWT_SECRET
npm install
npx prisma generate
npx prisma db push
npm run template:create        # si no tiene Notas.docx
npm run seed:admin
npm run import:csv -- ./data/baseDeDatosSistemaConstancia.csv
npm run dev                    # http://localhost:4000
```

### 10.2 Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                    # http://localhost:5173
```

Vite redirige `/api` a `http://localhost:4000` mediante `VITE_PROXY_TARGET`.

### 10.3 Scripts útiles

| Comando | Descripción |
|---|---|
| `npm run build` | Compila TypeScript / build de producción |
| `npm run template:create` | Genera plantilla Word base |
| `npm run seed:admin` | Crea/actualiza administrador |
| `npm run import:csv` | Importa dataset CSV |
| `npm run prisma:push` | Sincroniza esquema con PostgreSQL |

---

## 11. Docker en detalle

### Backend (`backend/Dockerfile`)

- Etapa `build`: Node 20 Alpine, `npm ci`, `prisma generate`, compilación TS.
- Etapa `production`: solo dependencias de producción, Prisma Client generado,
  `dist/`, plantillas y entrypoint.
- Incluye `openssl` para los motores de Prisma en Alpine.

`docker-entrypoint.sh`:

1. Espera a PostgreSQL y ejecuta `prisma db push`.
2. Genera `Notas.docx` si no existe.
3. Ejecuta el seed del administrador.
4. Importa el CSV si `IMPORT_CSV_ON_START=true`.
5. Inicia la API.

### Frontend (`frontend/Dockerfile`)

- Etapa `build`: Node 20 Alpine + Vite.
- Etapa `production`: Nginx Alpine sirviendo `dist/`.
- `nginx.conf` hace proxy de `/api/` a `http://backend:4000` y soporta rutas SPA.

### Persistencia

- Volumen `facesuc-pgdata` para PostgreSQL.
- Volumen bind `./backend/templates:/app/templates` para cambiar la plantilla sin rebuild.
- Volumen bind `./backend/data:/app/data:ro` para el CSV.

### Comandos

```bash
docker compose up -d --build      # levantar
docker compose logs -f backend    # ver logs
docker compose exec backend sh    # entrar al backend
docker compose down               # detener (conserva volumen)
docker compose down -v            # detener y borrar base de datos
```

---

## 12. Seguridad y checklist de producción

- Cambiar `POSTGRES_PASSWORD`, `JWT_SECRET` y `ADMIN_PASSWORD` en `.env`.
- Usar `CORS_ORIGIN` con el dominio real del frontend (no `*`).
- Servir el sistema detrás de HTTPS (proxy inverso o balanceador).
- Restringir el acceso a la red interna/VPN institucional.
- Realizar respaldos periódicos del volumen PostgreSQL.
- El hash de contraseña usa bcrypt con costo 10.
- El token JWT expira según `JWT_EXPIRES_IN` (por defecto 8 h).
- No se registran contraseñas ni tokens en logs.
- Para cambiar la contraseña del administrador: actualice `ADMIN_PASSWORD` y reinicie
  el backend (el seed actualiza el hash).

---

## 13. Solución de problemas

| Síntoma | Causa / solución |
|---|---|
| `No se encontró la plantilla Word` | Ejecute `npm run template:create` o coloque `Notas.docx` en `backend/templates/`. |
| `No se encontró un estudiante con la cédula...` | Verifique que el CSV esté importado y que la cédula exista. |
| La tabla de materias no se repite | `{{#materias}}` y `{{/materias}}` deben estar en la **misma fila** de la tabla. |
| Word muestra las llaves literales | Las etiquetas deben usar exactamente `{{` y `}}`; revise comillas tipográficas. |
| El navegador no muestra “Guardar como” | Firefox/Safari no soportan File System Access API; se usa descarga directa. |
| Error de conexión a PostgreSQL | Espere el healthcheck o revise `docker compose logs db`. |
| El CSV no importa acentos | El script normaliza tildes en encabezados; guarde el archivo en UTF-8. |

---

## 14. Verificación realizada

- Backend compilado con TypeScript (`tsc`) sin errores.
- Frontend compilado con `tsc --noEmit` + `vite build` sin errores.
- Plantilla `Notas.docx` generada y probada con `docxtemplater`: el bucle de materias
  expande correctamente las filas y no quedan etiquetas sin reemplazar.
- Conversión numérica verificada: `18 → Dieciocho`, `20 → Veinte`, `18.33 → 18,33`.
- `docker-compose.yml` validado como YAML.

> Nota: la verificación de extremo a extremo con PostgreSQL requiere Docker o una
> instancia local de PostgreSQL; los contenedores están listos para `docker compose up`.
