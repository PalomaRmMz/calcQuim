> Continuaci?n: [cierre final](FINAL-REPORT.md) y [checkpoint](FINAL-PROGRESS.md). La candidata documentada debajo se conserva intacta.

# Nexo — integración candidata

**Integración candidata completada y validada.** Copia aislada: [nexo-candidate-2026-11-15T21-44-20-714Z](../.artifacts/nexo-candidate-2026-11-15T21-44-20-714Z/). No se activó en producción. Este resultado valida una candidata técnica, sin autorizar publicación, migraciones operativas ni APK.

## Fuentes y orden aplicado

Se copió la base limpia de `D:/ReactApps/calcQuim-admin`, excluyendo .git, .env, privados, bases, respaldos y artefactos. Se comprobaron los hashes de base del primer paquete antes de aplicar cambios. Orden: `admin-changes` (26 archivos), `audit-admin-changes` (14) y `functional-admin-changes` (25). Son **65 aplicaciones sobre 51 rutas distintas**. Las versiones posteriores reemplazan únicamente las versiones anteriores de la cadena aprobada; no se encontró incompatibilidad de fuentes.

La comparación de **todo** `src`, `server/src` y migraciones con las fuentes aprobadas dio cero diferencias. Los motores `commerce`, `laundryPricing`, `hardwareCreation` y `settlementLedger` se incorporaron completos: no hay reexports hacia el workspace móvil o QA. También están las fuentes y fixtures necesarios de pruebas, archivos públicos, scripts, manifests y lockfiles de la base. `sources.json` conserva inventario SHA256 y orden por archivo; [candidate-manifest.json](candidate-manifest.json) identifica las 51 versiones finales y los hashes de base.

Las dependencias web/backend están copiadas físicamente dentro de la candidata, sin enlaces a QA ni al repositorio operativo. `npm ls --depth=0` valida las versiones instaladas. No se descargaron paquetes ni se cambiaron versiones. Se incluye `mobile/`, snapshot de las fuentes Android actuales y sus manifests/lockfile, con hashes en `mobile-sources.json`; las pruebas críticas importan ese snapshot contra el backend candidato. El proyecto móvil principal conserva sus cambios aprobados y sus dependencias existentes; no se modificó para esta integración.

## Validación realmente ejecutada

Evidencias dentro de la carpeta candidata; los recuentos incluyen los contenedores informados por Node.

| Comprobación | Resultado | Evidencia |
| --- | --- | --- |
| Build web desde fuentes y dependencias candidatas | Código 0 | web-build.log; web-build/ |
| Sintaxis backend | Todas las fuentes .mjs válidas | validation.json, backend-syntax |
| Integración crítica, backend candidato y snapshot móvil | 37/37 | critical-integration.log |
| Backend unitario candidato | 45/45 | backend-tests.log |
| Web candidata, lista explícita de 63 archivos | 335 aprobadas inicialmente +4 recuperadas =339 | web-tests.log y web-fixture-recovery.log |
| Móvil y regresiones adicionales | 58/58 | mobile-tests.log |
| JavaScript Android, grafo completo Metro | HTTP200, 4,740,698 bytes | android-compile.json |
| Inventario y documentos auditados, solo lectura | Revisión307,119 cuentas,15 ventas y9 compras conservadas | auditoría functional/verified-2026-11-15T21-48-07-195Z/summary.json |

El primer intento de la suite web encontró un fixture omitido al copiar la base: `benchmarks/comparator/fixture.mjs`. Se incorporó la carpeta fuente benchmarks, se corrigió el preparador y se repitió únicamente el archivo afectado: cuatro pruebas aprobadas. Se conservó el log fallido; las otras 335 no se repitieron ni se presentan como una ejecución única de339. No se modificó código funcional para corregir este problema de empaquetado.

La compilación Android usó el Metro QA existente con `dev=false,minify=true`; se cotejó el snapshot con cada fuente compilada. Comprueba el grafo JavaScript completo, no el binario nativo/Hermes de distribución. El bundle de evidencia procede del contexto QA, está ignorado y **no debe distribuirse** ni usarse como configuración operativa. No se generó una APK. El build web conserva advertencia de tamaño de chunks.

## Contratos y motores

Las pruebas críticas cubren efectivo web/móvil, política y versión de redondeo, capacidad del cliente, rechazo de contratos antiguos incompatibles, solicitudes idempotentes, repetición y respuestas perdidas, correcciones históricas y recibos originales/actualizados. Cubren reconexión, borradores, concurrencia, alta de productos, paquetes, compras, costos e inventario; lavandería valida modalidades, medias permitidas/prohibidas, cotizados descritos, mezcla de conceptos y ausencia de descuento físico por servicios.

Los imports de los ocho archivos de integración aprobados se redirigieron a las fuentes candidatas y al snapshot móvil. El runtime de pruebas está en `validation/`, separado de la aplicación: usa la configuración privada QA existente, no copia su credencial a las fuentes entregables. El escaneo de `src`/`server/src` rechaza rutas QA, puertos exclusivos del ensayo y reexports externos; la comprobación final busca además la credencial exacta del ensayo sin imprimirla. Las ramas móviles opcionales de QA y sus namespaces se conservan, deshabilitadas fuera de ese modo; no contienen valores privados del ensayo.

## Migraciones y dinero

La candidata contiene **001–014**. La 014, `mobile_payment_policy`, procede del paquete audit-admin-changes y amplía la validación de documentos para el contrato de redondeo móvil. No hay migración nueva en esta fase ni migración de liquidaciones. Los motores comerciales y de recibos finales corresponden al mismo contrato.

Las migraciones se ejercitaron exclusivamente desde el runtime adaptado contra **PostgreSQL independiente55439**, base `nexo_audit_test`, rol `nexo_audit_app`, en nuevos esquemas sintéticos `calcquim_test_auditreg_*`. La identidad se comprueba antes de migrar; no se usaron credenciales operativas. No se migró ni reseteó el escenario visible de la auditoría. PostgreSQL operativo5432 no recibió migraciones y ningún servicio operativo fue reiniciado.

**Liquidaciones deshabilitadas.** Se conserva la proyección técnica segura; no se añadió ni habilitó endpoint/botón para cobrar diferencias o devolver dinero. Editar o anular no constituye pago/devolución. Continúan las decisiones pendientes de [política monetaria](../qa/audit/SETTLEMENT-POLICY.md) y escalas de mayoreo. No se desarrollaron funcionalidades adicionales.

## Git, conservación y revisión

La candidata completa, dependencias y resultados están bajo `.artifacts/`, ignorados por Git. No se incorporan copias QA, contraseñas, bases ni bundles generados al conjunto revisable. Se preservaron los tres paquetes y todas las evidencias anteriores. Repositorio Admin operativo limpio y cero archivos staged; sin reset, clean, merges, commits ni push.

[candidate-review-files.txt](candidate-review-files.txt) lista selectivamente los archivos para revisión; **no se ejecutó git add**. Incluye las correcciones móviles previas, paquetes aprobados y herramientas/documentación de integración. [candidate-manifest.json](candidate-manifest.json) da el mapa final Admin, precedencia y snapshot móvil. `git-status-final.txt`, `ports-final.txt`, `validation.json` y `checkpoint.json` contienen el cierre verificable.

## Continuación segura

1. Revisar el manifiesto, las diferencias de las51rutas respecto de sus hashes de base y los logs de esta candidata. No volver a reconstruir catálogos ni a confirmar compras/ventas auditadas.
2. El build web se reproduce desde `admin/` con `node node_modules/vite/bin/vite.js build --config vite.candidate.config.mjs`; antes de repetir, cambiar la salida a una carpeta nueva para conservar la evidencia. El backend es JavaScript ESM: validación sintáctica y carga real de módulos están cubiertas por las pruebas; no existe un paso de transpilación separado.
3. No ejecutar `npm start`, `dev` o herramientas de activación heredadas sin revisar configuración: las fuentes base conservan scripts de operación. Para levantar la candidata más adelante, definir un runtime QA explícito, puertos libres y base/esquema sintéticos, verificar identidad y habilitar solo permisos QA. Ningún endpoint operativo se activa por esta entrega.
4. No trasladar `.env`, `validation/`, node_modules, bundles de evidencia ni rutas absolutas locales a producción. Para otra máquina usar manifests/lockfiles y reconstruir dependencias en su entorno controlado; el snapshot móvil puede restaurarlas desde su lockfile. No copiar reexports de la antigua carpeta QA.
5. La activación futura requiere ventana controlada, respaldo/restauración verificables, revisión de permisos móviles y migraciones pendientes del destino real; sigue fuera del alcance actual. Revisar compatibilidad NativeWind/Metro antes de distribución nativa. No se autoriza APK definitiva, publicación ni migración operativa.

Preparador: [prepare-candidate.mjs](prepare-candidate.mjs); validación: [validate-candidate.mjs](validate-candidate.mjs); recuperación puntual del fixture: [resume-candidate-validation.mjs](resume-candidate-validation.mjs); cierre: [finalize-candidate.mjs](finalize-candidate.mjs). Son herramientas de revisión, no scripts de despliegue. Preparar otra copia crea una ejecución nueva; no repetir la validación completa sobre esta carpeta porque sus logs se conservan con creación exclusiva.
