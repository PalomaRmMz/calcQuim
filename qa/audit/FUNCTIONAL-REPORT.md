# Nexo — cierre funcional en QA

15 de noviembre de 2026. **Aprobado para continuar QA.** Lavandería, compras y ventas mixtas ejercitadas desde web y emulador Android. No se habilitó producción ni se generó APK. Esta continuación conserva la [auditoría anterior](REPORT.md) y su escenario; no reconstruye ni sustituye sus evidencias.

Evidencias locales: `.artifacts/audit/2026-11-15T00-18-48-246Z_99e55160/functional-2026-11-15T19-59-13-430Z/` (en adelante, carpeta funcional). Los JSON privados y artefactos permanecen ignorados. Checkpoint: [FUNCTIONAL-PROGRESS.md](FUNCTIONAL-PROGRESS.md).

## 1. Correcciones implementadas

- Editor web de servicios: unidad, tarifa fija/cotizada, adicionales, combinaciones por carga, paso entero/media carga, descripción requerida y activación. Las cuatro combinaciones de lavado conservan 60/30, 70/40, 90/60 y 100/50. No se suman nuevamente los adicionales incluidos en una modalidad. Historial de configuración con valores anteriores/nuevos; guardar sin cambios no inventa un cambio tarifario.
- Android: servicios habilitados en selector, modalidades y adicionales, descripción, validación, precio cotizado, captura mixta, persistencia, edición comercial y comprobantes. Los servicios no producen movimientos físicos. El cálculo histórico usa las tarifas del documento, no las tarifas actuales.
- Comprobantes Android/web alineados; visor de original y versión actualizada conserva el recibo local original. El historial distingue total documentado, último cobro confirmado y cobro final sin determinar. La edición presenta el importe propuesto y diferencia antes de guardar.
- Compras: corrección de costo total de presentaciones con motivo, original y revisión conservados; no cambia cantidad, proveedor, fecha, equivalencias ni inventario. Se recalculan costos derivados sin simular un pago al proveedor. Presentaciones no habilitadas para compra quedan fuera del selector.
- Venta web obsoleta: tras rechazo inequívoco STALE_DATA se puede actualizar catálogo conservando conceptos y pago; se verifica la generación y se exige nueva confirmación. No se reenvía automáticamente una operación de resultado incierto.
- Interfaz: cotizados muestran «Por cotizar»; servicios no llevan el símbolo aproximado de productos por importe. Eliminados campos duplicados y selección redundante de adicionales. Campos numéricos del editor limitados a 12rem, comprobados en Chromium a 192px. Identidad Nexo / Full Clean conservada.
- Metro QA: opción pública `forceWriteFileSystem` de NativeWind evita el formato de eventos incompatible con Metro instalado. Solo se activa con EXPO_PUBLIC_CALCQUIM_QA=1; no se editaron dependencias ni ganchos internos de Metro.

## 2. Pendientes cerrados

El editor web guarda y recupera las configuraciones existentes; desactivación/reactivación comprobada por interfaz sin alterar tarifas ni ventas históricas. La referencia comercial de Servicio a medida confirmó descripción obligatoria y se reprodujo por editor. La configuración avanzada ya no depende de editar JSON para estas operaciones.

Se completaron cuatro ventas reales nuevas del escenario: V12/V13 desde Android y V14/V15 desde web. V12 se corrigió en Android y se consultó también en Admin. Compras individuales y por caja se agregaron desde web; las compras por paquete y La Libertad aprobadas en la auditoría anterior se conservaron y verificaron, sin repetirlas. Reposición automática, doble clic e historial de costo comprobados.

## 3. Pendientes y motivos

**Liquidaciones:** el modelo no aporta política aprobada de permisos, pagos parciales, redondeo de liquidaciones, reversos ni evidencia exigida. Se implementó estructura técnica de lectura y validación de eventos con idempotencia, sin endpoint ni botón para registrar dinero. Los fixtures financieros de pruebas son únicamente datos en memoria. No se afirma que el cliente pagó una diferencia ni que una anulación produjo devolución. Decisiones exactas en [SETTLEMENT-POLICY.md](SETTLEMENT-POLICY.md).

**Mayoreo:** la lectura comercial de referencia encontró cero niveles y cero precios de escalas de compra. Queda pendiente de regla comercial; no se inventaron descuentos. La caja de 12 rollos y sus costos son ejercicios sintéticos C, identificados como QA, no cotizaciones reales de Zorro. El inventario total de Mr. Big 600 es conocido; su distribución en paquetes cerrados queda sin determinar tras usar una presentación alternativa, sin inventar conversiones.

No se efectuó revisión en teléfono físico, compilación APK ni activación operativa: estaban fuera del alcance autorizado. Los flujos de corrección física de compras conservan sus requisitos explícitos; el nuevo editor cubre costo, no una supuesta devolución física o financiera.

## 4. Pruebas ejecutadas

Listas explícitas en [functional-suites.json](functional-suites.json), ejecutadas secuencialmente por [functional-checks.mjs](functional-checks.mjs). No se usaron comodines ni suites históricas sin adaptar.

| Grupo | Resultado | Evidencia en carpeta funcional |
| --- | --- | --- |
| Móvil | 44/44 | checks-2026-11-15T21-03-14-001Z/mobile.log |
| Regresiones adicionales | 14/14 | mismo directorio, additional.log |
| Backend unitario | 45/45 | mismo directorio, backend.log |
| Web unitario | 339/339 | mismo directorio, web.log |
| Integración PostgreSQL QA | 37/37 | mismo directorio, integration.log |
| Compilación móvil de cinco fuentes | Correcta | mobile-compile-with-receipt-view.log |
| Build Vite final | Código 0, advertencia de tamaño de chunks | web-build-final.log |
| Conciliación independiente API/SQL | Aprobada, revisión 307 | verified-2026-11-15T21-20-51-167Z/summary.json |

Los recuentos son los informados por Node e incluyen contenedores de subpruebas; no se suman ejecuciones repetidas. Integración cubre concurrencia/idempotencia, respuesta perdida después de COMMIT, recuperación, revisión obsoleta, caja, 60 ciclos, compras/costos, modalidades de lavandería, corrección histórica, centavos y movimientos físicos. Las suites crean sus propios esquemas sintéticos en 55439, sin resetear el escenario visible. El ajuste final exclusivamente visual de anchos se comprobó por geometría y build, sin repetir las suites aprobadas.

El oráculo previsto se guardó antes de las operaciones en planned-oracle.json y luego se contrastó mediante [verify-functional.mjs](verify-functional.mjs). Se preservan logs de intentos fallidos: un reemplazo textual interpretó secuencias de dólar y rompió temporalmente una fuente móvil; se corrigió con sustitución literal y compiló antes de operar. Los fallos transitorios de dump Android no se trataron como éxito ni se reutilizó XML anterior. Ninguna venta se confirmó durante la fuente rota.

## 5. Evidencias Android

| Recorrido real | Resultado / archivos en carpeta funcional |
| --- | --- |
| V12: lavado completo media carga + Naturella pieza + Lavanda1.33L | 50+5+13.30=68.30; efectivo68.50. android-mixed-confirmed.json, android-mixed-preview.png, android-mixed-ticket-top.png y bottom.png |
| Corregir V12 a lavado con insumos completo | 70+5+13.30=88.30; documento88.50, original68.50, diferencia20 pendiente. android-sale12-correction.json |
| Historial y recibo actualizado | android-history-confirmed-vs-due.png, android-updated-ticket-v2.png, android-edit-preview-v2.png; original intacto |
| Media carga no permitida de Solo secado | Rechazo visible y cero conceptos; android-half-forbidden.png |
| Cotizado obligatorio, persistencia tras reabrir | android-description-required.png y android-custom-draft-restored.png; descripción e importe recuperados |
| V13: secado1 + cotizado descrito + Lavanda0.013L | 30+25.25+0.13=55.38 transferencia, sin redondeo; android-quoted-transfer-confirmed.json, android-transfer-preview.png y ticket.png |
| Edición final de concepto cotizado | android-quoted-edit-final.png: conserva descripción y1.00, sin error transitorio de cambio de modo; guardado solo en borrador, no vendido |

El último borrador sintético se descartó con el puente API QA retirado; se observó cero conceptos y0.00 antes de restaurarlo. El puente Metro permaneció activo y ambos puentes QA se restauraron con finally. La reapertura de Expo Go se comprobó con cero conceptos y0.00 (android-final-empty-after-reopen.json/.png); no se borró almacenamiento ni se instaló APK.

## 6. Evidencias web

- web-laundry-roundtrip.json y web-description-rule-restored.json: editor, reglas y recuperación; web-editor-numeric-widths.json acredita todos los campos a192px. web-laundry-editor-opaque.png es la captura definitiva con transición terminada; capturas anteriores durante transición se conservan, no son defectos de transparencia.
- web-case-purchase.json: caja QA de12 Mr. Big600 por75, Zorro, compra diferente de presentación de venta; saldo23→35 automático.
- web-individual-purchase.json: San Martín, Mr. Big600 pieza6.25 y Naturella2por3.75. Doble clic produjo una compra10.00. web-purchase-cost-correction.json y web-individual-cost-history.png: corrección del primer costo a6.00, total9.75, sin cambio físico.
- web-concurrent-draft-and-sale14.json y web-stale-draft-preserved-after-refresh.png: rechazo412 observado, actualización conserva dos conceptos/Transferencia y registra una V14 por65 (lavado60+Naturella5).
- web-custom-mixed-sale15.json y web-custom-mixed-cash-preview.png: cotizado25.25+Lavanda13.30+Naturella5=43.55; efectivo43.50, ajuste−0.05.
- ui-negative-no-sales.json, web-half-forbidden.png y web-description-required.png: bloqueo de medias prohibidas y cotizado sin descripción; ninguna venta adicional.
- web-sale12-corrected-pending20.png, web-pending-monetary-difference.png y web-final-report.png/.txt: sincronización con Android y resultados finales del reporte general.

## 7. Inventario

119 cuentas conciliadas contra movimientos SQL, sin saldos negativos ni operaciones pendientes activas. Los servicios no descuentan productos; solo las líneas físicas de las ventas mixtas generan movimientos. La corrección de modalidad de V12 y la corrección de costo de compra no cambian existencias.

| Producto | Saldo final |
| --- | ---: |
| Lavanda | 91.934 L |
| Limón | 99 L |
| Desengrasante Industrial | 110 L |
| Hipoclorito | 110 L |
| Vinagre Blanco | 120 L |
| Más Color | 104 L |
| Mr. Big800 | 24 piezas |
| Mr. Big600 | 36 piezas |
| Naturella | 41 piezas (5 paquetes de8 +1 suelta) |

Mr. Big600 no informa paquetes cerrados/sueltos cuando esa composición no tiene respaldo suficiente; las36piezas sí están conciliadas. Once ventas y siete compras originales, sus presentaciones y el comprobante original de V12 conservan sus valores anteriores.

## 8. Resultados monetarios

| Concepto | Resultado |
| --- | ---: |
| Compras documentadas (9) | $401.75 |
| Ventas registradas / vigentes | 15 /14 |
| Importe comercial vigente | $487.16 |
| Redondeo documentado | $0.60 |
| Total documental vigente | $487.76 |
| Últimos cobros confirmados conocidos | $457.76 |
| Diferencias pendientes | $30.00 |
| Cobro final agregado | Sin determinar |
| Comercial limpieza / jarcería / lavandería | $90.66 /$76.00 /$320.50 |

Pendientes:10.00 de V2 conservados de la auditoría anterior y20.00 de V12. V7 anulada permanece en el historial. El total documental y el importe comercial no se presentan como dinero efectivamente cobrado. No se registró ninguna constancia financiera nueva ni se fabricaron pagos/devoluciones.

## 9. Git y conservación

Cambios móviles en el workspace principal; Admin/backend únicamente en la copia QA ignorada y el paquete selectivo versionable. Repositorio vecino `D:/ReactApps/calcQuim-admin` limpio, cero archivos staged. No hubo commits, merges, push, limpiezas destructivas ni sustitución del paquete anterior. Artefactos, credenciales y fuentes completas de QA quedan fuera de la selección.

[prepare-functional-review.mjs](prepare-functional-review.mjs) comprueba los25hashes contra fuentes, integridad de los14archivos anteriores, Admin operativo limpio, ausencia de staging e ignorado de privados. Produce [git-add-selective.txt](git-add-selective.txt), solo listado revisable: no es una instrucción para ejecutarlo sin revisión. El verificador anterior prepare-review.mjs compara fuentes de otra fase y no debe usarse contra estas fuentes posteriores.

## 10. Archivos relevantes

- Móvil: `src/components/ServiceOptions.js`, `src/screens/QuickSaleScreen.js`, `SaleEditScreen.js`, `SaleSummaryScreen.js`, `SalesScreen.js`; motores `commercial.mjs`, `sale.mjs`, `commerce.mjs`, `ticket.mjs`, `receiptView.mjs`, `saleCorrectionPreview.mjs`, `settlementLedger.mjs`; `metro.config.js`.
- [Paquete funcional Admin/backend](../../integration/functional-admin-changes/README.md), [manifiesto](../../integration/functional-admin-changes/manifest.json):25fuentes, incluidos editor, formulario concurrente, corrección de compras, proyección monetaria e historial móvil.
- [Política pendiente](SETTLEMENT-POLICY.md), [verificador independiente](verify-functional.mjs), pruebas functional-laundry.test.mjs /functional-purchases.test.mjs y tests de recibos, liquidaciones, generación y Metro.

## 11. Riesgos de integración y aislamiento

PostgreSQL independiente55439, base nexo_audit_test, rol nexo_audit_app sin privilegios, esquema calcquim_test_audit_e1c7ac04e0f04a668940 y generación01f75c27-09d0-4704-99f0-7a3c9e885aae. Verificación SQL de solo lectura; revisión final307. API63337, web5207 y Metro8107 son propios. Operativos5432(PID6564), API3003/3016/3099(PID9900) y web5173(PID11760) permanecen escuchando con los mismos procesos; no se migraron ni reiniciaron.

El paquete funcional requiere revisar primero integration/admin-changes e integration/audit-admin-changes y sus dependencias. Incluye motores completos donde QA usa reexports; no copiar los reexports hacia una instalación independiente. No hay migración nueva de negocio en esta fase. No activar endpoints reales automáticamente ni ejecutar herramientas de bootstrap sobre el escenario existente.

La adaptación de NativeWind solo se validó en QA/Expo Go; compatibilidad del proceso de distribución deberá revisarse antes de una APK. La compilación Vite advierte chunks grandes, sin impedir el build. No se habilitan liquidaciones hasta aprobar su política. Los ensayos C no son precios ni reglas comerciales reales. Por estas limitaciones el estado es continuar QA, no autorización de APK o producción.

## 12. Revisión en emulador y siguiente paso

1. Desde la raíz ejecutar `node qa/audit/resume.mjs`; después `node qa/audit/verify-functional.mjs`. Ambos son de lectura sobre el escenario y crean evidencia nueva. Deben conservar revisión307,15ventas,9compras y generación indicada. Si falla identidad, no escribir.
2. Usar únicamente emulator-5554. Confirmar puentes `adb -s emulator-5554 reverse tcp:63337 tcp:63337` y `... tcp:8107 tcp:8107`. Abrir Expo Go con `exp://127.0.0.1:8107`. No borrar datos ni cambiar namespace para probar recuperación.
3. Revisar Mis ventas → V12: documento88.50, original68.50, final sin determinar; abrir original/actualizado y regresar. V13 acredita servicio cotizado descrito y transferencia55.38. No volver a confirmar los recorridos ya registrados.
4. Abrir `http://127.0.0.1:5207`, entorno PostgreSQL de ensayo. Revisar Lavandería sin guardar cambios, historial de compras y reporte general. Confirmar cifras anteriores y salir de formularios sin crear operaciones nuevas.
5. Para revisión técnica usar prepare-functional-review.mjs y manifiestos; planificar integración futura en carpeta aislada. Próxima decisión funcional: definir política monetaria y aportar escalas comerciales verificables. Hasta entonces mantener el registro de liquidaciones deshabilitado.

No hay acceso al contador de créditos ni a eventos de renovación; no se declaran porcentajes ni reanudación automática. El checkpoint permite continuar manualmente sin repetir operaciones.
