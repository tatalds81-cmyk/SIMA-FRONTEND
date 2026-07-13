# Reporte de Caso de Prueba: Historia de Usuario 47 (H47)

## Tabla de Caso de Prueba: CP-H47-001

| Campo | Detalle |
| :--- | :--- |
| **Id Caso de Prueba** | **CP-H47-001** |
| **Fecha de realización / Duración** | 09/07/2026 / 20 minutos |
| **Requerimiento funcional de la prueba** | Consultar asistencia por sesión, grupo y aprendiz (H47). |
| **Objetivo** | Verificar que los usuarios autorizados (instructor líder, instructor asignado, coordinador) puedan consultar el historial y resumen de asistencia de las sesiones, grupos o aprendices bajo su alcance, aplicando filtros de estado, método, búsquedas y visualizando bitácoras de detalles. |
| **Tipo de prueba** | Prueba funcional y visual automatizada E2E (Cypress) con simulación de roles de Instructor y Coordinador, interacción con filtros, búsquedas y visualización de líneas de tiempo de asistencia. |
| **Datos de entrada de la prueba** | **Usuario de prueba:** Instructor (rol: `INSTRUCTOR`) y Coordinador (rol: `COORDINADOR`).<br>**Módulo de prueba:** Panel de asistencia del Instructor (`/instructor/asistencia`) y Panel de gestión de grupos del Coordinador (`/fichas`).<br>**Datos de entrada:**<br>- Dos aprendices: Carlos Andrés (Presente por QR) y Juan Sebastián (Tarde por Manual).<br>- Fichas y programas asignados al Coordinador. |
| **Procedimiento de prueba** | **Flujo Instructor:**<br>**Paso 1:** Iniciar sesión en la plataforma SIMA como un usuario con rol de Instructor.<br>**Paso 2:** Cargar el panel de asistencia (`/instructor/asistencia`) para el grupo 1.<br>**Paso 3:** Escribir en la barra de búsqueda "Carlos" y comprobar que solo él aparezca en la lista, luego escribir un nombre que no exista y verificar el texto de filtro vacío.<br>**Paso 4:** Habilitar el panel de filtros y tomar captura.<br>**Paso 5:** Hacer clic en el botón de acción de "Ojo" en la fila del aprendiz Carlos Andrés para abrir la bitácora individual de detalle.<br>**Paso 6:** Validar la existencia de la línea de tiempo inmutable indicando el estado `Presente` y el método `QR` y capturar pantalla.<br><br>**Flujo Coordinador:**<br>**Paso 7:** Iniciar sesión como Coordinador con credenciales simuladas.<br>**Paso 8:** Hacer clic en "Gestion de grupos" en el sidebar para navegar a `/fichas`.<br>**Paso 9:** Validar que se cargue la lista de fichas de su centro de formación y tomar captura de pantalla. |
| **Resultado esperado** | El instructor y el coordinador acceden a la consulta del historial de asistencias de las fichas de su alcance. El instructor puede filtrar por estado/método/fecha, buscar aprendices y consultar bitácoras detalladas. El coordinador consulta correctamente el listado de las fichas adscritas a sus áreas de coordinación asignadas. |
| **Resultado obtenido** | La prueba CP-H47-001 se ejecutó de forma automatizada y exitosa con Cypress. Los flujos de instructor y coordinador validaron la consulta de información de asistencia de forma integral, permitiendo realizar búsquedas de aprendices, abrir líneas de tiempo detalladas y visualizar listados de fichas según el rol de manera exitosa. |
| **Observación técnica / Alcance** | Se fuerza el renderizado del contenedor de filtros `.asistencia-control-filter` para pruebas E2E visuales completas. |
| **¿Prueba exitosa?** | **Sí ( X )** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **No ( )** |

### Soporte de evidencias - H47

> **Evidencia H47.1:** Captura del panel del instructor con el panel de filtros desplegado y barra de búsqueda.
> *Ubicación del archivo:* `cypress/screenshots/h47.cy.js/H47-instructor-busqueda-filtros.png`

> **Evidencia H47.2:** Captura del modal de detalle de asistencia abierto mostrando la línea de tiempo y evidencias del aprendiz.
> *Ubicación del archivo:* `cypress/screenshots/h47.cy.js/H47-instructor-detalle-historial.png`

> **Evidencia H47.3:** Captura del panel del coordinador consultando y visualizando el listado de fichas de su centro.
> *Ubicación del archivo:* `cypress/screenshots/h47.cy.js/H47-coordinador-ver-fichas.png`
