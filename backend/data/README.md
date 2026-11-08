# Dataset de entrada

Coloque aquí el archivo real `baseDeDatosSistemaConstancia.csv`.

- El importador detecta automáticamente si el separador es coma (`,`) o punto y coma (`;`).
- Reconoce los encabezados aunque tengan mayúsculas, tildes o espacios.
- Las columnas obligatorias mínimas son:
  `cedula`, `nombres`, `codigo_programa`, `codigo_asignatura`, `nota_final`.
- Las demás columnas de las 27 del dataset original son aceptadas y las que no se
  usan se ignoran.

## Importar

Con Docker Compose (recomendado):

```bash
docker compose exec backend node dist/scripts/importCsv.js /app/data/baseDeDatosSistemaConstancia.csv
```

En desarrollo local:

```bash
cd backend
cp data/baseDeDatosSistemaConstancia.sample.csv data/baseDeDatosSistemaConstancia.csv
npm run import:csv
```

También puede activar la importación automática al arrancar el contenedor:

```env
IMPORT_CSV_ON_START=true
```

El archivo `baseDeDatosSistemaConstancia.sample.csv` contiene datos de prueba con
los dos estudiantes usados en la documentación.
