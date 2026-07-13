# Reporte de Caso de Prueba: Historia de Usuario 50 (H50)

## Tabla de Caso de Prueba: CP-H50-001

| Campo | Detalle |
| :--- | :--- |
| **Id Caso de Prueba** | **CP-H50-001** |
| **Fecha de realización / Duración** | 09/07/2026 / 20 minutos |
| **Requerimiento funcional de la prueba** | Corregir asistencia de forma controlada (H50). |
| **Objetivo** | Verificar que el instructor responsable de la sesión pueda corregir las marcas de asistencia en una sesión cerrada únicamente dentro de un plazo de 7 días hábiles posteriores al cierre, requiriendo un motivo de justificación de al menos 20 caracteres y actualizando el estado de la marca conforme en el historial. |
| **Tipo de prueba** | Prueba funcional y visual automatizada E2E (Cypress) con simulación de sesión cerrada en dos horizontes temporales (el mismo día y 8 días después) para comprobar límites de tiempo y validaciones de caracteres. |
| **Datos de entrada de la prueba** | **Usuario de prueba:** Instructor (rol: `INSTRUCTOR`).<br>**Módulo evaluado:** Control de asistencia (`/instructor/asistencia`) y modal de edición manual de asistencia.<br>**Datos de entrada:**<br>- Sesión de formación ID `550` (CERRADA, fecha: hoy).<br>- Sesión de formación ID `550` (CERRADA, fecha: hace 8 días).<br>- Aprendiz: Carlos Andrés (marca inicial: `INASISTENTE`).<br>- Justificación de prueba corta: `"Corta"`.<br>- Justificación de éxito: `"Correccion por error involuntario del registro QR del aprendiz."`. |
| **Procedimiento de prueba** | **Fase 1: Corrección dentro de los 7 días y validación de justificación:**<br>**Paso 1:** Iniciar sesión en la plataforma SIMA como un usuario con rol de Instructor.<br>**Paso 2:** Configurar el ID de sesión `550` (fecha de hoy) en el `localStorage` y cargar el panel de asistencia.<br>**Paso 3:** Cambiar al modo de asistencia "Manual" (el listado se muestra a pesar de estar cerrada por habilitarse en manual).<br>**Paso 4:** Hacer clic en "Editar" en la fila del aprendiz Carlos Andrés para abrir la modal de edición.<br>**Paso 5:** Escribir una descripción corta ("Corta") y hacer clic en "Guardar cambio". Validar que se muestre el error de caracteres mínimos.<br>**Paso 6:** Ingresar una justificación válida de más de 20 caracteres y cambiar el estado a "Presente", luego hacer clic en "Guardar cambio".<br>**Paso 7:** Interceptar el PATCH de corrección de la marca `5001` y validar que el modal se cierre y la tabla muestre a Carlos Andrés en estado `"Presente"`. Capturar pantalla de éxito.<br><br>**Fase 2: Bloqueo de correcciones después de 7 días:**<br>**Paso 8:** Configurar en el `localStorage` la sesión formativa `550` con fecha de hace 8 días en estado `CERRADA`.<br>**Paso 9:** Recargar la página del panel de asistencia del instructor.<br>**Paso 10:** Activar el modo "Manual" y hacer clic en el botón "Editar".<br>**Paso 11:** Validar que el modal de edición no se abra y que la pantalla despliegue el mensaje de alerta: `"No es posible corregir asistencias de sesiones cerradas hace mas de 7 dias."`. Capturar pantalla. |
| **Resultado esperado** | El sistema permite realizar correcciones de sesiones cerradas que estén dentro del límite de 7 días. Se exige obligatoriamente un motivo de al menos 20 caracteres. Se bloquea e impide abrir la ventana de edición si la fecha de la sesión cerrada supera el plazo de 7 días. |
| **Resultado obtenido** | La prueba CP-H50-001 se ejecutó de forma automatizada y exitosa con Cypress. El sistema exigió la justificación de 20 caracteres impidiendo el registro erróneo en la Fase 1. En la Fase 2, bloqueó correctamente la edición y mostró la alerta de plazo superado tras detectar que la sesión cerrada era de hace 8 días. |
| **Observación técnica / Alcance** | Se corrigió el selector de filtrado de aprendices `aprendicesFiltrados` en la UI para posibilitar el renderizado del listado de aprendices en sesiones cerradas al activarse el modo de corrección manual (`modoManual`). |
| **¿Prueba exitosa?** | **Sí ( X )** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **No ( )** |

### Soporte de evidencias - H50

> **Evidencia H50.1:** Captura del panel del instructor con la corrección guardada con éxito (Carlos Andrés ahora Presente).
> *Ubicación del archivo:* `cypress/screenshots/h50.cy.js/H50-correction-success.png`

> **Evidencia H50.2:** Captura del panel de asistencia mostrando la alerta de bloqueo al intentar corregir una sesión cerrada de hace 8 días.
> *Ubicación del archivo:* `cypress/screenshots/h50.cy.js/H50-correction-blocked-over-7-days.png`
