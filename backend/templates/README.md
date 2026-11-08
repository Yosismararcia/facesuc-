# Plantilla Word (`Notas.docx`)

El backend usa `docxtemplater` + `pizzip` para inyectar datos en esta plantilla.
La sintaxis de etiquetas está configurada con dobles llaves: `{{ etiqueta }}`.

## Opción A: plantilla automática

```bash
cd backend
npm install
npm run template:create
```

Esto genera `templates/Notas.docx` con todas las etiquetas y el bucle de la tabla.
Si ya existe una plantilla personalizada, **no se sobrescribe**. Use `--force` si
desea regenerarla.

## Opción B: plantilla propia en Microsoft Word

1. Abra un documento nuevo de Word y diseñe el encabezado institucional.
2. Escriba las etiquetas con llaves dobles exactamente así (sin espacios internos
   es lo más seguro):

| Etiqueta | Contenido |
|---|---|
| `{{nombres}}` | Nombre completo del estudiante |
| `{{cedula}}` | Cédula solo con dígitos (ej. `12345678`) |
| `{{cedula_formateada}}` | Cédula con formato (ej. `V-12.345.678`) |
| `{{programa}}` | Descripción del programa de postgrado |
| `{{programa_codigo}}` | Código del programa |
| `{{total_asignaturas}}` | Cantidad de asignaturas registradas |
| `{{total_creditos}}` | Suma de UC de todas las asignaturas |
| `{{creditos_aprobados}}` | Suma de UC aprobadas |
| `{{indice_academico}}` | Promedio ponderado, 2 decimales con coma (ej. `18,33`) |
| `{{fecha_actual}}` | Fecha actual en español |
| `{{ultimo_periodo}}` | Último período lectivo registrado |

3. **Tabla de materias (bucle).** En la fila que desea repetir coloque:

   - En la primera celda: `{{#materias}}{{codigo}}`
   - En las celdas intermedias use las etiquetas de la fila.
   - En la última celda: `{{profesor}}{{/materias}}`

   Es importante que `{{#materias}}` y `{{/materias}}` estén en la **misma fila**
   de la tabla. `docxtemplater` clonará esa fila por cada asignatura.

   Etiquetas disponibles dentro del bucle:

   | Etiqueta | Contenido |
   |---|---|
   | `{{codigo}}` | Código de la asignatura |
   | `{{asignatura}}` | Nombre de la asignatura |
   | `{{nivel}}` | Nivel / semestre |
   | `{{uc}}` | Unidades de crédito |
   | `{{periodo_lectivo}}` | Período lectivo |
   | `{{anno_lectivo}}` | Año lectivo |
   | `{{periodo}}` | Período combinado (`periodo-anno`) |
   | `{{seccion}}` | Sección |
   | `{{nota}}` | Nota numérica con coma decimal |
   | `{{nota_letras}}` | Nota en letras (ej. `Dieciocho`) |
   | `{{aprobada}}` | `SI` / `NO` |
   | `{{profesor}}` | Nombre del profesor |
   | `{{calculo_promedio}}` | Promedio calculado (si existe) |

4. Guarde el archivo como `Notas.docx` en esta carpeta (`backend/templates/`).
   El contenedor lo monta como volumen, por lo que **no hace falta reconstruir**
   la imagen después de editar la plantilla.

> Consejo: si Word cambia las llaves por comillas tipográficas, escriba las
> etiquetas en un editor de texto y péguelas en Word, o desactive la corrección
> automática “Comillas rectas por comillas tipográficas”.
