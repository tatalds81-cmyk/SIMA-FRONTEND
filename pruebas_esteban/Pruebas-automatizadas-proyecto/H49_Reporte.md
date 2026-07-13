# Reporte de Caso de Prueba: Historia de Usuario 49 (H49)

## Tabla de Caso de Prueba: CP-H49-001

| Campo | Detalle |
| :--- | :--- |
| **Id Caso de Prueba** | **CP-H49-001** |
| **Fecha de realización / Duración** | 09/07/2026 / 15 minutos |
| **Requerimiento funcional de la prueba** | Cancelar sesión de formación (H49). |
| **Objetivo** | Verificar que el instructor responsable de la sesión pueda cancelarla con un motivo justificado (mínimo 20 caracteres), validando que tras la cancelación exitosa, la interfaz muestre el estado de la sesión como cancelada ("Sin sesion") y no permita marcas adicionales. |
| **Tipo de prueba** | Prueba funcional y visual automatizada E2E (Cypress) con validaciones de longitud mínima de caracteres en inputs de texto y verificación de cambios de estado del panel. |
| **Datos de entrada de la prueba** | **Usuario de prueba:** Instructor (rol: `INSTRUCTOR`).<br>**Módulo evaluado:** Control de asistencia (`/instructor/asistencia`) y modal de edición de asistencia manual.<br>**Datos de entrada:**<br>- Sesión de formación con ID `550`.<br>- Motivo corto de prueba: `"Corta"`.<br>- Motivo de éxito válido: `"Sesion cancelada por suspension de actividades en el centro de formacion."`. |
| **Procedimiento de prueba** | **Paso 1:** Iniciar sesión en la plataforma SIMA como un usuario con rol de Instructor.<br>**Paso 2:** Configurar el ID de sesión `550` en el `localStorage` y cargar el panel de asistencia (`/instructor/asistencia`).<br>**Paso 3:** Cerrar el aviso de aprendices faltantes haciendo clic en "Revisar luego".<br>**Paso 4:** Cambiar al modo de asistencia "Manual" haciendo clic en el botón.<br>**Paso 5:** Hacer clic en el botón "Editar" en la fila del aprendiz Carlos Andrés para abrir la ventana modal de edición.<br>**Paso 6:** Hacer clic en el botón "Cancelada" para desplegar el panel de cancelación de la sesión.<br>**Paso 7:** Escribir un motivo corto ("Corta") de menos de 20 caracteres y hacer clic en "Cerrar sesion" para verificar la validación de longitud. Capturar pantalla de error.<br>**Paso 8:** Limpiar el motivo y escribir una justificación válida de más de 20 caracteres, luego hacer clic en "Cerrar sesion".<br>**Paso 9:** Validar que la ventana modal se cierre y que el banner superior de estado de la sesión cambie de "Activa" a "Sin sesion" (estado de la sesión "CANCELADA"). Capturar pantalla de éxito. |
| **Resultado esperado** | El sistema exige obligatoriamente un motivo de al menos 20 caracteres de longitud para cancelar. La sesión pasa a estado CANCELADA en la vista, se cierra el modal, y el indicador de estado del panel superior se actualiza a "Sin sesion". |
| **Resultado obtenido** | La prueba CP-H49-001 se ejecutó de forma automatizada y exitosa con Cypress. El sistema validó e impidió la confirmación de la cancelación con una justificación de longitud inferior a 20 caracteres. Al ingresar una justificación adecuada de más de 20 caracteres, se cerró el modal correctamente y se reflejó de forma conforme el cambio de estado de la sesión a cancelada ("Sin sesion"). |
| **Observación técnica / Alcance** | Se incorporaron comandos de scrolling (`scrollIntoView()`) para garantizar la interactividad de los elementos inferiores dentro del modal ajustable de edición. |
| **¿Prueba exitosa?** | **Sí ( X )** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **No ( )** |

### Soporte de evidencias - H49

> **Evidencia H49.1:** Captura del modal de cancelación mostrando el mensaje de validación de caracteres mínimos de motivo.
> *Ubicación del archivo:* `cypress/screenshots/h49.cy.js/H49-cancellation-validation-error.png`

> **Evidencia H49.2:** Captura del panel principal de asistencia tras confirmarse la cancelación de la sesión.
> *Ubicación del archivo:* `cypress/screenshots/h49.cy.js/H49-session-cancelled-successfully.png`
