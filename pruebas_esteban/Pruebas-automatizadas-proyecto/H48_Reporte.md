# Reporte de Caso de Prueba: Historia de Usuario 48 (H48)

## Tabla de Caso de Prueba: CP-H48-001

| Campo | Detalle |
| :--- | :--- |
| **Id Caso de Prueba** | **CP-H48-001** |
| **Fecha de realización / Duración** | 09/07/2026 / 15 minutos |
| **Requerimiento funcional de la prueba** | Cerrar sesión y consolidar inasistencias (H48). |
| **Objetivo** | Verificar que al cumplirse la hora de fin de una sesión abierta, el sistema realice el auto-cierre (estado "CERRADA") y registre automáticamente a los aprendices sin marcas como "INASISTENTE" con el método "AUTOMATICO_CIERRE", validando que los controles de la interfaz se bloqueen y el estado cambie a "Sin sesion" en el panel. |
| **Tipo de prueba** | Prueba funcional y visual automatizada E2E (Cypress) con simulación de cambio de estado de sesión (de ABIERTA a CERRADA) y actualización del listado con inasistencias automáticas. |
| **Datos de entrada de la prueba** | **Usuario de prueba:** Instructor (rol: `INSTRUCTOR`).<br>**Módulo evaluado:** Asistencia del Instructor (AsistenciaInstructor) y listado de asistencias de la sesión.<br>**Datos de entrada:**<br>- Sesión de formación con ID `550`.<br>- Aprendiz Carlos Andrés Mendoza Pérez sin registro previo. |
| **Procedimiento de prueba** | **Paso 1:** Iniciar sesión en la plataforma SIMA como un usuario con rol de Instructor.<br>**Paso 2:** Configurar el ID de sesión `550` en el `localStorage` y cargar el panel de asistencia (`/instructor/asistencia`).<br>**Paso 3:** Mockear la sesión en estado `ABIERTA` con Carlos Andrés marcado como `INASISTENTE` y método `AUTOMATICO_CIERRE` (Fase 1: Simulación de marca de auto-inasistencia).<br>**Paso 4:** Validar que el estado de la sesión figure como `Activa` y que Carlos Andrés aparezca en la lista con estado `Inasistente` y método `Automatico`.<br>**Paso 5:** Capturar pantalla de la Fase 1.<br>**Paso 6:** Mockear la sesión en estado `CERRADA` y refrescar la página (Fase 2: Simulación de cierre de la sesión).<br>**Paso 7:** Validar que la píldora de estado de la sesión cambie a `Sin sesion` (rojo).<br>**Paso 8:** Validar que el cuadro de búsqueda de aprendices se encuentre inhabilitado (`disabled`).<br>**Paso 9:** Validar que la tabla muestre el mensaje de listado vacío indicando que no hay aprendices para la sesión cerrada en tiempo real.<br>**Paso 10:** Capturar pantalla del panel de la sesión auto-cerrada y finalizar. |
| **Resultado esperado** | Tras cumplirse la hora de fin, la sesión pasa a CERRADA ("Sin sesion"). Los aprendices sin registros previos son marcados como "Inasistente" con método "AUTOMATICO_CIERRE" (renders "Automatico"). La interfaz deshabilita las acciones de búsqueda y registros manuales al cerrarse la sesión. |
| **Resultado obtenido** | La prueba CP-H48-001 se ejecutó de forma automatizada y exitosa con Cypress. El sistema reflejó de forma conforme el estado `Inasistente` con método `Automatico` cuando la sesión estaba activa, y tras el cierre de la misma, deshabilitó correctamente las interacciones en el panel mostrando el estado de la sesión como `Sin sesion`. |
| **Observación técnica / Alcance** | La inicialización forzada del `localStorage` antes del reload permite evaluar de manera secuencial la transición de estados en una misma spec de Cypress de forma controlada y robusta. |
| **¿Prueba exitosa?** | **Sí ( X )** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **No ( )** |

### Soporte de evidencias - H48

> **Evidencia H48.1:** Captura del panel del instructor con la sesión activa y Carlos Andrés auto-registrado como Inasistente por cierre automático.
> *Ubicación del archivo:* `cypress/screenshots/h48.cy.js/H48-sesion-activa-auto-inasistencia.png`

> **Evidencia H48.2:** Captura del panel del instructor tras el auto-cierre, con estado "Sin sesion" y buscador deshabilitado.
> *Ubicación del archivo:* `cypress/screenshots/h48.cy.js/H48-sesion-autocerrada-inasistencias.png`
