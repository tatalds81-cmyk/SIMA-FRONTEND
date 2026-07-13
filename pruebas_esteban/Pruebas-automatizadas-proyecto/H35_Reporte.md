# Reporte de Caso de Prueba: Historia de Usuario 35 (H35)

## Tabla de Caso de Prueba: CP-H35-001

| Campo | Detalle |
| :--- | :--- |
| **Id Caso de Prueba** | **CP-H35-001** |
| **Fecha de realización / Duración** | 08/07/2026 / 10 minutos |
| **Requerimiento funcional de la prueba** | Evaluar alerta por inasistencia en el sistema SIMA (H35). |
| **Objetivo** | Verificar que el sistema evalúe automáticamente las inasistencias de un aprendiz al cierre de una sesión de formación y genere/actualice las alertas correspondientes (3 inasistencias consecutivas o 5 inasistencias acumuladas sin justificación aprobada), notificando a los roles correspondientes (Instructor Líder / Aprendiz o Coordinador). |
| **Tipo de prueba** | Prueba funcional automatizada E2E (Cypress) con validación de interfaz, badges de estado/severidad, filtros de búsqueda, inspección de detalles y soporte visual. |
| **Datos de entrada de la prueba** | **Usuario de prueba:** Instructor (rol: `INSTRUCTOR`, email: `instructor@test.com`) y Sistema.<br>**Módulo evaluado:** Gestión de alertas (Consultar alertas).<br>**Alertas simuladas:**<br>1. Alerta #101: Tipo `ASISTENCIAL`, severidad `MODERADA`, estado `ABIERTA`, aprendiz `Ana Sofia Pérez Gómez` (Ficha `2561458`), acumuló 3 inasistencias consecutivas.<br>2. Alerta #102: Tipo `ASISTENCIAL`, severidad `GRAVE`, estado `ABIERTA`, aprendiz `Carlos Andrés Ríos Castro` (Ficha `2561458`), acumuló 5 inasistencias en el trimestre. |
| **Procedimiento de prueba** | **Paso 1:** Iniciar sesión en la plataforma SIMA como un usuario con rol de Instructor (mediante el comando helper `cy.loginInstructor()`).<br>**Paso 2:** Navegar al módulo de alertas ingresando a la URL `/alertas/consultar`.<br>**Paso 3:** Validar que la interfaz liste correctamente la alerta #101 de severidad `MODERADA` (3 inasistencias consecutivas) con los datos del aprendiz Ana Sofia Pérez Gómez.<br>**Paso 4:** Validar que la interfaz liste correctamente la alerta #102 de severidad `GRAVE` (5 inasistencias acumuladas) con los datos del aprendiz Carlos Andrés Ríos Castro.<br>**Paso 5:** Utilizar el filtro de severidad seleccionando el valor `GRAVE` y presionar el botón "Buscar".<br>**Paso 6:** Validar que el listado se actualice mostrando únicamente la alerta de Carlos Andrés Ríos Castro.<br>**Paso 7:** Limpiar los filtros y presionar el botón de "Ver detalle" (ícono de ojo) en la alerta #101.<br>**Paso 8:** Validar que se despliegue el modal con el detalle completo de la alerta, mostrando ID (#101), nombre del aprendiz (Ana Sofia Pérez Gómez), número de documento (1001234567), descripción de la alerta y creador ("Sistema").<br>**Paso 9:** Tomar capturas de pantalla de cada una de las validaciones en Cypress. |
| **Resultado esperado** | El listado de alertas debe visualizar las alertas automáticas de inasistencia generadas por el sistema. La alerta por 3 inasistencias consecutivas se muestra con severidad `MODERADA`. La alerta por 5 inasistencias acumuladas se muestra con severidad `GRAVE`. Los filtros de severidad aíslan correctamente los registros en la tabla. El modal de detalle abre y renderiza correctamente la información de la alerta seleccionada. |
| **Resultado obtenido** | La prueba CP-H35-001 fue ejecutada de forma automatizada mediante Cypress. Con base en las validaciones y capturas generadas, se evidencia que la interfaz del módulo de alertas, los badges de severidad, los filtros de búsqueda y el modal de detalles se comportaron de acuerdo al diseño esperado y cumplieron con los criterios de aceptación de la historia H35. |
| **Observación técnica / Alcance** | Se valida el correcto listado de alertas de inasistencia, severidades MODERADA y GRAVE correspondientes a las reglas de negocio de 3 consecutivas y 5 acumuladas respectivamente. Los selectores de Cypress (`h1.ca-page-title`, `.ca-btn-accion`, `.mcal-modal`, etc.) se enlazan exitosamente con el DOM de la aplicación React. |
| **¿Prueba exitosa?** | **Sí ( X )** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **No ( )** |

### Soporte de evidencias - H35

> **Evidencia H35.1:** Captura asociada a la visualización de la alerta por 3 inasistencias consecutivas (Nivel Moderada).
> *Ubicación del archivo:* `cypress/screenshots/h35.cy.js/H35-alerta-asistencial-moderada.png`

> **Evidencia H35.2:** Captura asociada a la visualización de la alerta por 5 inasistencias acumuladas (Nivel Grave).
> *Ubicación del archivo:* `cypress/screenshots/h35.cy.js/H35-alerta-asistencial-grave.png`

> **Evidencia H35.3:** Captura asociada a la aplicación de filtros por severidad Grave en el listado.
> *Ubicación del archivo:* `cypress/screenshots/h35.cy.js/H35-alertas-filtradas-grave.png`

> **Evidencia H35.4:** Captura asociada al modal de detalle de la alerta de inasistencia.
> *Ubicación del archivo:* `cypress/screenshots/h35.cy.js/H35-detalle-alerta-modal.png`
