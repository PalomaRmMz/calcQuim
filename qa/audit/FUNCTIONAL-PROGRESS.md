# Cierre funcional — continuación de auditoría

Solicitud: lavandería configurable por web y completa en Android, compras pendientes, diferencias monetarias y regresiones. Se conserva el escenario auditado; no reconstruirlo.

## Preparación

- `resume.mjs` aprobado: generación original, revisión294, instancia independiente55439,119productos,7compras y11ventas. Resultado `.artifacts/audit/functional-preflight.log`.
- Servicios operativos siguen en PID9900/11760/6564 y puertos originales; QA63337/5207/8107/55439 disponibles. Git previo conservado; ningún stage/commit/push.
- Leída documentación Expo56 exacta y referencias PROGRESS/REPORT/README/integrated. Copias anteriores de ocho fuentes guardadas en `.artifacts/audit/2026-11-15T00-18-48-246Z_99e55160/functional-2026-11-15T19-59-13-430Z/before/`.
- Próximo paso: editor de reglas de cargas sin borrar configuraciones existentes; captura Android con modalidades/adicionales/descripción y persistencia; edición usando snapshots históricos. Después pruebas por interfaces y compras con oráculo independiente.
- Sin contador de créditos observable. Checkpoints por bloque; no depender de renovación automática.

## Implementación de lavandería

- Editor web con modalidades, paso1/0.5, tarifas completas/medias, adicionales y descripción requerida; validación sin convertir vacío en cero. No se eliminan modalidades existentes. Historial de configuración incluye activación y unidades.
- Android incorpora servicios al selector, modalidad/adicionales, cotización, descripción personalizada, captura persistida y petición completa. Edición usa el snapshot histórico y permite modalidad aprobada; solo conceptos físicos requieren confirmación física. Comprobantes incluyen modalidad y descripción.
- Regresión funcional2/2 en instancia55439: ocho tarifas aprobadas, media prohibida, descripción requerida, venta mixta, idempotencia, corrección con saldo pendiente y servicios sin inventario. Un fallo inicial fue selección de fixture de línea inexistente en opciones primarias; corregido usando catálogo oficial completo. Sintaxis de3archivos móviles compilada con Babel/Expo.
- Evidencia anterior a nuevas operaciones en functional-2026-11-15T19-59-13-430Z/before-ui.json; revisión294. Próximo paso: reiniciar únicamente APIQA63337 para cargar fuentes, editar y recuperar reglas desde web, ejercicios reales en emulador, después compras.

## Compras y diferencias monetarias — bloque intermedio

- Editor de Lavado guardó/desactivó/recuperó/reactivó por web: cuatro pares60/30,70/40,90/60,100/50 y adicionales exactos; dos eventos de configuración, ninguna venta anterior alterada. web-laundry-roundtrip.json y captura del editor.
- Caja sintética de12rollos MrBig600, exclusiva de compra, costo75 derivado de3paquetesQA×25: saldo23→35 automático. No se inventa composición cerrada: al recibir otro contenido, modelo marca composición desconocida y conserva total35; no afirmar trespaquetesfabricados. Evidencia web-case-purchase.json.
- Compra individual web SanMartín:1MrBig600/6.25 +2Naturella/3.75, costos deQA clasificadosC; total10 y doblepulsación creó una sola compra. Saldos36y44;9compras acumuladas. web-individual-purchase.json. Paquetes ya ejercitados en fase anterior, no se repitieron sin necesidad.
- Detectada ausencia de edición de compras de jarcería. Implementada corrección de importes con motivo, revisión original, identidad/cantidades/proveedor conservados, idempotencia y sin movimientos físicos nuevos. RegresiónPostgreSQL1/1, costo actualizado en seguimiento y ledger sin cambios. Falta recorridoUI tras cargarAPIQA. No se habilita cambio silencioso de cantidades físicas.
- No hay política aprobada de liquidaciones (permisos, pagos parciales, método/fecha y devoluciones de anulaciones). Se implementó proyección técnica sololectura con constancias confirmadas, validación/idempotencia y separación de importes; cuatro regresiones aprobadas. Panel web distingue original, adicionales/devoluciones registrados y diferencias pendientes. Sin endpoint de escritura ni pagos ficticios.
- MetroQA cayó con errorNativeWind/Metro addedFiles; se conservó log, reiniciado solo Metro propio, sesión62553, hijo31560 y puerto8107. TransporteADB recuperado sin reinicio global, ExpoGo reabierto sinborrardatos niAPK. Android ya muestra servicios, selector de combinación y media carga completa50 en borrador. AñadiendoNaturella; aún NO afirmar venta confirmada.
- Próximo paso: cargar corrección de compras reiniciando únicamente APIQA63337; ejercicioUI de importes, sincronizarAndroid antes de confirmar venta mixta. Luego negativos de media carga, transferencias, edición/historial/ticket y regresiones explícitas.

## Corrección de compra verificada por interfaz

- Nueva corrección segura de importes habilitada en Compras para jarcería. Compra individual conservóID, dosrenglones, cantidades/proveedor y recepción; total10→9.75 por corrección sintética de transcripción6.25→6.00. Una revisión original10 y motivo auditado, doblepulsación no duplicó. Movimientos y saldos36/44 inalterados. Evidencias web-purchase-cost-correction.json y web-individual-cost-history.png.
- Registro de liquidaciones permanece deshabilitado: política pendiente en settlement-policy-pending.json. No se inventaron constancias de cobros ni reembolsos.
- Android ya muestra y conserva en borrador media carga completa50 +Naturella5. AgregandoLavanda1.33L/13.30 y sincronizando antes de confirmar68.50efectivo. Evitar escrituras simultáneas hasta completar este envío.

## Venta Android mixta confirmada y primeras regresiones finales

- V12 móvil confirmada: media carga completa50 +Naturella1pieza5 +Lavanda1.33L13.30 =68.30comercial/68.50efectivo. Modalidad y adicionales persistidos; ticket superior/inferior inspeccionado por XML y visible. Web abrió el mismo folio. Dosmovimientosnuevos exclusivamente31/119; Lavanda93.277,Naturella43; ningúnmovimiento por servicio. Evidencias android-mixed-confirmed.json, android-mixed-preview.png, android-mixed-ticket-top/bottom.png y web-android-mixed-sale12.png.
- Suites ejecutadas mediante listas explícitas versionadas en functional-suites.json y functional-checks.mjs: móvil44/44, adicionales10/10, backend45/45, web339/339 en checks-2026-11-15T20-19-26-072Z/; integración37/37 en checks-2026-11-15T20-20-21-706Z/. Incluyenconcurrencia,recuperación,37escenarios con8archivos y secuencia60ciclos. No se ejecutaron suites históricas.
- Panel de diferencia V2 verificado porweb, pendiente10sinpagoficticio; captura web-pending-monetary-difference.png. Próximo paso: editar modalidad/cantidad V12desdeAndroid y comprobaroriginal/saldos, negativosdemediacarga ytransferencia, más ejerciciosweb demezclas; luego oráculo acumulado, empaquetado e informe funcional.

## Revisión Android y corrección del historial monetario

- V12 editada realmente desdeAndroid: media completa50→carga coninsumos70. MismoID/folio, versión2, original68.50, nuevo88.50 y diferencia20 not_recorded. Existencias93.277/43sin cambio neto. android-sale12-correction.json.
- Se detectó etiquetaAndroid Cobrado aplicada al totaldocumentado revisado. Corregido contratoSQL/API delhistorial con proyección confirmada/sinliquidar sin copiar renglones ni datos sensibles; interfaz muestra Totaldocumentado y Últimocobroconfirmado. APIverificada6850confirmado/collectednull paraV12, evidencia android-history-monetary-contract.json; regresiónfuncional2/2 con el contrato. Aviso explícito de listaobsoleta.
- Cotizaciónprevia deedición añadida usando snapshots y cálculo histórico, sin registrar pago. Comprobantes nuevos de jarcería incluyen nombrecomercial ademásdepresentación; documentosanteriores inalterados.
- NativeWind4 emite eventsQueue mientrasMetroSDK56 requiere changes.addedFiles. QAahora usa opciónsoportada forceWriteFileSystem, sin editar node_modules ni cambiar configuraciónoperativa. Regresiónmiddleware1/1 demuestra que no toca hooksprivados. Requiere observar bundle y emulador despuésdelreinicio propio.
- Corrección de preparación: reemplazoJavaScript interpretó secuenciasdólar comosustituciones y rompió temporalmente SaleEdit. Fuente fallida conservada; sustituido con funciónliteral, retiradaduplicación y compilados4archivos conBabel/Expo. No se envió ningunaoperación duranteeseestado. HelperADB ahora rechaza metacaracteres yboundsinvertidos; unaentrada con puntoycoma produjo comandoinexistente, se verificómotivo guardadocorrectamente antesdeconfirmar.
- APIQA sesión35550; MetroQA sesión4689,hijo31116; mismabase/generación ypuertos63337/8107. Próximo paso: reabrirExpoGoQA, verificarhistorial88.50/documento68.50confirmado, despuésV13/V14/V15deloráculo previsto.

## Negativos y reglas comerciales

- Android SoloSecado0.5 rechazóvisiblemente «Este servicio admite únicamente cargas completas», mantuvo0conceptos/$0 y ninguna venta. Evidencia android-half-forbidden.png. Se corrigió a1carga30 y se prepara servicio cotizado25.25 +Lavanda0.013L/0.13 para transferenciaV13.
- Referencia de escalas de compra consultada exclusivamente porSELECTREADONLY de metadatos comerciales, sincompras ni texto personal de evidencia:0niveles y0precios. purchase-tier-reference.private.json. No se inventan umbrales/descuentos; queda pendiente de regla comercial verificable. Costos de ejercicios se identifican comosintéticosC derivados de comprasQA.
- Formulario web preparado paraV14: LavadoSolo1carga60+Naturella1pieza5, transferencia65; todavía NO registrado para mantener secuencia deloráculo. Evitar confirmar hastaV13.

## Borrador cotizado y referencia de descripción

- La referencia inicial omitió descriptionRequired. Nueva lectura comercial READONLY confirmótrue para Servicioamedida; se reprodujo por editorweb, sin alterar precios. Evidencias laundry-description-reference.private.json y web-description-rule-restored.json.
- Android rechazó descripción vacía al editar el cotizado (android-description-required.png); se ingresó «Trabajo QA cotizado por servicio» con25.25 y se cerró/reabrióExpoGo sinborrar datos. Un primerintento quedóenlauncher; se reabriódeepLink y se observó efectivamente edición, importe25.25 ydescripciónconservados. android-custom-draft-restored.png. Aún no constituye ventaV13confirmada.
- ActualmenteAndroid tiene borradorSoloSecado1/30+Servicioamedida25.25con descripción; se está seleccionandoLavanda para0.013L/0.13. Después elegirTransferencia y confirmar55.38; verificar folioV13 antesde enviarwebV14. Formulario webV14 sigue abierto con65transferencia; puede estarobsoleto por cambios concurrentes, tratar412sin duplicar.
- Pendientes técnicos seguros antesdelcierre: quitar doble llamada de modo al editar concepto (mensajeEspera transitorio), mostrar cotizado como Porcotizar en lugar de0.00, permitirvisualizar ticketactualizado enAndroid sin sustituir originallocal. Cambios raíz deben compilarse y retestearse; no hacerlos durante un envío incierto.
- Para continuar conservaroráculo planned-oracle.json: finalprevistoV12revisada88.50,V13transfer55.38,V14web65,V15web43.50; compras401.75, comercial487.16,documentos487.76,conocido457.76,pendiente30,stockLavanda91.934,Naturella41,Mr60036. Esearchivo es PLAN, no aprobación hastaejecutarúltimosrecorridos.

## Operaciones finales conciliadas

- V13 Android confirmada por transferencia55.38: SoloSecado1carga30 +Servicioamedida25.25con descripción +Lavanda0.013L/0.13. Sin redondeo; Lavanda93.264 yNaturella43. Evidencia android-quoted-transfer-confirmed.json y android-transfer-ticket.png.
- V14 web: LavadoSolo1carga60+Naturella5, transferencia65. Se reprodujo412por unguardadosin cambios enotra sesión, luego nuevaacción «Actualizar catálogo sin borrar venta» conservó2conceptos/pago y registróuna sola venta. Protegida generaciónoriginal; refresco solo ofrecido tras rechazoSTALE_DATA, no trasresultadoincierto. ContratoApiClient conserva código/status. Evidencia web-concurrent-draft-and-sale14.json y captura despuésderefrescar.
- V15 web: cotizado25.25+Lavanda1.33L13.30+Naturella5, comercial43.55/efectivo43.50 (-0.05). Descripciónobligatoria única; eliminados campoopcionalduplicado ychecksadicionalesredundantes cuandohaymodalidades. web-custom-mixed-sale15.json. Negativosweb bloqueanmediasprohibidas ydescripciónvacía sin crearventas (capturas y ui-negative-no-sales.json).
- Verificadorindependiente aprobado en verified-2026-11-15T21-02-29-678Z/: revisión307,119cuentas,15ventas/14vigentes,9compras401.75; comercial487.16,redondeo0.60,documentos487.76,conocido457.76,finalindeterminado. Actividades90.66/76/320.50. SaldosLavanda91.934,Naturella41,Mr60036. Onceventasoriginales,sietecomprasoriginales,presentacionesoriginales ycomprobanteoriginalV12 inalterados. Sinpendientesactivos ni negativos.
- ÚltimoscambiosUI: cotizados se identifican Porcotizar, serviciossin símbolo aproximado, editconcepto no llama dosvecesalcambiomodo; visor de comprobantes actualizados enAndroid conserva originalLocal. Sintaxis5archivos compilada; testsreceipt-view2/2 y generación1/1. Falta observarlos en recorridoAndroid actual.
- API sesión35550,Metro4689 estables; no reiniciosoperativos. Próximo paso: observar resultado de consultaAndroidV12, verificar cobroconfirmado68.50/frente documento88.50, visoractualizado ypreview; después borradorsintético pequeño/edición/descarteoffline con puente restaurado, regresionesfinales,listadoGit ypaqueteAdmin nuevo sin sobrescribirelpaqueteanterior.


## Cierre visual y compilación

- Aislamiento revalidado por resume.mjs a las 21:14 UTC: instancia independiente 55439, rol sin privilegios, generación conservada y revisión 307. No hay nuevas ventas ni compras.
- Observados en Android ticket actualizado V12 versión 2 y previsualización: documento 88.50, original 68.50, diferencia pendiente 20.00. Capturas android-updated-ticket-v2.png y android-edit-preview-v2.png.
- Revisión visual web detectó tarifa base demasiado ancha; todos los campos numéricos del editor se limitaron a 12rem (192px verificados). Build Vite final terminó con código 0; conserva advertencia de tamaño de chunks.
- Siguiente paso: editar y descartar un borrador cotizado local de 1.00, sin confirmarlo; después empaquetar fuentes Admin selectivas y emitir informe. Puentes 63337 y 8107 activos.

- Preparado paquete funcional independiente de 25 fuentes con SHA256; los 14 archivos del paquete anterior siguen intactos. Revisión Git sin archivos staged, sin credenciales incluidas y Admin operativo limpio. Verificador final 21:16 UTC conserva revisión 307 y todos los saldos. Próximo paso: descarte offline del borrador local; si una sesión se interrumpe, restaurar siempre `adb -s emulator-5554 reverse tcp:63337 tcp:63337`.


## Checkpoint final — cierre funcional aprobado para continuar QA

- Informe completo: [FUNCTIONAL-REPORT.md](FUNCTIONAL-REPORT.md). Pendientes de negocio: [SETTLEMENT-POLICY.md](SETTLEMENT-POLICY.md) y escalas de mayoreo sin datos verificables. No hay registros financieros nuevos ni precios reales inferidos.
- Editor web completo, modalidades y cotizados Android, comprobantes original/actualizado, corrección de costo de compras, refresco web preservando borrador y proyección monetaria implementados. Paquete Admin nuevo: integration/functional-admin-changes, 25 fuentes con manifiesto SHA256. Paquete anterior de 14 fuentes intacto.
- Suites finales explícitas aprobadas: móvil 44/44, adicionales 14/14, backend 45/45, web 339/339 e integración 37/37 (incluidos contenedores informados por Node, sin sumar repeticiones). Evidencia checks-2026-11-15T21-03-14-001Z/results.json dentro de la carpeta funcional. Ajuste visual posterior de anchos verificado por geometría de 192px y build final código 0.
- Android V12 versión 2 observado: total 88.50, original 68.50, diferencia pendiente 20.00. Edición de concepto cotizado conservó descripción e importe sin error de cambio de modo. El borrador local de 1.00 se descartó con API QA sin puente, sin enviar una venta. Puente restaurado con finally; Expo Go reabierto explícitamente y observado con 0 conceptos y 0.00, descripción e importe descartados. El primer arranque quedó en transición y requirió abrir de nuevo el deep link; no se declara aquel primer intento como éxito. Evidencia android-final-empty-after-reopen.json/.png.
- Conciliación independiente 21:16 UTC: revisión 307, 119 cuentas, 15 ventas /14 vigentes y 9 compras por401.75. Comercial487.16, redondeo0.60, total documental487.76, último cobro conocido457.76; cobro final sin determinar. Diferencias30.00 (V2=10 y V12=20). Once ventas y siete compras originales y recibo originalV12 conservados. Sin inventarios negativos ni pendientes activos.
- Servicios QA observados: PG55439 PID24340, API63337 PID21664, web5207 PID24544, proxyMetro8107 PID16740. Sesiones de trabajo anteriores API35550 y Metro4689, verificar puertos en lugar de asumir vigencia de IDs. Operativos PG5432 PID6564, API3003/3016/3099 PID9900 y web5173 PID11760 conservados. Puentes QA63337 y8107 activos, puentes anteriores conservados. Web QA sin diálogo abierto; Android en Venta rápida vacío.
- Git: correcciones anteriores preservadas, Admin vecino limpio, sin staged, commits, merges, push, despliegue, APK, teléfono físico ni eliminaciones. Listado selectivo actualizado por prepare-functional-review.mjs; privados/artefactos/copia QA ignorados.
- Siguiente paso exacto de revisión: ejecutar node qa/audit/resume.mjs y node qa/audit/verify-functional.mjs (solo lectura), revisar informe y manifiestos sin repetir operaciones. Para nuevas funciones monetarias se requiere primero aportar política comercial; mantener su registro deshabilitado. No hay tareas financieras pendientes de resultado incierto ni puente que restaurar.
- No hay acceso al contador de créditos; no se estima porcentaje ni se observan renovaciones. Este checkpoint no presupone reanudación automática.

- Verificación posterior al último recorrido, 21:20 UTC: verified-2026-11-15T21-20-51-167Z/summary.json aprobada, revisión307 sin operaciones nuevas. Revisión Git final review-2026-11-15T21-20-50-061Z/summary.json:25 fuentes funcionales y14 anteriores válidas,130 archivos en lista selectiva,0 staged, Admin operativo limpio. closure.json y final-ports.txt archivados.
