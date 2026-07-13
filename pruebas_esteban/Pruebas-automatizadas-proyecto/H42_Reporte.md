# Reporte de Caso de Prueba: Historia de Usuario 42 (H42)

## Tabla de Caso de Prueba: CP-H42-001

| Campo | Detalle |
| :--- | :--- |
| **Id Caso de Prueba** | **CP-H42-001** |
| **Fecha de realización / Duración** | 08/07/2026 / 8 segundos (en ejecución automatizada) |
| **Requerimiento funcional de la prueba** | Registrar asistencia por código QR (H42). |
| **Objetivo** | Verificar que el instructor responsable de la sesión de formación sea capaz de generar el código QR dinámico desde su panel de control de asistencias, visualizando el token correspondiente y la imagen del código QR codificada en base64, permitiendo la apertura a pantalla completa y el cierre del modal de forma correcta. |
| **Tipo de prueba** | Prueba funcional automatizada E2E (Cypress) con simulación de peticiones HTTP en el frontend y validación de las transiciones de estado de la tarjeta de QR y la visualización a pantalla completa. |
| **Datos de entrada de la prueba** | **Usuario de prueba:** Instructor (rol: `INSTRUCTOR`).<br>**Módulo evaluado:** Asistencia del Instructor (AsistenciaInstructor) y generación de código QR en el backend (`generarQrSesion`).<br>**Datos de simulación (QR):**<br>1. Caso 1: Generación exitosa de QR (`qr_token: 'sima-qr-token-test-12345'` / `id_sesion_formacion: 550` / `expira_en: +30s`).<br>2. Caso 2: Error del servidor backend al generar QR (`statusCode: 500` / `message: 'No fue posible generar el token QR...'`). |
| **Procedimiento de prueba** | **Paso 1:** Iniciar sesión en la plataforma SIMA como un usuario con rol de Instructor (mediante el comando helper `cy.loginInstructor()`).<br>**Paso 2:** El sistema accede al Panel de control del instructor.<br>**Paso 3:** Navegar a la sección de control de asistencia de la ficha del grupo formativo (`/instructor/asistencia`).<br>**Paso 4:** Asegurar que la sesión de formación programada del día se encuentre en estado `ABIERTA`.<br>**Paso 5:** Hacer clic sobre el botón "Registro por QR" en la tarjeta de Métodos de registro.<br>**Paso 6:** Validar que la tarjeta del código QR (`.asistencia-qr-card`) aparezca en el panel lateral y muestre el código de la ficha (`2561458`), el token (`Token: sima-qr-token-test-12345`) y la imagen del código QR codificada en Base64.<br>**Paso 7:** Hacer clic sobre la imagen del código QR (`button.asistencia-qr-visual`).<br>**Paso 8:** Validar que la vista de pantalla completa (`.asistencia-qr-fullscreen`) sea visible y contenga el botón "Cerrar QR".<br>**Paso 9:** Hacer clic sobre el botón "Cerrar QR" (`button.asistencia-qr-close-full`).<br>**Paso 10:** Validar que el modal a pantalla completa desaparezca de la interfaz.<br>**Paso 11:** Volver a hacer clic sobre el botón "Registro por QR" de la tarjeta de Métodos de registro para cerrar la visualización del QR en el panel lateral.<br>**Paso 12:** Para el Caso 2 (Error de Servidor), hacer clic en "Registro por QR" y validar que se renderice el banner de alerta informando del error "No fue posible generar el token QR en el servidor." devuelto por el backend.<br>**Paso 13:** Tomar capturas de pantalla de los flujos. |
| **Resultado esperado** | El instructor genera el código QR interactivo de asistencia exitosamente. Se visualiza el token dinámico de verificación y la imagen QR en el panel lateral y en pantalla completa. Los errores del servidor al intentar generar el QR son capturados y notificados visualmente en la pantalla del instructor de forma clara. |
| **Resultado obtenido** | La prueba CP-H42-001 fue ejecutada de forma automatizada con Cypress. Las capturas generadas demuestran que el frontend realiza correctamente la llamada al backend para registrar y obtener el token QR de la sesión `#550`, renderiza de forma dinámica la imagen usando la librería de códigos de barras, y gestiona correctamente las opciones de zoom y de manejo de errores de comunicación. |
| **Observación técnica / Alcance** | Se verifica que la integración de generación de código QR funcione correctamente sobre el navegador. La selección del botón de cerrado a pantalla completa por su clase específica (`button.asistencia-qr-close-full`) garantiza la robustez de la prueba al evitar colisiones con el texto del subtítulo del botón de métodos. |
| **¿Prueba exitosa?** | **Sí ( X )** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **No ( )** |

### Soporte de evidencias - H42

> **Evidencia H42.1:** Captura del código QR generado con éxito en la barra lateral.
> *Ubicación del archivo:* `cypress/screenshots/h42.cy.js/H42-codigo-qr-generado-exitoso.png`

> **Evidencia H42.2:** Captura del código QR ampliado en pantalla completa.
> *Ubicación del archivo:* `cypress/screenshots/h42.cy.js/H42-codigo-qr-fullscreen.png`

> **Evidencia H42.3:** Captura del error notificado tras una falla de generación en el backend.
> *Ubicación del archivo:* `cypress/screenshots/h42.cy.js/H42-error-generacion-qr.png`
