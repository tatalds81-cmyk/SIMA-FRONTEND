# Reporte de Caso de Prueba: Historia de Usuario 45 (H45)

## Tabla de Caso de Prueba: CP-H45-001

| Campo | Detalle |
| :--- | :--- |
| **Id Caso de Prueba** | **CP-H45-001** |
| **Fecha de realización / Duración** | 09/07/2026 / 15 minutos |
| **Requerimiento funcional de la prueba** | Registrar asistencia manual por instructor responsable (H45). |
| **Objetivo** | Verificar que el instructor responsable de la sesión de formación activa pueda ingresar de forma manual el estado de asistencia de los aprendices (limitado a "Presente", "Inasistente" o "Tarde") desde su panel lateral/tabla para solventar contingencias técnicas, impidiendo registrar manualmente el estado de "Justificada". |
| **Tipo de prueba** | Prueba funcional automatizada E2E (Cypress) con simulación de peticiones HTTP en el frontend, validación de controles de campos select de la tabla y almacenamiento de la asistencia. |
| **Datos de entrada de la prueba** | **Usuario de prueba:** Instructor responsable (rol: `INSTRUCTOR`).<br>**Módulo evaluado:** Asistencia del Instructor (AsistenciaInstructor) y endpoint `/api/attendances/manual`.<br>**Datos de entrada:**<br>- Sesión de formación activa programada para hoy.<br>- Aprendiz Carlos Andrés Mendoza Pérez en estado `Sin registro`. |
| **Procedimiento de prueba** | **Paso 1:** Iniciar sesión en la plataforma SIMA como un usuario con rol de Instructor.<br>**Paso 2:** Navegar a la sección de control de asistencia de la ficha del grupo formativo (`/instructor/asistencia`).<br>**Paso 3:** Asegurar que la sesión se encuentre en estado `ABIERTA`.<br>**Paso 4:** Cerrar el aviso emergente de aprendices pendientes de registrarse.<br>**Paso 5:** Hacer clic en el botón "Manual" para ingresar al modo de edición manual de asistencia.<br>**Paso 6:** Validar que el menú desplegable (select) del aprendiz contenga únicamente las opciones permitidas (Presente, Inasistente, Tarde) y que la opción "Justificada" no esté disponible.<br>**Paso 7:** Seleccionar el estado `Tarde` para el aprendiz Carlos Andrés Mendoza Pérez.<br>**Paso 8:** Hacer clic en el botón "Finalizar edición".<br>**Paso 9:** Validar que se envíe la petición POST al backend y que tras la recarga automática de la lista, el estado del aprendiz aparezca como `Tarde` y el método de registro sea `Manual`.<br>**Paso 10:** Tomar capturas de pantalla de la interfaz. |
| **Resultado esperado** | El instructor responsable puede registrar y guardar marcas manuales con estado "Presente" o "Tarde". El sistema bloquea o no ofrece la opción manual de "Justificada". Al guardar la asistencia manual, el estado del aprendiz se actualiza en tiempo real y el método de registro se guarda como `Manual`. |
| **Resultado obtenido** | La prueba CP-H45-001 se ejecutó de forma automatizada y exitosa con Cypress. El sistema bloqueó la opción de "Justificada" en el select de la tabla de edición y permitió registrar con éxito el estado manual `Tarde` asignando el método `Manual` en la base de datos de manera conforme. |
| **Observación técnica / Alcance** | Se verifica que la integración de la tabla con los estados registrables se restrinja a los valores semánticos `PRESENTE`, `INASISTENTE` y `TARDE` definidos por la regla del negocio. |
| **¿Prueba exitosa?** | **Sí ( X )** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **No ( )** |

### Soporte de evidencias - H45

> **Evidencia H45.1:** Captura del panel del instructor en modo de edición manual con dropdowns habilitados.
> *Ubicación del archivo:* `cypress/screenshots/h45.cy.js/H45-instructor-modo-manual.png`

> **Evidencia H45.2:** Captura del aprendiz registrado con éxito con estado "Tarde" y método "Manual".
> *Ubicación del archivo:* `cypress/screenshots/h45.cy.js/H45-asistencia-manual-guardada.png`
