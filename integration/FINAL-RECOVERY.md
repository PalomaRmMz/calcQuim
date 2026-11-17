> ACTUALIZACIÓN: el usuario autorizó la ventana y ya se aplicaron014/52 rutas. Web/backend activos y verificados. No volver a ejecutar la aplicación; los pasos siguientes quedan como registro y procedimiento de recuperación. Respaldo de ventana: .artifacts/final-release-2026-11-16T21-57-08-289Z/.

# Ventana de activación y recuperación de Nexo

**No ejecutar los pasos de activación sin autorización explícita de la ventana.** No se recibió esa autorización en esta sesión. La autorización para EAS es independiente y no permite detener ventas.

## Estado recuperable demostrado

Entrega preparada: `.artifacts/final-release-2026-11-16T20-40-45-740Z/`.

- Base operativa identificada: `127.0.0.1:5432/calcquim_operational`, esquema `calcquim_operational`, rol existente `calcquim_operational_app`.
- Copia anterior verificable: `previous-admin/`, inventario SHA256 en `previous-code.private.json`. Incluye configuración anterior dentro del respaldo privado; no trasladarla a EAS ni Git.
- Respaldo consistente completo: `operational.private.dump`, SHA256 y huellas de todas las tablas en `backup-manifest.private.json`. Se tomó con transacción REPEATABLE READ READ ONLY y snapshot exportado usado por pg_dump.
- Restauración demostrada en instancia independiente55439, base nueva `nexo_release_restore_1794861655439`:34 tablas y1781 filas coinciden en cantidad y SHA256. No es un simple listado de pg_restore.
- La migración014 se ensayó allí: cambia una función de validación, sin reescribir ventas, inventarios ni dinero. Antes de las pruebas funcionales, todas las tablas de negocio conservaron sus huellas. Se añadieron después únicamente ventas de prueba en esa restauración para verificar el modo operativo; esa base de ensayo ya no es una copia prístina. El dump original permanece intacto.
- Originales de producción y candidata aprobada siguen sin modificar. Los servicios conocidos continúan con PID9900(API3003/3016/3099),11760(web5173),6564(PostgreSQL5432).

## Precondiciones de la ventana

1. APK terminada, certificado/identificador verificados y disponible. Coordinar actualización de la APK anterior: su contrato no satisface la política móvil nueva. No dejar clientes antiguos enviando durante la transición.
2. Confirmar con el operador que no hay capturas ni ventas pendientes en web/teléfono. El servidor no permite demostrar ausencia de un borrador aún local en el teléfono; no borrarlo ni darlo por vacío. Consultar intentos inciertos por su referencia exacta antes de reenviar.
3. Confirmar explícitamente inicio de mantenimiento y bloquear entradas de venta. Solo entonces detener el gestor con `node scripts/local-system.mjs stop` desde `D:/ReactApps/calcQuim-admin`. No detener PostgreSQL.
4. Comprobar que API3003/3016/3099 y web5173 ya no atienden y que no hay otros escritores/transacciones activas sobre la base. Si no se puede demostrar, no migrar.
5. Actualizar respaldo antes de cualquier cambio: desde el workspace móvil ejecutar `node integration/prepare-final-release.mjs --cutover-backup-only`. Crea otro directorio y verifica otra restauración independiente; no sobrescribe el respaldo actual ni cambia final-release.private.json. Si falla, no modificar producción. La ubicación nueva queda en cutover-backup.private.json. Retener ambos respaldos.
6. Comparar estado Git y hashes de base de las52 rutas con final-release-manifest.json. Si hay cambios posteriores, revisarlos; no sobrescribirlos automáticamente. Mantener .env operativa, marcador de activación, credencial, configuraciones y archivos propios no incluidos en la lista.

## Aplicación controlada

El único SQL pendiente en producción es014. No ejecutar el script genérico server/scripts/migrate.mjs: está limitado a bases sintéticas. La aplicación operativa debe usar una conexión verificada a5432/calcquim_operational, el módulo preparado server/src/db/migrate.mjs y esquema calcquim_operational, con servicios de escritura detenidos. Comprobar checksums001–013 y ejecutar solo014 dentro de una transacción, con lock_timeout corto y abortando ante bloqueo. No usar DOWN, DROP, TRUNCATE ni restaurar el dump encima de datos existentes.

Una vez autorizada la ventana, con APK verificada/escaneada y servicios detenidos, la aplicación selectiva está preparada en `node integration/apply-final-release.mjs --window-confirmed`. No se ejecutó durante esta preparación. El script verifica respaldo vigente, hashes y ausencia de escritores; aplica014 en transacción y no arranca procesos.

Copiar exclusivamente las52 rutas de prepared-admin que figuran en final-release-manifest.json, verificando SHA256 después. Las tres versiones finales de activación son server/src/mobile/router.mjs, server/src/services/dataset.mjs y scripts/operational-mobile.mjs; sus copias selectivas están en integration/final-admin-changes. No copiar .env, node_modules, configuraciones QA, fixture-evidence ni bundles Android de ensayo. Los motores comerciales ya son fuentes completas.

Para el arranque controlado, conservar la credencial autorizada en su ubicación original y establecer `CALCQUIM_MOBILE_COMMERCE_AUTHORIZED=yes` en el entorno del gestor que se inicia. El lanzador existente habilita CALCQUIM_MOBILE_OPERATIONAL_AUTHORIZED después de verificar su configuración; no omitir sus verificaciones. Ejecutar `node scripts/local-system.mjs start` desde el Admin operativo. No inferir que el arranque habilitó capacidades: consultar el catálogo con el cliente autorizado y verificar fullclean-commerce-v1 y web-cash-nearest-50-min-50-v2 antes de liberar ventas.

Verificaciones posteriores: health/ready, web carga, generación conservada, catálogo/inventario/historial reales se leen, servicios disponibles, política monetaria v2 publicada y sin errores de esquema. No crear ventas sintéticas ni modificar inventario operativo para comprobarlo. El ensayo de escritura ya se ejecutó en la restauración aislada.

La APK se instala manualmente solo cuando el operador autorice, usando actualización del mismo paquete y certificado; nunca desinstalar, borrar almacenamiento ni sustituirla automáticamente. Mantener los datos/borradores locales. La nueva APK exige el backend integrado incluso antes de enviar un borrador antiguo; si muestra Admin pendiente de actualización, no forzar reenvíos.

## Reversión

- Si014 falla, su transacción se revierte; conservar procesos detenidos hasta verificar el estado. No intentar arreglar datos históricos para forzarla.
- Si falla el código antes de reabrir ventas, reponer únicamente las rutas afectadas desde previous-admin verificando sus hashes y recuperar el entorno previo. Los archivos nuevos deben dejarse sin uso y documentados, no borrar el historial ni ejecutar limpiezas.
- Puede mantenerse014 aplicada durante una reversión de código: es una ampliación de validación. No volver a la función anterior después de registrar ventas MOVIL con metadata monetaria, porque podría rechazar documentos nuevos.
- Si ya hubo ventas reales posteriores al respaldo, **no restaurar la base completa encima de producción**. Congelar escrituras, conservar un respaldo del incidente y conciliar primero esas operaciones; una restauración ciega perdería ventas. No hay reversión automática segura de datos que ya cambiaron.
- No hacer downgrade/desinstalación forzada de Android: podría impedir acceso a borradores. Mantener copia de la APK previa y resolver compatibilidad del servidor o preparar una actualización con versionCode mayor. Una APK compilada no equivale a autorización para instalar.

La operación concreta de mantenimiento queda pendiente de autorización y comprobación de ausencia de escritores. Este documento no es una autorización ni debe ejecutarse como script.
