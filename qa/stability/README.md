# Nexo: cierre de estabilidad en QA

Fecha de cierre: 14 de noviembre de 2026. Rama `dev`. **La fase de estabilidad queda documentada y verificada en el entorno QA; falta la validación en teléfono físico y la integración posterior de las correcciones. No se generó una APK definitiva.**

Esta reanudación comprobó el estado existente mediante Git, hashes, consultas HTTP GET y PostgreSQL en modo de solo lectura. No repitió las suites ni las operaciones manuales ya documentadas, porque los 28 archivos de correcciones conservan sus hashes. No se modificó código de negocio durante el cierre.

## A. Estado del repositorio y aislamiento

La inspección encontró 20 archivos rastreados modificados y 1,471 entradas no rastreadas en ese momento. El recuento incluye copias de fuentes y la unión de directorio `calcQuim-admin` que apunta a `qa/stability/admin`; no representa 1,471 cambios independientes. El cierre añade documentación y evidencia, por lo que el total posterior puede aumentar.

Las modificaciones previas de productos, presentaciones, inventario y `src/` se conservaron y no se atribuyen íntegramente a esta intervención. Las correcciones de estabilidad están en las copias `mobile/` y `admin/` de este directorio; [source-changes.json](source-changes.json) enumera sus 28 archivos y hashes frente a su base. No están activadas en el teléfono ni en el servidor operativo. No se hizo push, merge, limpieza ni reversión de archivos.

| Componente | Estado comprobado al cierre |
| --- | --- |
| Backend operativo | PID 9900; puertos 3003, 3016 y 3099 observados |
| Web operativa | PID 11760; puerto 5173 |
| Backend QA estabilidad | PID **4136**, `node qa/stability/start.mjs`, `127.0.0.1:63317` |
| Web QA estabilidad | PID 11044; `127.0.0.1:5187` |
| Metro QA | PID 1800 y proxy IPv4 PID 11808; puerto 8087 |
| PostgreSQL local | PID 6564; puerto 5432, compartido como servidor, con base y esquema QA separados |
| Base consultada | `calcquim_activation_test`, host `127.0.0.1` |
| Esquema QA | `calcquim_test_stable_3b0ef49e0733486bbf2a`, propósito `synthetic` |
| Sesión SQL de cierre | `transaction_read_only=on` |

La generación devuelta por catálogo, historial y editor HTTP coincide con la leída del esquema QA. Esto verifica el destino del backend activo, además de su configuración. QA usa almacenamiento local y credencial propios, slug `nexo-stability-qa` y API fijada a 63317; no recurre al servidor operativo. Se comparte el motor PostgreSQL, no los datos operativos. Los scripts de QA comprueban base, host, esquema y propósito antes de operar.

Evidencia actual: [resumen](closure-20261114T223041510Z/summary.json), [Git completo, incluidos no rastreados](closure-20261114T223041510Z/git-status-before.txt), [hashes de las correcciones](closure-20261114T223041510Z/source-checks.json), [preservación de archivos rastreados](closure-20261114T223041510Z/tracked-preservation.json), [PID y puertos actuales](closure-20261114T223041510Z/processes-current.json), [identidad SQL y estado HTTP](closure-20261114T223041510Z/current-qa.json). Las horas de esos archivos están en UTC.

## B. Diagnóstico: causas confirmadas y límites

Se confirmó que el bloqueo compartido de operaciones podía perder un intento de reconexión; el arranque esperaba la red antes de publicar la sesión local; y el estado offline o incierto deshabilitaba acciones de borrador sin explicar la causa. La pantalla de ventas era explícitamente de consulta y no tenía editor. También se detectó historial visual sin refrescar tras editar y un valor nulo incompatible con `accessibilityState` en React Native 0.85.

Estas causas tienen correcciones y pruebas. La causa exacta de los fallos de suspensión del teléfono físico sigue sin demostrarse: versión instalada, suspensión del fabricante, restricciones de batería, Wi-Fi y ejecución en segundo plano requieren pruebas en ese dispositivo. No se atribuyen todos los síntomas a una sola causa.

## C. Correcciones implementadas

- Sesión local disponible antes de la red; escrituras locales serializadas y captura parcial persistida. Una actualización de catálogo no pisa el borrador.
- Reconexión independiente de las mutaciones: épocas para ignorar respuestas antiguas, abortos por petición, timeout y reintentos GET acotados. Un 401/403 corta los reintentos y los errores de operación se distinguen de los de conexión.
- Descarte local seguro, incluso offline, de borradores sin envío incierto; archivo de la resolución y limpieza de la captura para que no reaparezcan al abrir.
- Recuperación de intentos inciertos mediante consulta de estado y conciliación explícita. Una revisión de catálogo obsoleta permite reintento explícito con la misma clave cuando consta que el intento fue rechazado, sin envío automático.
- Edición de ventas móviles confirmadas y desglose pendiente, con motivo, revisión comercial, confirmación física y claves persistentes. Se reutilizan los cálculos y movimientos existentes; el historial se refresca al regresar.
- Auditoría de correcciones marcada como `MOVIL`, normalización de estados booleanos de accesibilidad y protección contra cambiar servidor o credencial mientras hay intentos inciertos.

Piezas principales: `mobile/src/domain/mobileSession.mjs`, `reconnection.mjs`, `draftRecovery.mjs`, `submission.mjs`, `saleChanges.mjs`; pantallas `QuickSaleScreen`, `DraftRecoveryScreen`, `SaleEditScreen`, `SalesScreen`; servicio `mobileApi`; y `admin/server/src/mobile/stability.mjs`. El manifiesto contiene las rutas completas y el resto de cambios.

El backend QA incorpora consulta/cancelación de intentos, conciliación por referencia exacta, lectura del editor y consulta/envío de cambios de venta. La autorización distingue lectura, edición y conciliación. No se comenzó un rediseño de inventarios ni una nueva interfaz general.

## D. Protección de ventas, borradores e inventario

La clave lógica, el servidor y el cuerpo de una venta se persisten antes del envío. Se distingue `prepared`, `sent` y rechazo definitivo. Una respuesta perdida no autoriza una nueva venta: primero se consulta la misma clave. Los borradores antiguos sin metadatos suficientes se tratan conservadoramente como inciertos.

La cancelación y la creación comparten el bloqueo de `dataset_state`. Si la creación ya confirmó, se devuelve el comprobante existente; si la cancelación gana, queda una marca persistente en `idempotency_requests` que impide que un POST tardío cree otra venta. No se elimina una venta confirmada. El descarte local conserva una resolución archivada.

La conciliación con web exige ID o folio exacto, motivo y confirmación; no enlaza por importe, fecha o producto. Las correcciones conservan ID, folio y comprobante original, y registran revisión y movimientos de reversión/aplicación. Los cambios de venta también conservan su clave ante respuestas inciertas.

No se modificó el almacenamiento real del teléfono, no se borró caché y no se cambió una credencial operativa. Las migraciones previas de preparación se limitaron a esquemas sintéticos QA; durante esta reanudación no se ejecutó ninguna migración, ni operativa ni de QA.

## E. Resultados y evidencias

Las siguientes suites terminaron antes de la interrupción. En este cierre se comprobaron sus resultados y hashes, y que las fuentes de estabilidad siguen idénticas; **no se volvieron a ejecutar**.

| Suite | Resultado registrado | Evidencia |
| --- | --- | --- |
| Estabilidad, recuperación y redondeo de caja | 18/18, 0 fallos | [stability-results.log](stability-results.log) |
| Regresión móvil completa | 44/44, 0 fallos | [mobile-full-results.log](mobile-full-results.log) |
| Regresión backend | 45/45, 0 fallos | [backend-regression.log](backend-regression.log) |
| Regresión web | 339/339, 0 fallos | [web-regression.log](web-regression.log) |

Los recuentos son los reportados por Node, incluidos sus contenedores de subpruebas. No se suma de nuevo el subconjunto móvil de 32 pruebas. [historical-tests.json](closure-20261114T223041510Z/historical-tests.json) conserva recuentos, fechas y SHA256 de los logs; varios logs originales están codificados en UTF-16LE.

| Escenario | Resultado observado | Alcance de la evidencia |
| --- | --- | --- |
| Arranque sin API y sesión almacenada | Acceso local y captura conservados | Automatizado |
| Despertar y respuesta de petición anterior | Respuestas antiguas ignoradas; reconexión acotada | Automatizado; suspensión/despertar también manual en emulador |
| Descartar borrador offline preparado | Confirmación visible, captura vacía | Manual emulador y automatizado |
| Cerrar y reabrir después del descarte | Borrador descartado no reaparece, sin borrar datos | Manual emulador |
| Respuesta perdida tras confirmar venta | Consulta por la misma clave, sin duplicado | Automatizado con fallo de transporte controlado |
| Carrera cancelación/creación y POST tardío | Una resolución consistente, sin venta adicional tardía | Automatizado con bloqueo compartido |
| Venta realizada en web y pendiente móvil | Conciliación por referencia exacta, sin reenvío ciego | Automatizado |
| Editar venta móvil confirmada | Mismo ID/folio; original $10, revisión $20, versión 2 | Manual emulador, web y consulta SQL/HTTP actual |
| Desglose, cantidades y redondeo de caja | Corrección con cálculo/movimientos existentes; $13.30 → $13.50 según política de caja | Automatizado; no se afirma captura manual de todo el desglose |
| Backend nuevamente disponible | API QA responde y conserva esquema, venta e inventario | Consulta HTTP/SQL actual; recuperación modelada en pruebas anteriores |

Resultado comprobado de nuevo el **14/11/2026 a las 22:30 UTC**: una venta sintética `V-00001`, ID `13bf5a64-a92d-410c-9bf0-6cbae9d18542`, total $20, comprobante original $10, versión comercial 2, una revisión, último canal `MOVIL`. Inventario sintético: **98 litros**. Secuencia: 100 iniciales, venta −1, reversión +1, venta corregida −2. Coincide con [emulator-results.json](emulator-results.json), que se conservó sin sobrescribir.

El cierre añadió [audit-closure.mjs](audit-closure.mjs), que realiza GET y lecturas SQL con sesión de solo lectura y genera evidencia en un directorio nuevo. Su primera ejecución encontró la codificación UTF-16LE de los logs y se corrigió el lector del propio auditor; la segunda terminó correctamente. El directorio parcial anterior se conserva. Esto no fue un fallo de las suites ni produjo cambios de datos.

## F. Validación manual Android y web

Entorno anterior de validación: emulador Pixel 6, Android 15, `emulator-5554`, Expo Go 56.0.4 (versionCode 441), proyecto 1.0.0, Expo SDK 56 y React Native 0.85.3. Se ejecutó JavaScript de desarrollo por Metro 8087; no es una APK nativa nueva. Se consultó la [documentación exacta de Expo 56](https://docs.expo.dev/versions/v56.0.0/) antes de los cambios.

Se observó suspensión (`Dozing`) y retorno (`Awake`), recuperación de conexión sin cambiar servidor ni credencial, edición de la venta, corte/restauración únicamente del puente ADB de QA 63317, descarte offline y reapertura sin borrar almacenamiento. La web QA mostró el mismo folio por $20. No se manipuló un teléfono físico.

Capturas conservadas y verificadas por firma PNG, tamaño y hash en [screenshots.json](closure-20261114T223041510Z/screenshots.json):

- [Edición confirmada](../../.artifacts/stability/screenshots/edicion-confirmada.png).
- [Borrador offline](../../.artifacts/stability/screenshots/borrador-offline.png).
- [Borrador descartado offline](../../.artifacts/stability/screenshots/borrador-descartado-offline.png).
- [Reapertura sin borrar datos](../../.artifacts/stability/screenshots/reinicio-sin-borrar-datos.png).
- [Web con venta corregida](../../.artifacts/stability/screenshots/web-venta-corregida.png).

Tras la interrupción se verificó el backend PID 4136 por proceso, puerto y respuestas HTTP; no se repitió una interacción visual de reconexión después de ese reinicio concreto del backend QA. Las capturas y pruebas manuales descritas pertenecen a la ejecución anterior.

## G. Servicios y datos operativos preservados

Los PID operativos 9900 y 11760 coinciden con [baseline.json](baseline.json) y siguen escuchando en sus puertos. En esta reanudación no se detuvo ni reinició ningún servicio, tampoco QA. No se conectó una consulta SQL a la base operativa, no se ejecutaron migraciones operativas, no se eliminaron ventas, inventarios ni datos reales, y no se generó una APK. Los archivos SQL presentes en el repositorio no implican que se hayan ejecutado.

Las 20 modificaciones rastreadas existentes mantuvieron sus hashes durante la auditoría. Los archivos no rastreados se inventariaron y conservaron; no se hicieron limpiezas ni se sobrescribieron evidencias anteriores. Otros entornos QA y Metro ya existentes quedaron intactos. Durante este cierre solo se añadió el auditor, su evidencia nueva y este informe.

## H. Pendiente en teléfono físico e integración

La estabilidad queda confirmada dentro del alcance QA anterior; **la validación física sigue pendiente**:

1. Identificar versión de APK, SDK y configuración realmente instaladas; contrastarlas con estas fuentes. No se conoce todavía la equivalencia de la APK del teléfono.
2. Probar bloqueo y desbloqueo, suspensión prolongada, segundo plano, cierre normal y reapertura, incluyendo restricciones de batería del fabricante.
3. Probar pérdida y retorno de Wi-Fi y disponibilidad del backend, sin cambiar servidor/credencial: catálogo local, captura, reconexión y mensajes de estado.
4. Comprobar descarte y persistencia con almacenamiento existente. Si hay un intento real incierto, consultar su estado antes de cualquier conciliación; no borrarlo ni reenviarlo para probar.
5. En un entorno físico de ensayo aislado, confirmar edición, desglose, respuesta perdida y conciliación con web, preservando folio, auditoría y existencias.

Las correcciones siguen en copias QA: falta revisar su integración selectiva con las modificaciones previas del repositorio y preparar una compilación de prueba cuando corresponda. No se autoriza por este informe una activación operativa. No se comenzó el rediseño de inventarios ni la interfaz nueva. La validación específica de productos/presentaciones de la fase anterior conserva su documentación y no se da por sustituida por estos ensayos de estabilidad.

## I. Cómo revisar o reproducir

Desde `D:\ReactApps\calcQuim`, para una auditoría nueva de solo lectura:

```powershell
node qa/stability/audit-closure.mjs
```

Genera otro directorio `closure-*`; verifica fuentes, logs, SQL y API sin crear ventas ni iniciar migraciones. Exige que el backend QA ya esté disponible y que exista la venta histórica: si falta, falla sin recrearla.

Para abrir el entorno de revisión Android preparado:

```powershell
node qa/stability/review.mjs
```

Reutiliza los procesos QA que responden; si faltan, inicia únicamente sus componentes QA. Selecciona un emulador, no un teléfono físico, configura sus puentes 63317/8087 y abre Expo Go. Mantener la consola abierta si inicia procesos; Ctrl+C detiene solamente sus propios hijos. No es un comando estrictamente de solo lectura: puede iniciar QA y modificar puentes del emulador. No se ejecutó de nuevo para este cierre.

Web de revisión: <http://127.0.0.1:5187/ventas>. El acceso puede mostrar la entrada al entorno PostgreSQL de ensayo. En móvil, abrir Mis ventas, consultar `V-00001` y su edición. El estado esperado actual es $20, original $10, versión 2; editarlo de nuevo cambiará el conjunto sintético y el resultado esperado de la revisión histórica.

Solo si se necesita repetir pruebas por cambios posteriores:

```powershell
node --test qa/stability/stability.test.mjs qa/stability/recovery.test.mjs qa/stability/web-cash.test.mjs
```

Estas pruebas crean esquemas sintéticos propios en la base QA. No son necesarias para repetir el cierre mientras las fuentes y evidencias sigan iguales. No ejecutar comandos de despliegue, migración operativa ni generación de APK como parte de esta revisión.
