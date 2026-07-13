# Reporte de Caso de Prueba: Historia de Usuario 44 (H44)

## Tabla de Caso de Prueba: CP-H44-001

| Campo | Detalle |
| :--- | :--- |
| **Id Caso de Prueba** | **CP-H44-001** |
| **Fecha de realización / Duración** | 09/07/2026 / 10 segundos (en ejecución automatizada) |
| **Requerimiento funcional de la prueba** | Registrar asistencia mediante lector IoT de huella (H44). |
| **Objetivo** | Verificar que el sistema registre la asistencia de los aprendices mediante comparación biométrica en el lector autónomo IoT del ambiente, validando la sincronización en tiempo real con el panel del instructor, el registro correcto del estado (Presente/Tarde) y el método de registro ("Huella"). |
| **Tipo de prueba** | Prueba funcional automatizada E2E (Cypress) con simulación de eventos IoT en el backend y verificación visual en tiempo real en la interfaz del instructor. |
| **Datos de entrada de la prueba** | **Usuario de prueba:** Aprendiz (rol: `APRENDIZ`, ID: `12`) e Instructor.<br>**Módulo evaluado:** Panel de asistencia del Instructor (AsistenciaInstructor) y listado de asistencias de la sesión.<br>**Datos de entrada (Simulación IoT):**<br>- Registro exitoso por huella IoT (`estado_asistencia: 'PRESENTE'` / `metodo: 'huella'`). |
| **Procedimiento de prueba** | **Paso 1:** Iniciar sesión en la plataforma SIMA como un usuario con rol de Instructor.<br>**Paso 2:** Navegar a la sección de control de asistencia de la ficha del grupo formativo (`/instructor/asistencia`).<br>**Paso 3:** Asegurar que la sesión de formación se encuentre en estado `ABIERTA`.<br>**Paso 4:** Cerrar el modal de aviso de aprendices faltantes.<br>**Paso 5:** Tomar captura de pantalla del listado del instructor esperando marcas del lector biométrico IoT.<br>**Paso 6:** Interceptar la llamada de actualización de la sesión simulando que el aprendiz Carlos Andrés Mendoza Pérez registra su asistencia por huella en el lector IoT de la sala.<br>**Paso 7:** Recargar la página del instructor (`cy.reload()`) para simular la actualización del listado.<br>**Paso 8:** Cambiar al modo "Manual" para visualizar el listado completo de aprendices.<br>**Paso 9:** Validar que el estado del aprendiz cambie a `Presente` y el método de registro muestre `Huella` en la fila correspondiente.<br>**Paso 10:** Tomar captura de pantalla de la asistencia registrada exitosamente. |
| **Resultado esperado** | El sistema actualiza el panel del instructor y muestra al aprendiz como registrado con estado "Presente" y método "Huella" tras recibir la confirmación del lector biométrico IoT. |
| **Resultado obtenido** | La prueba CP-H44-001 se ejecutó de forma automatizada y exitosa con Cypress. Al recibir la marca del lector IoT, el panel del instructor se actualizó reflejando el estado `Presente` y el método `Huella` para el aprendiz correspondiente de forma correcta. |
| **Observación técnica / Alcance** | El cambio al modo de visualización "Manual" al verificar la tabla de asistencia evita que elementos queden fuera de rango por scroll y asegura que el estado sea visible y legible en Cypress. |
| **¿Prueba exitosa?** | **Sí ( X )** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **No ( )** |

### Soporte de evidencias - H44

> **Evidencia H44.1:** Captura del panel del instructor esperando las marcas de asistencia del lector biométrico IoT del ambiente.
> *Ubicación del archivo:* `cypress/screenshots/h44.cy.js/H44-instructor-esperando-marcas-iot.png`

> **Evidencia H44.2:** Captura del aprendiz registrado con éxito en la lista con estado "Presente" y método "Huella".
> *Ubicación del archivo:* `cypress/screenshots/h44.cy.js/H44-aprendiz-asistencia-registrada-iot.png`
