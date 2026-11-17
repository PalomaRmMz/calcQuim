> Continuación funcional: [informe de cierre](FUNCTIONAL-REPORT.md) y [checkpoint](FUNCTIONAL-PROGRESS.md). Estado: aprobado para continuar QA; revisión 307. El contenido anterior se conserva como registro de su fase.

# Auditoría integral Nexo — informe de QA

Fecha de corte: 15 de noviembre de 2026, Ciudad de México. Ejecución `2026-11-15T00-18-48-246Z_99e55160`. Este informe reúne la ejecución inicial y su continuación; los checkpoints anteriores conservan resultados intermedios, no son el estado final.

## 1. Resumen ejecutivo

**Clasificación: Aprobado para continuar en QA**, dentro del alcance demostrado. La auditoría encontró y corrigió defectos de aislamiento, alta móvil, identificación de variantes, captura de servicios, medias cargas, reportes, hora de negocio y efectivo móvil. Las correcciones Admin están preparadas para revisión; no están desplegadas en la operación real.

Se reconstruyeron 118 productos de referencia y Naturella desde Android. Se ejecutaron siete compras y once ventas sintéticas por interfaces reales, una anulación y correcciones desde ambos dispositivos. Los 119 saldos concilian con PostgreSQL; no hay negativos ni desgloses activos pendientes. El resultado no autoriza APK física, migraciones operativas ni publicación. Las limitaciones de interfaz y cobertura se detallan abajo.

## 2. Alcance y método realmente ejecutados

| Capa | Ejecución demostrada | Límite |
|---|---|---|
| Web | Formularios, navegación, catálogo, proveedores, abastecimiento, compras, elaboración, ventas, correcciones, anulación y reportes | Chromium automatizado en contexto exclusivo; no afirmar interacción manual humana |
| Android | Expo Go en emulator-5554, alta, ventas, edición, historial, inventario, descarte offline, reapertura, suspensión y recuperación | Sin teléfono físico ni APK; servicios no expuestos por selector actual |
| API | Preparación explícita, verificaciones, fallos controlados y regresiones transaccionales | No sustituye la cobertura UI identificada |
| SQL | Identidad, permisos, movimientos, constraints, migraciones exclusivamente QA y lecturas comerciales permitidas | Sin escrituras operativas |
| Oráculo | Centavos enteros y secuencias físicas independientes | No basta la coincidencia entre dos pantallas |

## 3. Entornos y aislamiento

El QA histórico compartía rol operativo con privilegios sobre la base real: no era aislamiento suficiente. Se creó una instancia PostgreSQL18 independiente, puerto55439, base `nexo_audit_test`, rol `nexo_audit_app` sin SUPERUSER/CREATEDB/CREATEROLE, límite de conexiones y memoria acotados. Esa instancia contiene únicamente postgres, templates y QA.

Esquema principal `calcquim_test_audit_e1c7ac04e0f04a668940`; generación `01f75c27-09d0-4704-99f0-7a3c9e885aae`. API63337, web5207, Metro8107. Almacenamiento Android separado por ejecución. Regresiones crean otros esquemas `calcquim_test_auditreg_*` en la misma instancia independiente.

Los procesos operativos identificados fueron API9900, web11760 y PostgreSQL6564, puertos3003/3016/3099,5173,5432. No fueron detenidos ni reiniciados. Sus configuraciones y el repositorio Admin vecino permanecieron intactos. Referencias reales se consultaron con transacción READ ONLY y lista de campos comerciales; no se importaron tickets, contactos ni fotografías.

## 4. Catálogo reconstruido y procedencia

**A — referencias suficientes:** 71 productos de limpieza,47 de jarcería;12 categorías de limpieza,11 de jarcería,9 líneas,10 grupos de precio,49 presentaciones de referencia,8 nombres de proveedores y5 servicios. Salvo es una línea asociada a Lavatrastes, no un producto reclasificado arbitrariamente. Incluye especializados, automotrices, mascotas, fibras, esponjas, trapeadores, Tierra Rosa, bolsas e higiene disponibles en el catálogo.

**B — referencias incompletas:** se conservaron precios pendientes, sin inventarlos, para Guantes Sponya Doble Resistencia · Mediano y Guantes Sponya Ultra · Chico. No se reprodujeron compras/ventas históricas sin documentación de cada operación. La primera referencia de lavandería omitía reglas avanzadas; fue corregida con una segunda lectura completa antes de probar medias cargas.

**C — sintéticos:** todos los inventarios iniciales, compras, ventas y correcciones de esta auditoría; categoría adicional Fabuloso, Naturella y concentrado de desengrasante. Los ejercicios no son historial real del negocio.

## 5. Productos creados y captura

Los 118 productos de referencia se crearon mediante formularios web. Naturella se creó desde Android con categoría, precios, presentaciones e inicial completo; no requirió segunda configuración web. El nombre se ingresó sin acento en «Super» por la entrada de texto ADB y se conserva así en la evidencia. Bitácora `ui-catalog.json`.

Se reconstruyeron por formularios70 artículos comprados,79 ofertas,70 relaciones y41 costos informados con fechas originales. El conjunto final tiene74 artículos,84 ofertas,74 relaciones y41 costos: las diferencias son altas sintéticas derivadas de ejercicios de compras. No son registros históricos adicionales. Las 31 modalidades de terminado y ofertas alternativas se capturaron mediante los asistentes de lotes de la interfaz.

## 6. Presentaciones verificadas

Mr Big600/800: paquetes de4 y rollos individuales, productos distintos. Naturella: paquete8/$21 y pieza/$5. Inventario físico observado antes y después de apertura automática. Total final53 presentaciones, incluyendo las creadas para ejercicios.

Regresiones PostgreSQL prueban solo pieza, solo paquete, ambas, varios contenidos, presentación exclusiva de compra y bloqueo de apertura deshabilitada. Caja12 se representa como presentación de compra con factor12 y venta individual; esa combinación no tuvo compra completa por UI. Peso/volumen se cubren en catálogo y cálculos de unidades, sin afirmar recorrido UI exhaustivo para cada modalidad.

## 7. Inventarios iniciales e integridad

Limpieza inicia con100 unidades base sintéticas por producto. Mr Big600 y800 inician con4 paquetes de4=16 piezas cada uno. Naturella inicia4 paquetes de8=32. Los demás iniciales están registrados en sus movimientos y bitácora; no representan un conteo real.

Conciliación final de119 cuentas: API coincide con sumatoria SQL de movimientos. La composición conocida cumple `cerrados × factor + sueltos = total`, y coincide con inventario equivalente. No se convierten saldos desconocidos en cero. Ejemplos finales:

| Producto | Saldo físico | Composición conocida |
|---|---:|---|
| Naturella |42 piezas|5 paquetes +2 sueltas|
| Mr Big600 |23 piezas|5 paquetes +3 rollos|
| Mr Big800 |24 piezas|6 paquetes|
| Fabuloso Lavanda |94.607 L|No aplica|
| Fabuloso Limón |99 L|No aplica|
| Vinagre Blanco |120 L|No aplica|
| Hipoclorito |110 L|No aplica|
| Más Color |104 L|No aplica|
| Desengrasante Industrial |110 L|No aplica|

## 8. Compras simuladas por web

| Ejercicio | Cantidad / importe final | Resultado |
|---|---|---|
| Zorro / Mr Big600 |2 paquetes /$50|16→24 piezas; costo25/paquete,6.25/pieza|
| San Martín / Naturella |2 paquetes /$30|Reposición automática de16 piezas|
| Base Vinagre |5L /$30|Sin sumar terminado antes de elaborar; confirmados20L|
| Hipoclorito terminado |10L /$90|100→110; costo corregido80→90 sin duplicar cantidad|
| Hidroneo Más Color |1L /$12|Confirmación real4L, saldo104|
| Concentrado sintético |1L /$20|Confirmación real10L, saldo110|
| La Libertad |Mr Big800×2 paquetes +Naturella×1 /$85|Una compra pese a doble pulsación; reposición8+8 piezas|

Siete compras suman$317. Las transformaciones físicas20/4/10L son auditables y no se confunden con importes. No hay compras pendientes de elaboración/conciliación. Las escalas comerciales sin regla disponible no se inventaron; no se afirma cobertura UI completa de cada descuento de proveedor.

## 9. Ventas web simuladas

V1 Mr Big600 individual/$10; V3 lavandería1carga/$60; V6 mixto media carga completa50 +Naturella5 +Lavanda13.30 =68.30 comercial/68.50 efectivo; V7 mínimo0.13→0.50 efectivo, posteriormente anulada con tratamiento físico confirmado; V8 transferencia0.13 sin redondeo.

Se probaron edición, historial, detalle, comprobantes, insuficiencia y selección de variantes. Vacío mantiene Agregar deshabilitado; negativo y1.5piezas muestran error y no agregan ni habilitan registro. No se creó venta en las verificaciones de diseño.

## 10. Ventas Android simuladas

V2 Naturella1pieza/$5, luego revisada desde web y Android hasta3/$15; V4 paquete8/$21; V5 Fabuloso rápido2L/$20; V9 Naturella/$5 con respuesta perdida y recuperación; V10 mixto Fabuloso por importe12.75 +Naturella5; V11 Lavanda por importe17.75, efectivo18 corregido.

V10 preserva el defecto previo: efectivo17.75 sin redondeo. No se reescribió ni se cobró ficticiamente la diferencia. V11 demuestra el arreglo con subtotal17.75, ajuste0.25, total18 en formulario, servidor, ticket y reporte. V10/V11 no deben confundirse como reintento de una misma operación: son ejercicios distintos y tienen claves/folios propios.

## 11. Ventas rápidas y conciliación

V5 inicialmente conservó2L de Fabuloso sin producto asignado. Web desglosó1L Lavanda y1L Limón, conservando$20 y un solo folio. V10 por importe mantuvo1.275L orientativos sin asignación; web confirmó físicamente1.275L de Lavanda con total entregado y asignación explícitos. No se dedujo producto por semejanza del nombre. Pendientes activos finales:0.

V2 conserva ID, folio y original5 en versión3/15. Sus dos revisiones no son ventas nuevas; diferencias de inventario están registradas sin perder historia. La diferencia monetaria10 no se considera cobrada.

## 12. Lavandería

Cinco servicios reconstruidos por formulario: Lavado por carga, Solo secado, Centrifugado+secado, Sólo exprimido y Servicio a medida. Las reglas completas aprobadas de Lavado incluyen cuatro combinaciones carga/media:60/30,70/40,90/60,100/50. Otros servicios por carga tienen paso1 y no media carga.

`addons`/`loadPricing` se reprodujeron por APIQA porque el editor web no expone toda esa configuración. Esto es una limitación real del editor, no captura por interfaz. Media carga completa50 y carga simple60 se vendieron desde web. No hubo salidas de inventario por servicios. El selector Android actualmente excluye servicios: búsquedaLavado mostró ninguna opción; no se declara venta Android de lavandería aprobada. No existe en el alcance observado un flujo de órdenes con estados de recepción/lavado/entrega: solo servicios comerciales y su historial de venta.

## 13. Reportes y conciliación independiente

| Magnitud final | Valor |
|---|---:|
| Ventas registradas / vigentes |11 /10|
| Comercial vigente |$234.93|
| Limpieza / jarcería / lavandería |$63.93 /$61.00 /$110.00|
| Redondeo vigente |$0.45|
| Suma de documentos vigentes |$235.38|
| Último cobro conocido |$225.38|
| Cobro final vigente |Sin determinar|
| Cobro asociado a anulación |$0.50; no prueba devolución|

Web y API coinciden con centavos calculados independientemente. Se recorrieron24 combinaciones de los ocho análisis y tres actividades: existencias, pendientes, márgenes, salidas, tendencias, rendimiento, proveedores y cobros. Margen es estimado según costos disponibles antes de vender; no es utilidad neta ni costeo completo de lotes. No se combinan litros y piezas ni se inventan umbrales mínimos ausentes.

## 14. Reglas comerciales

Efectivo al múltiplo0.50 más cercano, empates arriba; positivo menor0.25→mínimo0.50; cero→cero. Tarjeta y transferencia sin ajuste. Oráculo de enteros para cada centavo0–2000 y tres pagos:6003 casos, comparando ahora ambos módulos móvil/web. El ajuste nunca es un producto ni cambia cantidad física.

La política nueva se activó solo en QA. Clientes móviles anteriores reciben409 cuando esa política está habilitada: deben actualizar y sincronizar antes de cobrar. Política desconocida se rechaza al validar catálogo. Los documentos previos mantienen su interpretación original; una revisión comercial no registra liquidación monetaria.

## 15. Estabilidad

Descarte offline real, reapertura sin reaparición del borrador, reconexión por botón, historial compartido, edición móvil y suspensión limpia213segundos con Dozing/Awake observados. Zona de negocioCDMX corregida y verificada aunque barra del emulador permanezcaUTC.

Se produjo un fallo nativo Expo de descarga antes de ejecutarJS; se conservaron evidencias. Se recuperó transporte ADB y únicamente Metro/puentes propios, sin borrar datos ni reinstalar. No se presenta ese intento fallido como prueba aprobada. La reapertura posterior sí cargó0conceptos. No se simularon meses de sesiones ni suspensión de horas.

## 16. Concurrencia y fallos controlados

La APIQA cortó la respuesta después deCOMMIT en la siguiente venta móvil exitosa. Android recuperóV9 automáticamente y no duplicó ni venta ni movimiento. El hook exige token/generación, se consume una vez y no pertenece al servidor operativo.

Revisiones obsoletas rechazaron sin alta parcial; alta móvil consulta ahora revisión fresca. Edición web/móvil mantiene historia. Doble pulsación de compra creó una sola operación. Regresiones transaccionales comprueban solicitudes simultáneas, insuficiencia, idempotencia, varias presentaciones y apertura controlada.

## 17. Defectos encontrados

| Hallazgo | Evidencia / estado |
|---|---|
| QA previo compartía credencial con privilegios operativos |Resuelto mediante instancia/rol independientes; no se alteró rol anterior|
| Fracciones¼/½ colisionaban porNFD |CorregidoNFKD; altaRoma¼ y regresión|
| Compras mostraban presentaciones homónimas sin producto |Etiqueta completa corregida|
| Servicios web no mostraban Agregar |Corregido y venta realV3|
| Media carga dependía deID antiguo |Paso configurado respetado yV6|
| Alta Android quedaba obsoleta tras cambiosweb |Revisión fresca y control de generación|
| Reporte confundía revisión con cobro |Conserva importe conocido y saldo final indeterminado|
| Android usaba hora localUTC |ZonaCDMX explícita en conexión/inventarios|
| Cantidad web ocupaba474px |128px y botón en misma fila; móvil375 sin overflow|
| Efectivo móvil sin política/redondeo |Contrato, persistencia, constraint y ticket corregidos;V11|
| HelperADB podía leerXML anterior si fallaba dump |XML único y validación de salida|
| Fixture de fechaUTC fallaba al cruzar medianoche |Solo copias QA adaptadas aCDMX|

## 18. Correcciones y ubicación de fuentes

Móvil principal: namespaceQA, creación de jarcería, hora, cálculo de pago/catálogo, QuickSaleScreen y comprobantes. Pruebas en `tests/` y `qa/audit/`. Admin corregido exclusivamente en copiaQA; fuentes completas seleccionadas en `integration/audit-admin-changes/`,14 archivos y hashesSHA256. Incluye migración014 aditiva, aplicada solo aQA verificando que todas las filas de ventas existentes permanecieran idénticas.

Los scripts de empaquetado son de una sola ejecución con protección de archivos y manifiestos previos preservados. No constituyen instalador ni autorización de integración. Las fuentes móviles y Admin deben revisarse conjuntamente para el contrato monetario.

## 19. Pruebas de regresión y fallos de preparación

Últimas suites aprobadas: móvil44/44; backend45/45; web339/339; adicionales técnicas7/7 previas al último ajuste monetario; móvil monetario2/2 ampliado con corrección, replay, comparación de modelo web/móvil y rechazoSQL23514 de origen manipulado y borrador anterior a la política: rechazo sin venta y reintento explícito con misma clave. Oráculo final de6003 combinaciones aprobado. Secuencia larga:60 ciclos,120ventas,181movimientos, saldo740, composición independiente en cada paso.

Las suites integradas históricas se adaptaron a instancia55439. Primera corrida26/29 por dos fixtures de fechaUTC; copias corregidas y retest12/12. Recuperación/estabilidad pasaron en primera corrida. No sumar ejecuciones repetidas como cobertura nueva.

Un comando posterior demasiado amplio (`tests/*.test.mjs`) seleccionó suites históricas no previstas:72/83, con rutas antiguas no disponibles, un manifiesto histórico de hashes y diferencia transitoria del modelo de ticket. Es un error de selección de esta auditoría. Esas suites conectan a `calcquim_activation_test` en instancia5432 y pudieron añadir fixtures sintéticos en esquemasQA históricos. No se borraron ni se intentó restaurar evidencia; no escriben la base operativa. Se dejó registro enPROGRESS y se volvió a la lista explícita de `npm test` y las suites adaptadas. Esa corrida no está aprobada.

Otros fallos conservados: build con ruta relativa incorrecta, interpretación de stderr como errorPowerShell, verificador con ruta de consulta incorrecta y nombre de campo no oficial; corregidos antes de las verificaciones aprobadas. Build final verificado mediante proceso con exit0, con advertencia de chunks grandes. No APK.

## 20. Git y archivos

Sin stage, commit, merge ni push. Admin vecino limpio. `.gitignore` conserva fuentes y excluye artefactos/credenciales; solo se retiró bloque duplicado, sin ampliar exclusiones. `git-add-selective.txt` lista archivos revisables, no contiene contraseñas ni datos privados. Manifiesto de fuentesAdmin14archivos. Los archivos privados y artefactos locales se conservan en sus rutas ignoradas.

## 21. Riesgos, límites y pendientes

- Editor de servicios no permite reconstruir visualmente toda la política `loadPricing`; se requiere completar su interfaz en un trabajo posterior si debe administrarse sinAPI.
- Android no expone servicios; no se afirma paridad funcional con venta mixta de lavandería web. Habilitar esa función exigiría selección, adicionales, cotización y descripción completas, no solo mostrar una opción.
- Combinaciones de compra por caja, compras individuales y todas las escalas de mayoreo no tuvieron un recorrido UI independiente completo; se distingue la cobertura de dominio/API existente.
- No se verificaron teléfono físico,APK, impresora, envío externo, hardware de caja ni rendimiento con tráfico productivo. Ninguno está autorizado para intervención en esta sesión.
- No hay flujo probado de liquidación de diferencias/refundos. Los reportes lo muestran indeterminado; no resolverlo inventando pagos.
- La lectura/escritura accidental de fixtures enQA histórico se documenta como desviación de aislamiento del procedimiento de pruebas, sin evidencia de escritura operativa.
- Build muestra chunks grandes: optimización pendiente, sin impacto funcional demostrado en estos ejercicios.

## 22. Evidencias visuales y resultados

Directorio `.artifacts/audit/2026-11-15T00-18-48-246Z_99e55160/`:

- `ui-catalog.json`, `supply-reconstruction-complete.json`, `quote-reconstruction.json`, `laundry-policy-reconstruction.json`.
- `android-sale-edit-v3.json`, `android-edit-confirmed-v3.png`, `android-offline-reopen-success.png`, `android-offline-discard.png`.
- `lost-response-before.json`, `lost-response-server-committed.json`, `android-lost-response-recovered.png`.
- `android-fraction-rejected.png`, `android-cash-preview18.png`, `android-cash-ticket18.png`.
- `web-sale-desktop-compact.png`, `web-sale-mobile-compact.png`, `quantity-layout.json`, `web-invalid-piece-inputs.json`.
- `reports-final-payments.png/.txt`, `reports-section-walk.json` y capturas `reports-yield-*.png`.
- `global-2026-11-15T16-01-45-133Z/summary.json`, `report.json`, `ports.txt`: revisión294,119cuentas, conciliación aprobada. Las carpetas globales anteriores sin resumen corresponden a verificadores fallidos, no aprobaciones.
- `migration014-no-document-change.json`, `web-build-verified-final.log`.

Logs adicionales en `.artifacts/audit/`: `mobile-publication-final.log`, `backend-after-mobile-payment.log`, `web-after-mobile-payment.log`, `mobile-payment-correction-regression.log`, `mobile-payment-old-draft-final.log`, `audit-cutoff-final.log`, `payment-integer-oracle-final.log`, `payment-parity-regression.log` (contiene fallo de expectativa para transferencia, corregido y retestado).

## 23. Recomendaciones

Conservar el entorno como escenario de revisión, completar las interfaces de configuración comercial antes de exigir reconstrucción100%sinAPI y mantener contrato de pago sincronizado entre cliente y servidor. Integrar selectivamente en una copiaQA revisada, jamás copiando carpetas generadas ni credenciales. Separar cualquier futura preparación deAPK de esta auditoría y repetir únicamente regresiones relacionadas con cambios posteriores.

## 24. Continuación reproducible

Leer el último bloque de [PROGRESS.md](PROGRESS.md), ejecutar `node qa/audit/resume.mjs` y consultar [README.md](README.md). `verify-global.mjs` valida este escenario de corte con importes/saldos esperados explícitos; si se añaden operaciones, actualizar primero el oráculo documentado, no relajar aserciones para hacerlo pasar. No ejecutar comodines de pruebas que arrastren QA histórico.

Las fasesA–K tienen evidencia para los recorridos descritos yL contiene este informe; las funciones ausentes y combinaciones no ejercitadas permanecen expresamente fuera de aprobación. No existe observación del porcentaje de créditos ni automatismo de renovación/reanudación.
