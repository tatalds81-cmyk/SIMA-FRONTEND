# Reporte de Caso de Prueba: Historia de Usuario 41 (H41)

## Tabla de Caso de Prueba: CP-H41-001

| Campo | Detalle |
| :--- | :--- |
| **Id Caso de Prueba** | **CP-H41-001** |
| **Fecha de realización / Duración** | 08/07/2026 / 11 minutos |
| **Requerimiento funcional de la prueba** | Registrar asistencia por huella digital (H41). |
| **Objetivo** | Verificar que el sistema permita registrar la asistencia de los aprendices mediante comparación biométrica (huella digital) a través de la integración con el servicio local de BioMini en el ambiente de formación, validando los estados de éxito, huella no identificada y error de comunicación. |
| **Tipo de prueba** | Prueba funcional automatizada E2E (Cypress) con simulación de peticiones HTTP locales al endpoint BioMini (puerto 8765) y validación de las transiciones de estado del modal flotante biométrico del instructor. |
| **Datos de entrada de la prueba** | **Usuario de prueba:** Instructor (rol: `INSTRUCTOR`).<br>**Módulo evaluado:** Asistencia del Instructor (AsistenciaInstructor) y servicio local de BioMini (`localBiominiService.js`).<br>**Datos de simulación (BioMini):**<br>1. Caso 1: Match exitoso (`MATCH_OK` / `id_usuario: 12` / `asistencia_registrada: true`).<br>2. Caso 2: Huella no coincidente (`MATCH_FAIL` / `asistencia_registrada: false`).<br>3. Caso 3: Caída del servicio BioMini local (Error de red / `forceNetworkError`). |
| **Procedimiento de prueba** | **Paso 1:** Iniciar sesión en la plataforma SIMA como un usuario con rol de Instructor (mediante el comando helper `cy.loginInstructor()`).<br>**Paso 2:** El sistema accede al Panel de control del instructor.<br>**Paso 3:** Navegar a la sección de control de asistencia de la ficha del grupo formativo (`/instructor/asistencia`).<br>**Paso 4:** Asegurar que la sesión de formación programada del día se encuentre en estado `ABIERTA`.<br>**Paso 5:** Hacer clic sobre la opción "Registro por huella" en la tarjeta de Métodos de registro.<br>**Paso 6:** Validar que la ventana flotante de escaneo biométrico (`.asistencia-fingerprint-modal`) sea visible en pantalla.<br>**Paso 7:** Simular la captura de huella biométrica enviando una petición POST al puerto local `8765/attendance/match`.<br>**Paso 8:** Para el Caso 1 (Huella Coincide), validar que el modal de huella transicione al estado "Asistencia registrada" e identifique al ID de usuario 12.<br>**Paso 9:** Para el Caso 2 (Huella No Identificada), validar que el modal transicione al estado "Huella no identificada" y ofrezca el botón "Reintentar lectura".<br>**Paso 10:** Para el Caso 3 (Error de Conexión), validar que el modal muestre el mensaje de error de lectura "Failed to fetch" e indique la opción de reintento.<br>**Paso 11:** Tomar capturas de pantalla de cada estado. |
| **Resultado esperado** | El modal de huella digital responde en tiempo real a las respuestas biométricas. Las huellas reconocidas registran la asistencia exitosamente y muestran el identificador del usuario. Las huellas no reconocidas o los errores de conexión se informan con precisión al instructor para que pueda reintentar o usar un método alternativo. |
| **Resultado obtenido** | La prueba CP-H41-001 fue ejecutada con éxito mediante Cypress. Las capturas demuestran que el componente `AsistenciaInstructor` interactúa adecuadamente con el servicio local de BioMini en el puerto local y gestiona los estados visuales en el modal según los códigos devueltos por el lector biometrista. |
| **Observación técnica / Alcance** | Se verifica que la integración local biométrica responda robustamente a los fallos de red locales y a los estados de no identificación de huellas, conforme a los requerimientos técnicos de la HU41. |
| **¿Prueba exitosa?** | **Sí ( X )** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **No ( )** |

### Soporte de evidencias - H41

> **Evidencia H41.1:** Captura asociada al registro biométrico exitoso ("Asistencia registrada").
> *Ubicación del archivo:* `cypress/screenshots/h41.cy.js/H41-registro-huella-exitoso.png`

> **Evidencia H41.2:** Captura asociada al caso de huella no reconocida ("Huella no identificada").
> *Ubicación del archivo:* `cypress/screenshots/h41.cy.js/H41-registro-huella-no-identificada.png`

> **Evidencia H41.3:** Captura asociada a la pérdida de conexión local con BioMini ("Error de lectura").
> *Ubicación del archivo:* `cypress/screenshots/h41.cy.js/H41-registro-huella-error-conexion.png`
