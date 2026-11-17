> Activación operativa completada en ventana autorizada: [informe final](../../integration/FINAL-REPORT.md) y [checkpoint](../../integration/FINAL-PROGRESS.md). Web/backend activos,014aplicada,APK verificada; teléfono no intervenido.

> Cierre final posterior: [informe](../../integration/FINAL-REPORT.md), [checkpoint](../../integration/FINAL-PROGRESS.md) y [ventana/recuperación](../../integration/FINAL-RECOVERY.md). Producción sin activar; APK final compilada y verificada. No repetir la auditoría.

> Integración candidata posterior completada y validada: [informe](../../integration/CANDIDATE-REPORT.md) y [checkpoint](../../integration/CANDIDATE-PROGRESS.md). No repetir operaciones de auditoría.

> Continuación del 15/11: [cierre funcional](../audit/FUNCTIONAL-REPORT.md) y [paquete selectivo posterior](../../integration/functional-admin-changes/README.md). La auditoría actual usa la instancia independiente 55439; los puertos/esquemas descritos debajo corresponden a la fase histórica.

# Nexo integrado: entrega de desarrollo y QA

14 de noviembre de 2026 · rama `dev` · sin commit, push, merge, despliegue ni APK definitiva.

**El móvil principal ya incorpora la estabilidad y el alta simplificada. El backend y Admin combinados están funcionando en un QA nuevo; sus cambios se entregan también como parche selectivo versionable. El repositorio Admin que sirve las ventas reales no se modificó.**

## Correcciones y archivos principales

- Integración móvil de 16 archivos revisados, con comprobación previa de hashes y respaldo de sus versiones locales en `.artifacts/integrated/before/`. Se incorporaron sesión local, reconexión independiente, reintentos GET acotados, descarte seguro, recuperación y conciliación por referencia exacta, claves persistentes contra duplicados y editor de ventas. Los cambios anteriores de productos, catálogo, inventario y cálculos se conservaron.
- `App.js`, `src/hooks/useMobileSale.js`, `src/domain/mobileSession.mjs`, `reconnection.mjs`, `draftRecovery.mjs`, `submission.mjs` y `saleChanges.mjs`; pantallas `DraftRecoveryScreen`, `SaleEditScreen`, `QuickSaleScreen` y `SalesScreen`; servicios `mobileApi` y `saleChangesStorage`.
- Se corrigió además un bloqueo encontrado durante esta integración: actualizar solo el detalle dejaba deshabilitada la edición cuando el catálogo tenía una revisión anterior. La consulta y la actualización del detalle ahora sincronizan el catálogo; al regresar del editor se refresca el detalle. Se comprobó visualmente el retorno con el nuevo importe.
- `HardwareCreateScreen.js`: nombre comercial completo, sin campo de variante/talla; tres modalidades rápidas, inventario físico y equivalencia automática; opciones adicionales para otras unidades y presentaciones. No se agregó un editor móvil de productos existentes: el editor de productos de Admin sí se simplificó y la edición móvil incorporada corresponde a ventas.
- `ItemSelect.js`: contraste, peso de texto, selección con icono y controles de tamaño legible. Menos espacio en el formulario y tarjetas avanzadas, etiquetas explícitas y teclado entero para inicial de piezas. `hardwareCreation.mjs` reconoce Naturella para sugerir Higiene personal sin crear categorías duplicadas.
- Admin: alta rápida y editor sin Variante/talla ni Características, conservación de datos históricos, precio pendiente consistente y tarjetas de presentaciones más compactas. Los inputs comerciales de cantidad son numéricos cortos y aparecen junto a Agregar cuando hay espacio. Se conserva la separación entre compra, venta y unidad base, y la validación entera de piezas/paquetes; las unidades fraccionables mantienen decimales.
- Identidad visible: **Nexo · Ventas** y **Nexo · Administración**. Se conservan identificadores técnicos y la identidad de Full Clean en comprobantes. [Preparación de icono y carga para la fase posterior](../../docs/android-branding-followup.md); activos nativos sin sustituir.

No se eliminaron columnas ni datos históricos. La compatibilidad de cargas antiguas que incluyan variante/características permanece en el motor; los formularios nuevos usan directamente el nombre completo. No se cambiaron precios, redondeo, tarifas ni reglas comerciales de productos existentes.

## Estado de integración del backend

[Parche selectivo de Admin](../../integration/admin-changes/nexo-integrated.patch), [manifiesto](../../integration/admin-changes/manifest.json) e [instrucciones de alcance](../../integration/admin-changes/README.md). Incluye 26 archivos con las mejoras previas de productos, backend de estabilidad, cambios de interfaz y la expectativa actualizada de identidad en una prueba.

El parche se aplicó realmente sobre una carpeta de comprobación aislada y se comparó el SHA256 de cada fuente, normalizando únicamente CRLF/LF. Evidencia: [patch-check.json](../../.artifacts/integrated/patch-check.json). La instancia Admin QA usa esas fuentes; tres motores compartidos se resuelven hacia el móvil principal, y el parche incorpora sus fuentes completas para que Admin no dependa de una carpeta QA.

No se copiaron carpetas QA completas al código principal ni se aplicó el parche al repositorio vecino operativo. **La futura activación de endpoints y permisos en el servidor real sigue pendiente**; una APK actual conectada a ese servidor todavía no obtiene estas capacidades nuevas. No se sustituyeron la web ni la APK en uso.

## Aislamiento y servicios

| Componente | Dirección / proceso comprobado |
| --- | --- |
| API del QA integrado | `127.0.0.1:63327`, PID 14644 |
| Web del QA integrado | `127.0.0.1:5197`, PID 2548 |
| Metro móvil principal | `::1:8097`, PID 13468; proxy IPv4 PID 23452 |
| QA anterior de estabilidad | API 63317 PID 4136 y web 5187 PID 11044, conservados |
| Backend operativo | PID **9900**, puertos 3003/3016/3099, conservado |
| Web operativa | PID **11760**, puerto 5173, conservado |

Base QA: `calcquim_activation_test`, host `127.0.0.1`. Esquema de revisión: **`calcquim_test_integrated_3ea4e40cba2d4c9b9dcc`**, propósito `synthetic`. Comparte motor PostgreSQL con otras bases, pero no tablas ni datos operativos. La generación del API se contrastó con SQL. Las verificaciones del ejercicio utilizan `default_transaction_read_only=on`.

`runtime.mjs` limita base, host y patrón de esquema antes de preparar un esquema QA. Las migraciones existentes 001–013 se aplicaron exclusivamente a esquemas QA nuevos; no hay una migración de negocio nueva ni se ejecutó `down`. Los escenarios automatizados usan otros esquemas sintéticos y no alteran el ejercicio visible.

El móvil QA fija el API a 63327 y separa estado, credencial e intentos de ventas, altas, inventario y revisiones. Las claves de almacenamiento y credencial operativas se conservaron. Solo se cortó/restauró el puente ADB **63327** del emulador durante la prueba de red; no se detuvieron servicios para simular el fallo.

[PID, puertos y preservación de Admin](../../.artifacts/integrated/processes-final.json). El cambio previo de `server/src/repositories/salesHistory.mjs` en el repositorio vecino se conservó y coincide con su copia anterior. No se conectó SQL a la base operativa ni se eliminaron datos reales. No se reinició ni detuvo ningún proceso operativo.

## Pruebas ejecutadas después de integrar

| Prueba | Resultado final | Evidencia |
| --- | --- | --- |
| Móvil principal, suite completa | **44/44**, cero fallos | [log](../../.artifacts/integrated/mobile-tests-final.log) |
| Estabilidad + recuperación + caja + productos e inventario PostgreSQL integrados | **37/37**, cero fallos | [log](../../.artifacts/integrated/integration-tests-final.log) |
| Backend integrado, unitarias | **45/45**, cero fallos | [log](../../.artifacts/integrated/backend-tests.log) |
| Web integrada, regresión completa | **339/339**, cero fallos | [log](../../.artifacts/integrated/web-tests-complete.log) |
| Compilación Vite QA | Correcta; advertencia de tamaño de chunks | [log](../../.artifacts/integrated/web-build.log) |
| Exportación JavaScript/Hermes Android | Correcta; **no es una APK** | [log](../../.artifacts/integrated/mobile-export.log) |
| Parche Admin aplicado en carpeta aislada | 26 archivos, fuentes coincidentes | [resultado](../../.artifacts/integrated/patch-check.json) |

Los recuentos son los informados por Node, incluidos contenedores de subpruebas; no se suman ejecuciones repetidas. [Resumen con hashes](../../.artifacts/integrated/verification-summary.json).

Se corrigieron el montaje inicial del arnés de regresión, las expectativas de nombre anterior y la ubicación de la caché Vite. El sandbox impidió un intento de caché fuera de QA; se redirigieron dependencias a la copia QA local y la regresión final completa pasó. PowerShell bloqueaba `npm.ps1`; se utilizó `npm.cmd` sin cambiar la política del sistema. Los logs iniciales se conservaron y no se presentan como aprobados.

Las pruebas integradas cubren respuesta perdida tras COMMIT, consulta sin reenvío, clave concurrente, carrera cancelación/creación, POST tardío bloqueado, conciliación exacta con venta web, edición/desglose, revisión obsoleta, persistencia, tres modalidades de producto, precio pendiente, compra independiente, reposición idempotente y rechazo sin descuento parcial por falta de stock. No se probaron esos fallos modificando ventas reales.

## Ejercicio real en el emulador

Pixel 6, Android 15, `emulator-5554`, Expo Go 56.0.4 / SDK 56, React Native 0.85.3. El bundle se sirve desde **el móvil principal**, no desde `qa/stability/mobile`. No se instaló ni construyó una APK nueva.

| Operación | Resultado observado |
| --- | --- |
| Alta Android | **Naturella Nocturna Súper Abundante**, categoría existente Higiene personal, paquete de 8 a $21 y pieza a $5 |
| Inicial capturado en Android | **4 paquetes, 0 sueltas, 32 equivalentes**; confirmado también por SQL |
| Venta Android de una pieza | **V-00001 por $5**; una sola venta, una salida y una apertura automática |
| Existencias después de vender | **3 paquetes, 7 sueltas, 31 equivalentes**, comprobados en PostgreSQL y web QA sin reconfiguración |
| Edición Android adicional | Una venta sintética de limpieza creada por HTTP para el ejercicio, **V-00002**, se editó en Android de $10 a $20: mismo ID/folio, original $10, versión 2, una revisión `MOVIL`, saldo de limpieza 98 |
| Regreso desde el editor | El historial mostró $20 automáticamente; la actualización de catálogo permitió editar tras una operación externa |
| Bloqueo/desbloqueo sin API | Se observaron `Dozing` y `Awake`; el borrador local de una pieza se conservó y mostró estado offline |
| Descarte offline | Confirmación visible, cero conceptos; no se envió esa venta |
| Cierre/reapertura sin borrar datos | Borrador descartado no reapareció, también con API inaccesible |
| Restablecer puente QA y bloquear/desbloquear | Reconexión automática, sin cambiar servidor ni credencial; cero conceptos |
| Verificación final | Solo **dos ventas sintéticas**, Naturella **3/7/31** y una apertura; sin ventas ni movimientos adicionales por el descarte |

La prueba de respuesta perdida, conciliación con web y carreras de duplicación fue automatizada; no se afirma una simulación manual de cada fallo. La compra y los otros modos de producto se verificaron por integración automatizada. La venta de limpieza auxiliar se creó por HTTP, no mediante captura manual Android; su edición sí se ejecutó en la interfaz.

Durante la manipulación del teclado quedó una búsqueda `Naturella8`. Se comprobó que catálogo y opciones seguían presentes; al limpiar la búsqueda reaparecieron ambas presentaciones. Se retiró el diagnóstico temporal. El emulador requirió una segunda apertura después de terminar `force-stop`; no se utilizó `pm clear` ni se borró almacenamiento.

Evidencia visual:

- [Inicial capturado: 32](../../.artifacts/integrated/screenshots/naturella-inicial-32.png) y [detalle Android guardado](../../.artifacts/integrated/screenshots/naturella-guardada-32.png).
- [Ticket Android de $5](../../.artifacts/integrated/screenshots/naturella-venta-pieza.png) e [inventario web 3/7/31](../../.artifacts/integrated/screenshots/web-naturella-3-7-31.png).
- [Edición confirmada](../../.artifacts/integrated/screenshots/edicion-v00002-confirmada.png) e [historial refrescado](../../.artifacts/integrated/screenshots/historial-refrescado-20.png).
- [Borrador offline al despertar](../../.artifacts/integrated/screenshots/borrador-tras-despertar-offline.png), [descarte](../../.artifacts/integrated/screenshots/borrador-descartado-offline.png), [reapertura offline](../../.artifacts/integrated/screenshots/reapertura-offline-sin-borrador.png) y [reconexión automática](../../.artifacts/integrated/screenshots/reconexion-automatica-sin-borrador.png).

Las lecturas SQL/HTTP de cada etapa se conservan como `initial-*`, `after-piece-*`, `after-edit-*` y `after-reopen-*` en `.artifacts/integrated/`. No se sobrescribieron las evidencias de las fases anteriores.

## Git y archivos para agregar

`.gitignore` conserva sus reglas previas y ahora excluye las copias completas locales `qa/admin`, `qa/stability/admin`, `qa/stability/mobile`, su unión `calcQuim-admin` y `qa/integrated/admin`, además de cierres y resultados temporales identificados. No se ignoraron `qa/`, `src/`, pruebas, scripts, configuraciones ni migraciones en general. Dependencias, cachés, builds, `.artifacts`, respaldos y secretos siguen fuera. Los archivos ignorados se conservaron en disco.

[Lista exacta para `git add` selectivo](git-add-selective.txt). Incluye fuentes/configuraciones móviles, pruebas, documentación, scripts QA y el parche/manifiesto Admin; también identifica las modificaciones previas necesarias que ya estaban pendientes. Revisarla con `git diff` antes de agregar: no se atribuye todo el estado previo a esta integración. **No se ejecutó `git add`, commit, push ni merge.** El manifiesto anterior de estabilidad y sus copias se conservaron.

## Abrir y revisar

Desde `D:\ReactApps\calcQuim`, con un emulador Android iniciado:

```powershell
node qa/integrated/review.mjs
```

Reutiliza API 63327, web 5197 y Metro 8097; inicia solo los componentes QA ausentes, conecta únicamente un emulador y abre Expo Go. Mantener la consola abierta si inició procesos; Ctrl+C detiene solamente sus propios hijos. No selecciona teléfonos físicos ni cambia credenciales operativas.

1. Android: **Inventario → buscar Naturella → abrir producto**. Saldo esperado: 3 paquetes × 8 + 7 sueltas = 31.
2. **Mis ventas → Ver mis ventas → V-00002**: total $20 y editor disponible. V-00001 corresponde a Naturella por $5. No volver a crear Naturella en este esquema.
3. Web: <http://127.0.0.1:5197/productos-jarceria> y <http://127.0.0.1:5197/inventarios/jarceria>. Entrar al entorno PostgreSQL de ensayo si lo solicita; Actualizar datos recarga el mismo inventario.
4. Comprobación sin cambios: `node qa/integrated/verify.mjs after-reopen`. Falla si faltan las evidencias o cambia el estado esperado; no recrea datos.
5. Repetir pruebas con esquemas nuevos: `node --test qa/integrated/stability.test.mjs qa/integrated/recovery.test.mjs qa/integrated/web-cash.test.mjs qa/integrated/acceptance.test.mjs qa/integrated/regression.test.mjs`.

Para reconstruir una copia QA ausente en esta computadora: `node qa/integrated/bootstrap-admin.mjs`. Comprueba hashes antes de aplicar el parche únicamente bajo `qa/integrated/admin`; no sobrescribe una copia existente. Requiere las dependencias locales QA preparadas y el repositorio Admin de esta computadora. Los scripts `prepare`, `refine`, `setup-tests` y `local-dependencies` documentan pasos de esta integración y no son comandos de reapertura.

## Pendientes y límites

- Teléfono físico: comparar APK instalada y fuentes, suspensión prolongada, restricciones del fabricante, cambios de Wi-Fi, segundo plano, cierre/reapertura y almacenamiento real. No se conectó ni manipuló un teléfono físico.
- Integración/activación posterior del parche en el repositorio y servidor Admin operativo, con revisión de permisos y despliegue coordinado. Está preparada y probada en QA, **no desplegada**.
- Icono y splash nativos: comprobar en una compilación de ensayo posterior; Expo Go no valida sus activos finales. No hay APK definitiva ni distribución.
- El modelo existente mantiene una composición cerrada seleccionada por producto. No se añadió seguimiento simultáneo de varias familias de paquetes cerrados. No se agregó una nueva pantalla móvil de compras ni un rediseño general de inventarios.

La documentación de estabilidad anterior permanece en [qa/stability/README.md](../stability/README.md); este informe agrega la integración y las pruebas nuevas, no sustituye sus evidencias.
