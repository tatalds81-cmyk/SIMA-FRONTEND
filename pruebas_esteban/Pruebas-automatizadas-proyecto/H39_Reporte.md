# Reporte de Caso de Prueba: Historia de Usuario 39 (H39)

## Tabla de Caso de Prueba: CP-H39-001

| Campo | Detalle |
| :--- | :--- |
| **Id Caso de Prueba** | **CP-H39-001** |
| **Fecha de realización / Duración** | 08/07/2026 / 6 minutos |
| **Requerimiento funcional de la prueba** | Abrir o iniciar sesión de formación manualmente (H39). |
| **Objetivo** | Verificar que el sistema permita al instructor responsable abrir manualmente una sesión de formación programada únicamente dentro del rango de tolerancia permitido (10 minutos antes y 10 minutos después del inicio establecido), cambiando su estado a ABIERTA y permitiendo el redireccionamiento para la toma de asistencia. |
| **Tipo de prueba** | Prueba funcional automatizada E2E (Cypress) con validación de ventanas emergentes activas de sesión (SesionActivaModal), envío de peticiones de apertura (PATCH) y control de rangos horarios. |
| **Datos de entrada de la prueba** | **Usuario de prueba:** Instructor (rol: `INSTRUCTOR`, email: `instructor@test.com`, ID: `77`).<br>**Módulo evaluado:** Sesión Activa (Modal emergente en Panel Instructor).<br>**Datos de simulación:**<br>1. Caso 1 (Dentro del rango): Sesión programada para hoy, hora_inicio: hace 5 minutos (rango de tolerancia activo).<br>2. Caso 2 (Fuera del rango): Sesión programada para hoy, hora_inicio: en 2 horas (rango de tolerancia inactivo). |
| **Procedimiento de prueba** | **Paso 1:** Iniciar sesión en la plataforma SIMA como un usuario con rol de Instructor (mediante el comando helper `cy.loginInstructor()`).<br>**Paso 2:** El sistema accede al Panel de control del instructor.<br>**Paso 3:** Validar que la interfaz abra automáticamente el modal emergente de sesión activa (`SesionActivaModal`) al detectar que la sesión del día de hoy está en rango de tolerancia de apertura (inicio hace 5 minutos).<br>**Paso 4:** Verificar en el modal la información de la ficha (2561458), la hora de inicio/fin y el ambiente de aprendizaje.<br>**Paso 5:** Hacer clic en el botón "Ir a asistencia".<br>**Paso 6:** Validar que el sistema invoque el endpoint PATCH `/api/educational-sessions/550/open` y redireccione al instructor a la vista de toma de asistencia (`/instructor/asistencia`).<br>**Paso 7:** Reiniciar el flujo cargando una sesión programada para dentro de 2 horas (fuera del rango de tolerancia).<br>**Paso 8:** Validar que el modal de sesión activa NO se despliegue y que la pantalla principal cargue normalmente.<br>**Paso 9:** Tomar capturas de pantalla de las validaciones en Cypress. |
| **Resultado esperado** | El modal emergente de sesión activa se presenta solo cuando hay una sesión dentro del margen de tolerancia horaria (-10 min a +10 min). Al presionar "Ir a asistencia", la sesión cambia a estado `ABIERTA` (enviando la petición de apertura) y se navega al panel de asistencias. No se muestra el modal para sesiones fuera del rango permitido. |
| **Resultado obtenido** | La prueba CP-H39-001 fue ejecutada de forma automatizada mediante Cypress. Con base en las validaciones y capturas generadas, se evidencia que el modal emergente de sesión activa detecta de forma precisa la tolerancia horaria, y que la acción de apertura manual invoca adecuadamente el cambio de estado en la API y la redirección a la vista de asistencia, cumpliendo con los criterios de aceptación de la historia H39. |
| **Observación técnica / Alcance** | Se verifica que la apertura manual esté protegida por la tolerancia horaria y que se ejecute la transición de estado `PROGRAMADA` -> `ABIERTA` de forma correcta. Los selectores de Cypress (`.asistencia-session-overlay`, `.asistencia-session-action.primary`) interactúan de forma estable sobre el modal de React. |
| **¿Prueba exitosa?** | **Sí ( X )** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **No ( )** |

### Soporte de evidencias - H39

> **Evidencia H39.1:** Captura asociada al modal de sesión activa emergente al iniciar sesión dentro del rango permitido.
> *Ubicación del archivo:* `cypress/screenshots/h39.cy.js/H39-apertura-manual-exitosa.png`

> **Evidencia H39.2:** Captura asociada a la navegación al dashboard sin modal emergente para sesiones fuera del rango.
> *Ubicación del archivo:* `cypress/screenshots/h39.cy.js/H39-sesion-fuera-tolerancia-no-modal.png`
