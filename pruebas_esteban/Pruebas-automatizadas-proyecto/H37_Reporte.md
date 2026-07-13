# Reporte de Caso de Prueba: Historia de Usuario 37 (H37)

## Tabla de Caso de Prueba: CP-H37-001

| Campo | Detalle |
| :--- | :--- |
| **Id Caso de Prueba** | **CP-H37-001** |
| **Fecha de realización / Duración** | 08/07/2026 / 7 minutos |
| **Requerimiento funcional de la prueba** | Conservar historial de alertas (H37). |
| **Objetivo** | Verificar que el sistema conserve el historial de alertas (abiertas y cerradas) de un aprendiz sin eliminación física, y permita visualizar el historial y la justificación de cierre de una alerta cerrada en la línea de tiempo del modal de detalle. |
| **Tipo de prueba** | Prueba funcional automatizada E2E (Cypress) con validación de listado histórico de alertas, badges distintivos de estado y validación de línea de tiempo con justificaciones de cierre. |
| **Datos de entrada de la prueba** | **Usuario de prueba:** Instructor (rol: `INSTRUCTOR`, email: `instructor@test.com`) y Sistema.<br>**Módulo evaluado:** Gestión de alertas (Consultar alertas).<br>**Alertas mockeadas:**<br>1. Alerta #101: Tipo `ASISTENCIAL`, severidad `MODERADA`, estado `ABIERTA`, aprendiz `Ana Sofia Pérez Gómez` (Ficha `2561458`).<br>2. Alerta #99: Tipo `CONVIVENCIAL`, severidad `GRAVE`, estado `CERRADA`, aprendiz `Ana Sofia Pérez Gómez` (Ficha `2561458`), creada por Coordinador Académico, fecha de cierre: `28/06/2026`, justificación: "Se dialogó con el aprendiz y se firmó acta de compromiso académico." |
| **Procedimiento de prueba** | **Paso 1:** Iniciar sesión en la plataforma SIMA como un usuario con rol de Instructor (mediante el comando helper `cy.loginInstructor()`).<br>**Paso 2:** Navegar al módulo de alertas ingresando a la URL `/alertas/consultar`.<br>**Paso 3:** Validar que el listado de alertas muestre tanto la alerta activa (ID #101, estado `ABIERTA`) como la alerta histórica cerrada (ID #99, estado `CERRADA`) para el mismo aprendiz.<br>**Paso 4:** Hacer clic en el botón de "Ver detalle" de la alerta cerrada (ID #99).<br>**Paso 5:** Validar que se despliegue el modal con el detalle y que, dentro del contenedor del modal, se muestre de forma clara el tipo de alerta (`CONVIVENCIAL`), el estado (`CERRADA`) y la descripción del incidente.<br>**Paso 6:** Validar que en la sección "Historial" (línea de tiempo) se detallen las transiciones de estado, figurando la justificación de cierre ("Se dialogó con el aprendiz y se firmó acta de compromiso académico.") y el responsable que ejecutó el cierre ("Cerrada por: ID Usuario 3").<br>**Paso 7:** Tomar capturas de pantalla de las validaciones en Cypress. |
| **Resultado esperado** | El listado de alertas debe conservar y listar los registros cerrados como antecedentes de consulta del aprendiz. Al consultar el detalle de una alerta cerrada, el modal debe reflejar el historial cronológico del ciclo de vida de la alerta, incluyendo el motivo de cierre y el usuario responsable. |
| **Resultado obtenido** | La prueba CP-H37-001 fue ejecutada de forma automatizada mediante Cypress. Con base en las validaciones y capturas generadas, se evidencia que la tabla general de alertas conserva y distingue los registros abiertos y cerrados, y que el modal de detalle renderiza correctamente el historial y las justificaciones del cierre cronológicamente, cumpliendo con los criterios de aceptación de la historia H37. |
| **Observación técnica / Alcance** | Se verifica que las alertas cerradas permanezcan visibles en la interfaz y que no sufran alteración física. Los selectores de Cypress (`.nt-item`, `.mcal-modal`, `.da-timeline`, etc.) se mapean correctamente sobre el DOM de la aplicación React. |
| **¿Prueba exitosa?** | **Sí ( X )** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **No ( )** |

### Soporte de evidencias - H37

> **Evidencia H37.1:** Captura asociada al listado del historial de alertas, visualizando tanto abiertas como cerradas.
> *Ubicación del archivo:* `cypress/screenshots/h37.cy.js/H37-listado-historial-alertas.png`

> **Evidencia H37.2:** Captura asociada al modal de detalle de la alerta cerrada, mostrando la justificación del cierre e historial de transiciones.
> *Ubicación del archivo:* `cypress/screenshots/h37.cy.js/H37-detalle-alerta-cerrada-historial.png`
