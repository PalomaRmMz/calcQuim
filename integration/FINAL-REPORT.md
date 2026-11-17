# Nexo — activación operativa completada

16 de noviembre de 2026. **Nexo Administración y backend actualizados, activos y verificados durante la ventana expresamente autorizada. APK Android compilada, firmada y verificada; no instalada en ningún dispositivo.**

## Entregables y estado

| Componente | Estado / ubicación |
| --- | --- |
| Administración y backend |52 rutas integradas en D:/ReactApps/calcQuim-admin; aplicación activa en http://127.0.0.1:5173 |
| API | Activa en3003 y3016; gestor3099 ready=true, mobileWarning=false |
| PostgreSQL | Migraciones001–014; instancia5432 conservada sin reinicio |
| Datos reales |33 tablas de negocio coinciden exactamente con respaldo de ventana; revisión250 al verificar |
| Respaldo fresco | .artifacts/final-release-2026-11-16T21-57-08-289Z/operational.private.dump;34 tablas/1798 filas restauradas y comparadas en55439 |
| APK final | [Nexo-Ventas-1.0.1-v5.apk](../.artifacts/final-release-2026-11-16T20-40-45-740Z/Nexo-Ventas-1.0.1-v5.apk), firmada y verificada; instalación manual pendiente |
| Proyecto Android exacto compilado | .artifacts/final-release-2026-11-16T20-40-45-740Z/mobile-release/ |
| Recuperación | Código/configuración anteriores en respaldo fresco previous-admin/ y respaldo privado previous-runtime-config/ de la preparación; manifiestos SHA256 conservados |

Directorio de evidencias y entrega: [final-release-2026-11-16T20-40-45-740Z](../.artifacts/final-release-2026-11-16T20-40-45-740Z/). [Checkpoint vigente](FINAL-PROGRESS.md), [manifiesto](final-release-manifest.json) y [rutas aplicadas](admin-applied-files.txt).

## Código y reglas conservadas

Se reutilizó la candidata aprobada sin reconstruir catálogos ni escenarios. Se aplicaron las52 rutas verificadas, conservando configuración operativa, credencial existente y archivos ajenos a la integración. Los motores son fuentes completas, sin reexports QA. Las tres adaptaciones finales de activación están en router móvil, dataset service y lanzador móvil: habilitan capacidades, estabilidad y redondeo en modo operativo después de las autorizaciones y vinculación de propietario existentes. No se introdujeron nuevas reglas comerciales.

Se conservan redondeo de efectivo aprobado (múltiplo0.50, empate hacia arriba, mínimo0.50 positivo menor0.25 y cero exacto), otros pagos sin ese ajuste, compras/presentaciones, inventario compartido, lavandería, comprobantes, historial, correcciones y reportes. **Liquidaciones monetarias permanecen deshabilitadas.** No se inventaron cobros, devoluciones ni escalas de mayoreo.

## Respaldo, migración y activación ejecutados

El usuario autorizó explícitamente la ventana y confirmó ausencia de ventas y borradores/intentos pendientes. Web/API se detuvieron con su gestor; PostgreSQL nunca se detuvo. Antes del cambio se generó otro respaldo consistente, sin sobrescribir el anterior. Se restauró en una base nueva de la instancia independiente55439:34 tablas/1798 filas coincidieron por cantidad y SHA256. Código y configuración anteriores se conservaron con manifiestos. Los archivos privados externos de configuración móvil se respaldaron localmente por autorización específica; nunca entraron a EAS, APK o Git.

Producción tenía001–013. Se revisó y ensayó014 sobre restauración real; solo reemplaza la función de validación para admitir metadata monetaria móvil, sin transformar documentos históricos. Durante el cambio se comprobaron hashes de base/finales, respaldo vigente, ausencia de escritores y bloqueos;014se aplicó en transacción con lock_timeout corto. No se ejecutaron DROP, TRUNCATE, DOWN ni restauraciones encima de producción. No se convirtieron inventarios desconocidos en cero.

Después se copiaron52 rutas y arrancó el gestor normal. API3003/3016/3099 PID8140 y web5173 PID9292; PostgreSQL5432 conserva PID6564. El lanzador final mantiene la autorización móvil tras validar las configuraciones existentes. No se copiaron credenciales QA, bases de ensayo ni bundles de evidencia al entorno operativo.

## Validación mínima y evidencia

- Health live y ready200; gestor listo y conexión móvil sin advertencia.
- Comparación SQL de las33 tablas de negocio con respaldo fresco: iguales. Migraciones001–014, revisión250 y generación39656fe8-6025-4740-8f19-8b767f1e9a9c al verificar.
- Cliente del proyecto Android final conectado al backend operativo con la credencial existente, sin imprimirla: fullclean-commerce-v1 y web-cash-nearest-50-min-50-v2 publicados. Se leen119 productos,5 servicios y50 presentaciones; inventario, historial y opciones de alta disponibles.
- Web operativa: lavandería, su editor y reportes cargan;0erroresJavaScript/consola y0 guardados de prueba. Captura privada conservada.
- Escritura validada solo en la restauración aislada:25.25→25.50, reintento devuelve la misma venta, editor autorizado y servicio no modifica inventario físico. Un ensayo previo detectó la restricción de redondeo a synthetic y se corrigió antes de activar; sus intentos fallidos permanecen solo en la restauración.
- Web compilada en preparación; exportación JavaScript Android completa sin QA y build nativo EAS final correctos. No se repitieron auditorías ni centenares de pruebas aprobadas.

Evidencias: activation-verification.json, operational-apply.private.json, activated-web-check.json, ports-after-activation.txt, final-sale-smoke.json y restore-verification.json del respaldo de ventana. **No se registraron ventas sintéticas ni ajustes de inventario para probar en producción.** La ausencia de borradores locales fue confirmada por el usuario; no se inspeccionaron ni borraron datos del teléfono.

## APK y uso móvil

APK92,250,142 bytes; SHA256 ffdbb3bafedea6cf552818cc40551781dc09167c8f1942486a1643c07681c3d6. Nombre Nexo · Ventas, versión1.0.1/code5, paquete com.pamrm2089.calcQuim.pruebas. Certificado SHA25621235991ee27fc0df64ebca19260f03a2f798f83a48a25bb6d4deb5d5b007a3e, idéntico al de la APK publicada anterior. minSdk24(Android7.0), targetSdk36; permiso Internet/HTTP LAN comprobado y cero permisos nuevos respecto de la versión anterior.

apksigner/aapt verificaron firma y manifiesto; el escaneo local del APK/exportación no encontró la credencial operativa, credencial QA ni destinos de auditoría comprobados. Se usó el keystore remoto existente de EAS, con autorización expresa; no se creó otra firma. El código exige el contrato nuevo antes de catálogo y POST de ventas, incluidos borradores previos. Ese contrato ya está activo y se verificó con el cliente final.

**Actualizar manualmente la APK anterior antes de registrar nuevas ventas desde el teléfono.** Transferir la APK e instalarla como actualización del mismo paquete/certificado; no desinstalar ni borrar datos. Si el paquete de la instalación existente es diferente, detenerse y revisar; se verificó la APK publicada previa, no una instalación física. Conservar credencial, servidor y borradores existentes; la URL operativa LAN sigue siendo http://192.168.1.64:3016 en la misma red local.

No se instaló en el teléfono ni se sustituyeron apps del emulador, que ya contenía las versiones anteriores. No se declara una prueba de arranque nativo no ejecutada. El proyecto exacto de este APK es mobile-release/; para futuras builds usar ese proyecto o revisar las cuatro fuentes de integration/final-mobile-changes, evitando recompilar una copia anterior con versionCode4. Transferir únicamente el archivo APK, no la carpeta de entrega que contiene respaldos y configuración privados.

## Recuperación, Git y siguientes pasos

[Plan de recuperación](FINAL-RECOVERY.md). Mantener el respaldo fresco y sus manifiestos. Si ocurre un incidente después de registrar ventas nuevas, no restaurar ciegamente una base anterior: congelar y conciliar primero. No revertir automáticamente014después de ventas MOVIL con metadata monetaria ni hacer downgrade/desinstalación Android.

Admin operativo ahora tiene las modificaciones esperadas; ya no corresponde llamarlo repositorio limpio. Ambos proyectos conservan historial y cambios previos, sin staged, commits, merges ni push. Artefactos, respaldos, configuración privada y APK permanecen ignorados. [Lista selectiva del workspace](final-review-files.txt); no se ejecutó git add.

**Estado final:** integrado en código, compilado, validado y activado en web/backend. APK final disponible y compatible; instalación física manual pendiente. La ventana autorizada se completó; no repetir014ni apply-final-release.mjs. El negocio puede continuar en la web actualizada. La instalación en teléfono no forma parte de la autorización de esta ventana.
