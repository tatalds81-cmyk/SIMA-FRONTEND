# Reporte de Caso de Prueba: Historia de Usuario 36 (H36)

## Tabla de Caso de Prueba: CP-H36-001

| Campo | Detalle |
| :--- | :--- |
| **Id Caso de Prueba** | **CP-H36-001** |
| **Fecha de realización / Duración** | 08/07/2026 / 8 minutos |
| **Requerimiento funcional de la prueba** | Notificar alertas a usuarios responsables (H36). |
| **Objetivo** | Verificar que el sistema registre y muestre notificaciones asociadas a alertas existentes, permitiendo marcar notificaciones individuales y colectivas como leídas, además de redirigir al detalle de la alerta correspondiente al interactuar con una notificación. |
| **Tipo de prueba** | Prueba funcional automatizada E2E (Cypress) con validación de estados de lectura (leída/no leída), contadores en tiempo real, cambio masivo de estados y redirección en la interfaz. |
| **Datos de entrada de la prueba** | **Usuario de prueba:** Instructor (rol: `INSTRUCTOR`, email: `instructor@test.com`) y Sistema.<br>**Módulo evaluado:** Notificaciones (`/notificaciones`).<br>**Notificaciones mockeadas:**<br>1. Notificación #1: Mensaje: "Nueva alerta por 3 inasistencias consecutivas para Ana Sofia Pérez Gómez", estado `leida: false`, tipo `AUTOMATICA`, alertaId: `101`.<br>2. Notificación #2: Mensaje: "Alerta por 5 inasistencias acumuladas registrada para Carlos Andrés Ríos Castro", estado `leida: true`, tipo `SISTEMA`, alertaId: `102`. |
| **Procedimiento de prueba** | **Paso 1:** Iniciar sesión en la plataforma SIMA como un usuario con rol de Instructor (mediante el comando helper `cy.loginInstructor()`).<br>**Paso 2:** Navegar al módulo de notificaciones ingresando a la URL `/notificaciones`.<br>**Paso 3:** Validar que la interfaz liste las notificaciones simuladas, identificando que la notificación #1 se encuentre sin leer (marcada con clase `unread` y badge `Nuevo`) y la #2 figure como leída (sin clases ni badges destacados).<br>**Paso 4:** Validar que el contador en el encabezado muestre "1 sin leer".<br>**Paso 5:** Presionar el botón "Marcar todas como leídas".<br>**Paso 6:** Validar que el contador cambie a "0 sin leer" y que todas las notificaciones pierdan los estilos e íconos de "sin leer".<br>**Paso 7:** Recargar el listado y hacer clic directo en la notificación #1.<br>**Paso 8:** Validar que el sistema invoque el endpoint de marcar como leída (`/api/notifications/1/read`) y navegue automáticamente a la vista detallada de la alerta asociada `/alertas/101`.<br>**Paso 9:** Tomar capturas de pantalla de las validaciones en Cypress. |
| **Resultado esperado** | El listado de notificaciones muestra de forma clara el estado de las alertas y su contador. El botón "Marcar todas como leídas" actualiza masivamente el estado en el frontend y en la API. Al hacer clic en una notificación no leída, esta se marca como leída y redirige al detalle de la alerta correspondiente. |
| **Resultado obtenido** | La prueba CP-H36-001 fue ejecutada de forma automatizada mediante Cypress. Con base en las validaciones y capturas generadas, se evidencia que la interfaz del módulo de notificaciones, los contadores de avisos no leídos, la actualización de estado de lectura y la redirección al detalle de la alerta asociada se comportaron de acuerdo a los criterios de aceptación de la historia H36. |
| **Observación técnica / Alcance** | Se vefifica la correcta sincronización entre el estado del frontend y los endpoints de `/api/notifications` (GET y PATCH). Los selectores de Cypress (`.nt-item.unread`, `.nt-badge-new`, `.nt-btn-secondary`, etc.) se mapean de forma exitosa sobre el DOM de la aplicación React. |
| **¿Prueba exitosa?** | **Sí ( X )** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **No ( )** |

### Soporte de evidencias - H36

> **Evidencia H36.1:** Captura asociada al listado de notificaciones con estados leídos y no leídos.
> *Ubicación del archivo:* `cypress/screenshots/h36.cy.js/H36-listado-notificaciones.png`

> **Evidencia H36.2:** Captura asociada al cambio masivo a estado leído ("Marcar todas como leídas").
> *Ubicación del archivo:* `cypress/screenshots/h36.cy.js/H36-marcar-todas-leidas.png`

> **Evidencia H36.3:** Captura asociada a la navegación automática al detalle de la alerta correspondiente al dar clic en la notificación.
> *Ubicación del archivo:* `cypress/screenshots/h36.cy.js/H36-detalle-alerta-redirigido.png`
