> ESTADO ACTUAL: producción activada y validada durante ventana autorizada; APK final verificada, instalación física no realizada. La última sección al pie es el checkpoint vigente.

> Estado más reciente: APK final compilada, firmada y verificada; entrega lista para ventana controlada, producción no activada. Ver actualización final al pie y FINAL-REPORT.md.

# Cierre final Nexo — checkpoint del 16 de noviembre de 2026

Directorio: `.artifacts/final-release-2026-11-16T20-40-45-740Z/`. Candidata anterior intacta. No se ha autorizado ventana de mantenimiento; producción sigue con sus versiones anteriores.

## Completado

- Identificados PostgreSQL5432, Admin y API operativos; Git Admin limpio y ninguna ruta operativa modificada.
- Respaldo completo consistente de PostgreSQL, restaurado en base nueva de instancia independiente55439. Las34 tablas/1781 filas coinciden por SHA256 y cantidad. `restore-verification.json` y `backup-manifest.private.json`.
- Copia verificable de código y configuración anterior en `previous-admin/`. Tras autorización específica del usuario, respaldo local adicional de configuración privada en `previous-runtime-config/`; nunca se envió a EAS ni se incluyó en código/APK/Git.
- Operación real tiene001–013; solo014 pendiente. SQL revisado, ensayado sobre restauración real y tablas de negocio inalteradas antes de pruebas de escritura. No se migró producción.
- Preparado Admin/backend final en `prepared-admin/`,52 rutas consolidadas. Las3diferencias de activación respecto de candidata son router móvil y dataset service; preservan vinculación del propietario y exigen autorizaciones explícitas para habilitar capacidades/redondeo en modo operativo. Copias versionables en integration/final-admin-changes.
- Web compilada con CALCQUIM_OPERATIONAL=true en `web-release/`; build finalizó en3.56s con advertencia de chunks. Se verificaron carga, editor de lavandería y reportes sin errores JavaScript contra restauración de solo lectura. El404 inicial de enlaces profundos era del servidor temporal de previsualización dentro de carpeta oculta, corregido allí; no era un defecto del build.
- Prueba aislada de modo operativo detectó y corrigió el último bloqueo del redondeo móvil limitado a synthetic. Se conservan dos ventas de intentos fallidos solo en la restauración; ensayo final aprobado25.25→25.50, replay sin duplicado, editor autorizado e inventario físico inalterado. `final-sale-smoke.json`; no se hicieron ventas ni inventarios de prueba en producción.
- Android distribución preparado en `mobile-release/`: conserva com.pamrm2089.calcQuim.pruebas de la APK anterior publicada, version1.0.1/code5, nombre Nexo · Ventas, LAN3016, QA0, credencial ingresada localmente. La firma anterior publicada es SHA25621235991ee27fc0df64ebca19260f03a2f798f83a48a25bb6d4deb5d5b007a3e. No se consultó ni alteró una instalación del teléfono.
- Guard de compatibilidad Android probado: bloquea catálogo y POST de borradores antiguos ante backend sin contrato fullclean-commerce-v1/política monetaria v2. Exportación JavaScript completa final aprobada, NativeWind file-output en build no QA. No se tocaron reglas comerciales ni se habilitaron liquidaciones.
- Manifiesto final: [final-release-manifest.json](final-release-manifest.json),52 archivos Admin y93 archivos móviles; [recuperación y ventana](FINAL-RECOVERY.md).

## En curso / pendiente

- Usuario autorizó expresamente compilación remota EAS con firma anterior. Build `f453c3c0-4b40-4403-b37e-88d5963ff8c3`, perfil final, subida2.2MB y keystore remoto existente. Último estado consultado IN_QUEUE, prioridad NORMAL. **Todavía no hay APK final verificada.**
- Consultar `node integration/check-final-apk.mjs` con acceso de red autorizado. Si FINISHED, descarga una sola vez, verifica certificado, package, code5/nombre y guarda `apk-verification.json`. No volver a ejecutar la descarga si ese archivo ya existe; verificar su hash. Si ERRORED, conservar error y revisar logs antes de otra build; no crear otra firma.
- No detener gestores ni aplicar014/rutas en Admin operativo sin autorización de la ventana. Tampoco inferir que no hay borradores en el teléfono; requiere revisión del operador. Configuraciones privadas se conservarán en su ubicación original al integrar.
- No hay acceso al contador de créditos ni a renovaciones. Checkpoints no suponen reanudación automática.

## Siguiente paso exacto

Finalizar build EAS, comparar firma/identificador y escanear APK sin secretos QA/operativos. Actualizar informe/checkpoint con el artefacto real. Después solicitar únicamente la ventana de mantenimiento necesaria para aplicar código/014 y actualizar clientes en coordinación. Si no hay ventana, entregar componentes preparados y plan de activación, sin declarar producción activada. No repetir auditoría ni suites completas.

- Completada persistencia de autorización en el lanzador normal, después de validar activación/configuración existentes. Entrega final:52 rutas Admin; cambios de activación en tres fuentes, no en configuración privada. El lanzador operativo original permanece intacto.
- Lectura final en producción: revisión248,001–013,0 inventarios pendientes y0 transacciones activas al consultar; no certifica borradores del teléfono ni sustituye ventana. JavaScript de distribución escaneado sin credenciales reales/QA ni destinos de ensayo.
- Herramienta de aplicación preparada (NO ejecutada): apply-final-release.mjs. Exige --window-confirmed, APK verificada y escaneada, servicios detenidos, backup restaurado cuyo contenido coincida con la base actual, ausencia de escritores, hashes de52fuentes y migración014 exclusiva. No arranca procesos automáticamente.


Actualización final de preparación:52 rutas Admin y93 archivos móviles con hashes verificados; copia anterior íntegra; Admin operativo limpio y0staged. Configuración privada respaldada localmente por autorización expresa. Metadatos de propietarios/ACL en security-metadata.private.json; restauración QA omitió deliberadamente propietarios/ACL, sin clonar autenticación operativa. Vinculación de la credencial existente verificada localmente sin red. EAS continúa IN_QUEUE: f453c3c0-4b40-4403-b37e-88d5963ff8c3. No hay APK final verificada ni autorización de ventana; no se declara cierre/activación completos. Para continuar consultar check-final-apk.mjs, luego scan-final-artifacts.py y actualizar este estado con los resultados reales. No reiniciar auditoría, no crear otra build ni otra firma.

- EAS pasó a IN_PROGRESS. El emulador existente contiene ambas aplicaciones anteriores; no se reemplazaron ni se borraron datos. La comprobación APK se hará por firma/manifiesto y escaneo; no se declarará un arranque nativo no ejecutado. Solo emulator-5554 está conectado; ningún teléfono físico intervenido.


## Actualización final ? APK terminada

- Build EAS f453c3c0-4b40-4403-b37e-88d5963ff8c3 FINISHED. Artefacto Nexo-Ventas-1.0.1-v5.apk,92,250,142 bytes, SHA256 ffdbb3bafedea6cf552818cc40551781dc09167c8f1942486a1643c07681c3d6.
- Firma idéntica a anterior, paquete com.pamrm2089.calcQuim.pruebas, nombre Nexo · Ventas, versión1.0.1/code5, minSdk24/target36. Permisos iguales a anterior, LAN HTTP permitido; no instalada ni aplicaciones previas sustituidas.
- Escaneo APK y exportación: sin credencial real ni QA ni destinos de auditoría comprobados. Evidencias apk-verification.json, apk-permissions-check.json, apk-manifest.txt y artifact-secret-scan.json.
- No volver a compilar/descargar para revisar: APK ya existe y su hash está registrado. Mantenerla fuera de Git.
- Siguiente paso exacto: autorización de ventana y confirmación de operador sin ventas/borradores pendientes; después FINAL-RECOVERY.md y apply-final-release.mjs --window-confirmed con servicios detenidos. No hubo cambios operativos en esta preparación.


## Activación operativa completada — 16/11/2026

- Autorización explícita del usuario: ventana ahora, sin ventas ni borradores/intentos pendientes. Registro window-authorization.json. No incluye instalación en teléfono.
- Detenidos web/API por gestor original; PostgreSQL no se detuvo. Respaldo fresco D:\ReactApps\calcQuim\.artifacts\final-release-2026-11-16T21-57-08-289Z restaurado en55439:34 tablas/1798 filas, todas las huellas coinciden. Conservados respaldos anteriores.
- Aplicación controlada:014y52 rutas, hashes verificados,0 escritores activos y respaldo vigente antes de migrar. No reescritura histórica, no DROP/DELETE ni conversión de inventario desconocido a0.
- Reactivación normal correcta. API3003/3016/3099 PID8140; web5173 PID9292; PostgreSQL5432 PID6564sin reiniciar. Gestor ready=true y mobileWarning=false.
- Verificación API/SQL:001–014, revisión250 y generación39656fe8-6025-4740-8f19-8b767f1e9a9c. Las33 tablas de negocio coinciden con respaldo de ventana. Contrato fullclean-commerce-v1 y política web-cash-nearest-50-min-50-v2 leídos usando cliente final/credencial existente. Catálogo119 productos,5 servicios,50 presentaciones; inventario/historial/alta se leen. Ninguna escritura de prueba en producción.
- Web operativa: editor de lavandería y reportes cargan,0erroresJS/consola,0 acciones de guardado. Evidencia activation-verification.json, activated-web-check.json y captura privada. Liquidaciones siguen deshabilitadas.
- Admin operativo contiene ahora las modificaciones esperadas; no está limpio porque se integraron52 rutas. Ambos repositorios sin staged, commits, merge ni push. Listado admin-applied-files.txt.
- Siguiente paso para uso móvil: instalar manualmente Nexo-Ventas-1.0.1-v5.apk como actualización del mismo paquete/certificado, sin desinstalar ni borrar datos; no se intervino el teléfono ni se sustituyeron apps del emulador. La APK anterior requiere actualización para vender contra el contrato nuevo. No repetir migración ni aplicar otra vez apply-final-release.mjs.
- Recuperación: conservar respaldo fresco y previous-admin, seguir FINAL-RECOVERY.md. Si ya hubo ventas nuevas, no restaurar base anterior encima sin conciliarlas.
