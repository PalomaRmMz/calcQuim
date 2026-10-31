# CalcQuim móvil: rediseño y verificación final

30 de octubre de 2026. Rama `dev`, sin commits ni pushes. Se conservaron React Native, Expo 56, React Navigation, AsyncStorage y la integración con Express/PostgreSQL.

## Abrir en Android por Wi-Fi

1. [Descarga el APK actualizado y firmado](https://expo.dev/artifacts/eas/btq6xg67-4CKNmPVj_QeD_cEAUCkvFshAza09wzUyDQ.apk). Copia local: `dist/CalcQuim-Pruebas-WiFi-v2.apk`.
2. Instala **CalcQuim Pruebas**, versión 1.0.0, código 2. La actualización conserva los datos de la variante de pruebas anterior. Firma APK v2 verificada; instalado y abierto en el emulador sin errores nativos.
3. Computadora y teléfono deben estar en la Wi-Fi autorizada. La dirección preseleccionada es `http://192.168.1.64:3016`.
4. En el engrane de conexión, introduce el valor `credential` del archivo privado local `.artifacts/mobile-real-connection.private.json`. Guárdalo únicamente en el campo de credencial.
5. Guarda la conexión y sincroniza. El catálogo real comprobado contiene 71 productos y 30 opciones rápidas.
6. Busca, selecciona, captura cantidad o importe y agrega. Al terminar, **Registrar venta** guarda una venta real en Admin y abre su ticket.

El APK incorpora JavaScript y funciona con Express local iniciado. No necesita Metro para utilizarse. El proceso móvil quedó funcionando en segundo plano. Para iniciarlo tras reiniciar la computadora:

```powershell
cd D:\ReactApps\calcQuim
npm.cmd run real:server:lan
```

Solo se expone la API móvil autenticada en esa IP, puerto y subred. PostgreSQL sigue local y las rutas administrativas no están disponibles por Wi-Fi. La compilación se realizó en Expo EAS con la autorización anterior y sin credenciales ni respaldos.

## Pantallas y captura

El inicio muestra encabezado compacto, conexión, buscador, venta y total fijo. Con búsqueda vacía se ocultan resultados, frecuentes, recientes y variantes. La búsqueda admite fragmentos, acentos, categoría, línea, grupo y producto; presenta primero la opción comercial y ofrece variantes mediante una acción secundaria.

Las agrupaciones se derivan de relaciones oficiales de Admin, conservan IDs elegibles y requieren tarifa inequívoca. Fabuloso y Pinol permanecen separados aunque compartan precio. No se agrupa por semejanza del nombre ni se mantiene un catálogo manual en el móvil. Las opciones se entregan en `commercialOptions`, versión `official-relations-v1`; las cachés anteriores utilizan el mismo derivador sobre los datos oficiales.

Cantidad e importe comienzan vacíos. Agregar limpia el formulario, conserva el modo y devuelve el foco al buscador sin perder los conceptos anteriores. Total, importe pendiente y Agregar permanecen accesibles sobre el teclado Android. Registrar venta es una acción distinta, habilitada después de agregar o cerrar la selección actual.

El motor es el de Admin, con pruebas de paridad de tarifas, unidades, mayoreo y redondeos. Tres litros a $19 producen $57. Capturar $20 a esa tarifa mantiene exactamente $20; los litros equivalentes no se utilizan para recalcular el importe desde su representación redondeada.

## Confirmación y recuperación

El intento se guarda antes de transmitir con clave estable. Los reintentos consultan su resultado y una respuesta desconocida impide reescribir la venta. Express confirma mediante transacción PostgreSQL y devuelve folio, fecha y ticket; la app no anuncia una venta registrada sin esa evidencia.

La caché oficial se actualiza al volver a la app y al recuperar red. Si Admin falla, se conserva el borrador y se reintenta la sincronización con la app activa. La Wi-Fi local puede funcionar sin Internet. Un cambio incompatible de generación conserva el borrador para revisión.

El estado operativo conserva `calcquim_mobile_v1` y la credencial de SecureStore. Las claves anteriores de AsyncStorage no se migraron ni se borraron. La instrumentación QA requiere desarrollo, activación expresa, API sintética 3017 y almacenamiento separado; no se activa en el APK.

## Ticket profesional

Vista, PNG y PDF utilizan el mismo modelo comercial y el logo original, copiado sin alterar sus bytes. Incluyen los datos exactos solicitados:

- Full Clean Home & Laundry; Limpieza sin complicaciones.
- Calle Niños Héroes No. 10, San Mateo Ayecac, Tepetitla de Lardizábal, Tlaxcala.
- Teléfono y WhatsApp: 2411561100.
- Folio y hora oficiales, conceptos capturados, cantidad/unidad, tarifa histórica, importes y total.
- «¡Gracias por tu compra!» y aclaración de que no es factura fiscal.

No incluyen IDs, credenciales, estados de desglose o detalles del servidor, ni clientes, datos fiscales o pagos inventados. Los descuentos solo aparecen si constan en el comprobante.

PNG captura el papel completo, incluso fuera de pantalla. PDF incorpora el logo localmente, conserva filas completas y repite encabezados de tabla entre páginas. Ambos escriben archivos reales en la caché propia y abren el menú nativo de Android, sin envíos automáticos.

**Nueva venta** vacía únicamente el borrador confirmado después de guardarlo correctamente. Conserva tickets, catálogo, sesión y servidores. El móvil mantiene el comprobante original; las correcciones de Admin permiten obtener un actualizado con versión identificable, sin sobrescribir el original.

## Admin e inventario

Admin muestra Móvil/Web, folio, fecha y hora, importe, estado de desglose y última modificación, con filtros por origen y pendientes. No se inventan horas para registros históricos incompletos.

El desglose actualiza la misma venta y conserva su importe y origen. Solo descuenta productos concretos incluidos entre los IDs elegibles históricos. Los renglones por importe requieren confirmar la cantidad física. Las correcciones requieren motivo y tratamiento físico explícitos, generan revisiones y revierten/reaplican movimientos de manera transaccional.

Si hay una estimación posterior a la venta, el formulario permite confirmar por producto si la operación ya estaba incluida o debe aplicarse ahora. No se selecciona un tratamiento automáticamente.

## Verificaciones realizadas

**32 pruebas automatizadas aprobadas**, incluyendo PostgreSQL aislado:

```powershell
npm.cmd test
npm.cmd run test:integration
```

Cubren agrupaciones, búsqueda ambigua, tarifas individuales/mixtas, cantidad/importe, precisión, paridad comercial, persistencia, respuesta perdida tras COMMIT, idempotencia, origen, desglose, corrección, anulación, inventario, ticket escapado, logo intacto, paridad de tickets Admin/móvil, auditoría y restricciones LAN. La exportación Android y la compilación de Admin también pasaron.

En emulador Pixel 6, Android API 35, Expo Go 56.0.4:

| Prueba | Evidencia |
|---|---|
| Inicio y búsqueda | Resultados ocultos al inicio; Fabuloso general y variantes secundarias |
| Captura | Campo vacío, 3 L × $10 = $30 y $20 a tarifa $19; ticket final $50 |
| Edición | 3 → 4 → 3 L mantuvo dos conceptos, sin duplicaciones |
| Confirmación | Ticket automático con folio y fecha del servidor |
| PNG y PDF | Archivos generados en Android y menús nativos abiertos, sin enviar |
| Nueva venta | Borrador vacío, catálogo y ticket anterior conservados |
| Desconexión/reinicio | Dos conceptos por $55 recuperados sin API, con catálogo en caché |
| Reconexión | Tarifa sintética cambió $19 → $21; el ticket anterior conservó $19 y total $50 |
| Muchos artículos | 32 conceptos, $130; PNG 1080 × 7491 y PDF de tres páginas completos |
| Android → Admin | Venta Móvil de $50 desglosada 2+1 y corregida a $60, mismo folio, versión 2, original intacto |
| Inventario | Reversión y nuevo desglose 3+1 dejaron 97/99 sobre bases 100; el producto específico descontó una sola unidad |

Todas las escrituras de prueba se realizaron en `calcquim_activation_test`, en un esquema temporal exclusivo. La API operativa se comprobó mediante lecturas autenticadas y rechazo de credenciales inválidas/rutas administrativas por LAN. El teléfono físico queda para la prueba del propietario con su Wi-Fi y este APK.

## Muestras y capturas

Son muestras sintéticas, no ventas operativas:

- [Ticket PNG de $50](../output/tickets/FullClean-MUESTRA.png).
- [Ticket PDF de $50](../output/pdf/FullClean-MUESTRA.pdf).
- [PNG de 32 conceptos](../output/tickets/FullClean-MUESTRA-32-conceptos.png).
- [PDF de 32 conceptos](../output/pdf/FullClean-MUESTRA-32-conceptos.pdf).
- [Galería del emulador](../output/README.md).

Se revisaron visualmente el ticket PNG completo y todas las páginas de los PDF. Del PDF largo se extrajeron sus 32 conceptos y total $130.

## Recursos y autorizaciones

Se leyeron el Excel de 71 productos y el Manual Maestro facilitados; no se convirtió el Excel en catálogo fijo. Se usaron `logo.png` y `Manual_Maestro_Full_Clean_Botas_logo_direccion.docx`, disponibles en las rutas proporcionadas. Los nombres alternativos con `(4)`/`(6)` no estaban disponibles con esa denominación. Se aplicó el domicilio completo solicitado, que prevalece sobre el abreviado del manual. No se generó ni reinterpretó el logo ni se utilizó una mascota nueva.

Las autorizaciones anteriores cubren migración 007, ventas reales, la IP/subred actuales y compilación EAS. No falta autorización adicional para esa configuración. Este rediseño no aplicó nuevas migraciones ni cambió el firewall, productos, precios, inventario, ventas o respaldos operativos. No se hicieron commits ni pushes.

`.gitignore` y `.easignore` excluyen credenciales y evidencia privada; EAS también excluye muestras e integración. Se verificó que la credencial operativa no aparece en el código de la app.

Referencias consultadas: [Expo 56](https://docs.expo.dev/versions/v56.0.0/), [view-shot 5.1.0](https://docs.expo.dev/versions/v56.0.0/sdk/captureRef/) y [NetInfo 12.0.1](https://docs.expo.dev/versions/v56.0.0/sdk/netinfo/). La documentación previa se conserva en [Histórico](HISTORICO_INTEGRACION_MOVIL.md).
