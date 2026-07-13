# Reporte de Caso de Prueba: Historia de Usuario 46 (H46)

## Tabla de Caso de Prueba: CP-H46-001

| Campo | Detalle |
| :--- | :--- |
| **Id Caso de Prueba** | **CP-H46-001** |
| **Fecha de realización / Duración** | 09/07/2026 / 10 minutos |
| **Requerimiento funcional de la prueba** | Registrar evidencias de asistencia (H46). |
| **Objetivo** | Verificar que el sistema registre y asocie metadatos técnicos (como origen, coordenadas geográficas, hora exacta, token QR o método) al realizar marcas de asistencia, habilitando una bitácora de evidencias inmutable consultable desde el panel del instructor sin almacenar datos biométricos sensibles. |
| **Tipo de prueba** | Prueba funcional y visual automatizada E2E (Cypress) con simulación de payload de evidencias y visualización del historial en el modal de detalle del instructor. |
| **Datos de entrada de la prueba** | **Usuario de prueba:** Instructor (rol: `INSTRUCTOR`).<br>**Módulo evaluado:** Modal de Detalle de Asistencia en el panel del Instructor.<br>**Datos de entrada:**<br>- Registro de asistencia del aprendiz con ID `12` en estado `PRESENTE` con método `QR` y con evidencias conteniendo coordenadas (`latitud`, `longitud`), token QR, `device_uuid` y marca de tiempo. |
| **Procedimiento de prueba** | **Paso 1:** Iniciar sesión en la plataforma SIMA como un usuario con rol de Instructor.<br>**Paso 2:** Navegar a la sección de control de asistencia de la ficha del grupo formativo (`/instructor/asistencia`).<br>**Paso 3:** Asegurar que la sesión se encuentre en estado `ABIERTA`.<br>**Paso 4:** Cerrar condicionalmente el aviso emergente de aprendices pendientes.<br>**Paso 5:** Validar en el listado principal la existencia del aprendiz registrado con método `QR`.<br>**Paso 6:** Hacer clic en el botón de acción (icono de "Ojo") de la fila correspondiente al aprendiz Carlos Andrés Mendoza Pérez para abrir la bitácora de detalles.<br>**Paso 7:** Validar que el modal de detalle de asistencia sea visible.<br>**Paso 8:** Verificar en la línea de tiempo del modal de detalle que figuren las evidencias registradas (método "QR", fecha, hora exacta y estado del registro).<br>**Paso 9:** Tomar capturas de pantalla de la bitácora de evidencias técnica. |
| **Resultado esperado** | La marca de asistencia cuenta con evidencias técnicas (método QR, hora y estado). La evidencia está asociada de forma inmutable a la sesión y al aprendiz relacionado. El instructor puede consultar la evidencia técnica desde el modal de detalle en tiempo real. |
| **Resultado obtenido** | La prueba CP-H46-001 se ejecutó de forma automatizada y exitosa con Cypress. El sistema recuperó y enlazó correctamente las evidencias del registro, desplegando el log de auditoría con la marca de tiempo, método y estado correspondiente en el modal de detalle de asistencia de forma inmutable. |
| **Observación técnica / Alcance** | Se corrobora que la consulta de evidencias sea estrictamente de solo lectura y que el modal exponga los metadatos de auditoría de forma clara para el instructor responsable. |
| **¿Prueba exitosa?** | **Sí ( X )** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **No ( )** |

### Soporte de evidencias - H46

> **Evidencia H46.1:** Captura del listado de asistencia en tiempo real con la columna de acciones (Eye icon) disponible.
> *Ubicación del archivo:* `cypress/screenshots/h46.cy.js/H46-instructor-ver-detalle.png`

> **Evidencia H46.2:** Captura del modal "Detalle de asistencia" abierto desplegando la bitácora de evidencias y línea de tiempo con método "QR".
> *Ubicación del archivo:* `cypress/screenshots/h46.cy.js/H46-bitacora-evidencias.png`
