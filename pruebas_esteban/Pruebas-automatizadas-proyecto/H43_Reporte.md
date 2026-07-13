# Reporte de Caso de Prueba: Historia de Usuario 43 (H43)

## Tabla de Caso de Prueba: CP-H43-001

| Campo | Contenido |
| :--- | :--- |
| **Id Caso de Prueba** | **CP-H43-001** |
| **Fecha de realización / Duración** | 09/07/2026 / 15 minutos |
| **Requerimiento Funcional de la prueba** | Registrar asistencia de forma automática mediante el escaneo de un código QR válido asociado a la sesión de formación activa (H43). |
| **Objetivo** | Verificar que el aprendiz pueda registrar de forma ágil su asistencia (marcando Presente o Tarde en base a la tolerancia horaria) al escanear un código QR válido, restringiendo los intentos duplicados o registros en sesiones inoperativas. |
| **Tipo de Prueba** | Prueba funcional móvil y de API. |
| **Datos de entrada de la prueba** | **Usuario de prueba:** Aprendiz autenticado y activo.<br>**Módulo evaluado:** Registro de asistencia del Aprendiz (móvil) y API de confirmación de QR (`/api/attendances/qr`).<br>**Datos de entrada:**<br>1. Aprendiz activo perteneciente al grupo formativo y a la lista base de la sesión.<br>2. Sesión de formación programada en estado `ABIERTA`.<br>3. Código QR dinámico válido asociado a la sesión.<br>4. Coordenadas de geolocalización e identidad validadas previamente. |
| **Procedimiento de prueba** | **Paso 1:** Iniciar sesión en la aplicación móvil con el rol de Aprendiz.<br>**Paso 2:** Seleccionar la opción de escáner QR en el menú principal.<br>**Paso 3:** Escanear el código QR dinámico generado para la sesión de formación activa.<br>**Paso 4:** El sistema envía al backend la petición con las coordenadas GPS, token de identidad y código QR decodificado.<br>**Paso 5:** Si el registro ocurre dentro de los primeros 10 minutos de la hora teórica de inicio, validar que el estado se registre como `PRESENTE`.<br>**Paso 6:** Si el registro ocurre después de los primeros 10 minutos, validar que el estado se registre como `TARDE`.<br>**Paso 7:** Intentar escanear el mismo código QR por segunda vez y validar que el sistema devuelva un error de registro duplicado ("Asistencia ya registrada").<br>**Paso 8:** Intentar escanear el código QR de una sesión que ha sido CERRADA o CANCELADA y validar que el sistema rechace el registro e informe que la sesión no está activa.<br>**Paso 9:** Verificar que el método de registro de la marca se guarde en la base de datos como `QR`.<br>**Paso 10:** Tomar capturas de pantalla de cada estado. |
| **Resultado esperado** | El sistema registra automáticamente la asistencia con el estado correcto (Presente/Tarde) según la hora de marcación y la tolerancia. El método de registro se almacena en la base de datos como `QR`. Se impiden registros duplicados y marcas en sesiones inactivas. |
| **Resultado obtenido** | El sistema procesó correctamente la lectura del código QR. Registró la asistencia como `PRESENTE` o `TARDE` en el tiempo exacto de escaneo, asignando el método `QR` en la base de datos, y denegó de forma exitosa los intentos duplicados y marcas en sesiones cerradas. |
| **¿Prueba exitosa?** | **Sí ( X )** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **No ( )** |

### Soporte Pantallazos ejecución de la prueba

> **H43.1** Escaneo del código QR dinámico desde la cámara del dispositivo móvil del aprendiz.
> **H43.2** Pantalla de confirmación de asistencia registrada con éxito (estado "Presente").
> **H43.3** Pantalla de confirmación de asistencia registrada con retraso (estado "Tarde").
> **H43.4** Mensaje de error al intentar escanear el código QR por segunda vez (registro duplicado).
> **H43.5** Mensaje de error al escanear un código QR correspondiente a una sesión cerrada.
> **H43.6** Visualización de la asistencia con método "QR" en el panel del instructor.
