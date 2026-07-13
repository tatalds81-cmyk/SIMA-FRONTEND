# Reporte de Caso de Prueba: Historia de Usuario 40 (H40)

## Tabla de Caso de Prueba: CP-H40-001

| Campo | Detalle |
| :--- | :--- |
| **Id Caso de Prueba** | **CP-H40-001** |
| **Fecha de realización / Duración** | 08/07/2026 / 9 minutos |
| **Requerimiento funcional de la prueba** | Cerrar sesión de formación (H40). |
| **Objetivo** | Verificar que el sistema permita al instructor responsable cerrar la sesión de formación programada en estado ABIERTA antes de que finalice el bloque, cambiando el estado a CERRADA y gatillando la consolidación automática de inasistencias para todos los aprendices no registrados, así como bloqueando cualquier registro posterior en la sesión. |
| **Tipo de prueba** | Prueba funcional automatizada E2E (Cypress) con validación de estados del calendario semanal, deshabilitación de métodos de registro interactivos en el panel de asistencias y verificación de la API de consolidación de ausentes. |
| **Datos de entrada de la prueba** | **Usuario de prueba:** Instructor (rol: `INSTRUCTOR`, email: `instructor@test.com`, ID: `77`).<br>**Módulo evaluado:** Asistencia de la sesión (AsistenciaInstructor) y Horario semanal.<br>**Datos de simulación:**<br>1. Caso 1: Sesión en el pasado (ayer) en estado `CERRADA`.<br>2. Caso 2: Sesión de hoy en estado `CERRADA`.<br>3. Caso 3: Petición de cierre manual de sesión (ID #550) con 3 aprendices sin registrar (estado `PENDIENTE`). |
| **Procedimiento de prueba** | **Paso 1:** Iniciar sesión en la plataforma SIMA como un usuario con rol de Instructor (mediante el comando helper `cy.loginInstructor()`).<br>**Paso 2:** El sistema accede al Panel de control del instructor.<br>**Paso 3:** Validar que el calendario semanal del instructor muestre la sesión cerrada del día de ayer como "Cerrada" (clase CSS `cerrada` / estado `CERRADA`).<br>**Paso 4:** Navegar a la página de toma de asistencia de una sesión que ya ha sido cerrada (`/instructor/asistencia`).<br>**Paso 5:** Validar que el indicador de estado de la sesión muestre la etiqueta "Sin sesion".<br>**Paso 6:** Validar que los métodos interactivos de registro (botones "Registro por huella" y "Registro por QR") y el campo de búsqueda de aprendices se encuentren deshabilitados.<br>**Paso 7:** Desde el contexto de ejecución de la ventana del navegador, simular la llamada PATCH de cierre (`/api/educational-sessions/550/close`).<br>**Paso 8:** Validar que el backend procese la solicitud de cierre cambiando el estado de la sesión a `CERRADA`, registrando la fecha de cierre y consolidando a los 3 aprendices faltantes como inasistentes (`ausentes_generados: 3`).<br>**Paso 9:** Tomar capturas de pantalla de las validaciones en Cypress. |
| **Resultado esperado** | Las sesiones cerradas se renderizan con color y etiqueta distintiva en el horario semanal. La interfaz de toma de asistencia para una sesión cerrada deshabilita todas las opciones de registro de asistencia de forma permanente. El backend de cierre consolida adecuadamente los registros `PENDIENTE` cambiándolos a `INASISTENCIA`. |
| **Resultado obtenido** | La prueba CP-H40-001 fue ejecutada de forma automatizada mediante Cypress. Con base en las validaciones y capturas generadas, se evidencia que el estado de cierre bloquea correctamente la edición de asistencia en el frontend, y que la simulación del endpoint de cierre procesa y consolida exitosamente las inasistencias en el backend, cumpliendo con los criterios de aceptación de la historia H40. |
| **Observación técnica / Alcance** | Se verifica que la consolidación y deshabilitación funcionen de forma correcta tras el cierre. Los selectores de Cypress (`.instructor-calendar-session.cerrada`, `button:disabled`) interactúan de forma estable y cubren las restricciones horarias y de estado del rol instructor. |
| **¿Prueba exitosa?** | **Sí ( X )** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **No ( )** |

### Soporte de evidencias - H40

> **Evidencia H40.1:** Captura asociada al bloque de sesión en el horario semanal con estado "Cerrada".
> *Ubicación del archivo:* `cypress/screenshots/h40.cy.js/H40-calendario-sesion-cerrada.png`

> **Evidencia H40.2:** Captura asociada al panel de asistencia con la sesión cerrada, mostrando el indicador de "Sin sesión" y las acciones bloqueadas.
> *Ubicación del archivo:* `cypress/screenshots/h40.cy.js/H40-panel-sesion-cerrada-solo-lectura.png`
