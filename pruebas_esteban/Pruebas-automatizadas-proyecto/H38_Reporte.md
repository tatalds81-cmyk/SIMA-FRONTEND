# Reporte de Caso de Prueba: Historia de Usuario 38 (H38)

## Tabla de Caso de Prueba: CP-H38-001

| Campo | Detalle |
| :--- | :--- |
| **Id Caso de Prueba** | **CP-H38-001** |
| **Fecha de realización / Duración** | 08/07/2026 / 8 minutos |
| **Requerimiento funcional de la prueba** | Generar sesiones desde el horario del trimestre (H38). |
| **Objetivo** | Verificar que el sistema genere y abra la sesión de formación programada de forma automática 10 minutos después de la hora teórica de inicio (si el instructor no la ha abierto manualmente) a partir de los horarios activos, cambiando su estado de PROGRAMADA a ABIERTA (estado ACTIVA en el calendario del frontend). |
| **Tipo de prueba** | Prueba funcional automatizada E2E (Cypress) con validaciones de peticiones de generación automática, renderizado de estados en el calendario semanal (Próxima sesión / Activa). |
| **Datos de entrada de la prueba** | **Usuario de prueba:** Instructor (rol: `INSTRUCTOR`, email: `instructor@test.com`) y Sistema.<br>**Módulo evaluado:** Horario semanal (Panel Instructor).<br>**Datos de simulación:**<br>1. Caso 1: Horario de hoy a las 07:00. No existe sesión previa. Trimestre: #101. Instructor: #77.<br>2. Caso 2: Sesión programada en el futuro (fecha: hoy + 1 hora, estado `PROGRAMADA`).<br>3. Caso 3: Sesión programada en curso (fecha: hoy, hora_inicio: hace 15 minutos, estado `ABIERTA`). |
| **Procedimiento de prueba** | **Paso 1:** Iniciar sesión en la plataforma SIMA como un usuario con rol de Instructor (mediante el comando helper `cy.loginInstructor()`).<br>**Paso 2:** El sistema accede al Panel de control del instructor.<br>**Paso 3:** Validar que la interfaz detecte de forma automática que hay un horario programado para hoy sin sesión asociada, e invoque el endpoint de generación (`/api/educational-sessions/generate`) enviando el trimestre correspondiente y la fecha de hoy.<br>**Paso 4:** Cargar en el calendario una sesión futura para verificar que se visualice correctamente como "Próxima sesión" (clase CSS `proxima`).<br>**Paso 5:** Cargar en el calendario una sesión cuyo inicio teórico ya transcurrió (hace más de 10 minutos) pero se encuentra en el rango actual de formación.<br>**Paso 6:** Validar que el calendario muestre automáticamente la sesión en estado "Activa" (clase CSS `activa` / estado `ACTIVA` en el cliente), garantizando que los aprendices puedan marcar asistencia.<br>**Paso 7:** Tomar capturas de pantalla de las validaciones en Cypress. |
| **Resultado esperado** | El sistema genera de forma automática la sesión del día a partir de la programación horaria. Las sesiones futuras se muestran como `PROGRAMADA` ("Próxima sesión"). Las sesiones en hora de clase se abren de manera automática (estado `ACTIVA` / "Activa") 10 minutos después del inicio establecido, permitiendo el registro seguro de asistencia. |
| **Resultado obtenido** | La prueba CP-H38-001 fue ejecutada de forma automatizada mediante Cypress. Con base en las validaciones y capturas generadas, se evidencia que el disparador automático del Panel Instructor invoca la generación de sesiones del día, y que el calendario semanal calcula y despliega adecuadamente los estados de clase ("Proxima sesion" y "Activa") correspondientes a las reglas horarias del backlog. |
| **Observación técnica / Alcance** | Se verifica que la generación y el cálculo de estados del calendario dependan correctamente de las reglas temporales. Los selectores de Cypress se integran exitosamente con las clases dinámicas de los bloques del calendario (`.instructor-calendar-session.proxima` y `.instructor-calendar-session.activa`). |
| **¿Prueba exitosa?** | **Sí ( X )** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **No ( )** |

### Soporte de evidencias - H38

> **Evidencia H38.1:** Captura asociada al disparo de generación automática de la sesión del día.
> *Ubicación del archivo:* `cypress/screenshots/h38.cy.js/H38-generacion-automatica-sesiones.png`

> **Evidencia H38.2:** Captura asociada al bloque de sesión en estado "Próxima sesión" (PROGRAMADA).
> *Ubicación del archivo:* `cypress/screenshots/h38.cy.js/H38-calendario-sesion-programada.png`

> **Evidencia H38.3:** Captura asociada al bloque de sesión en estado "Activa" (ABIERTA/ACTIVA).
> *Ubicación del archivo:* `cypress/screenshots/h38.cy.js/H38-calendario-sesion-activa.png`
