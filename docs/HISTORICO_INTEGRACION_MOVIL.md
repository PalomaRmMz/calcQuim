# CalcQuim móvil y Admin

**Actualización:** el propietario autorizó el acceso Wi-Fi a la API móvil real en `http://192.168.1.64:3016` y la compilación del APK con Expo EAS. La configuración actual y los pasos para el teléfono están en [APK y Wi-Fi](APK_Y_WIFI.md). Las referencias siguientes a acceso pendiente por Wi-Fi describen el estado anterior a esa autorización.

## Conexión real autorizada — 30 de octubre de 2026

El propietario autorizó aplicar la migración 007 y habilitar ventas reales desde el emulador. Se creó un respaldo operativo verificado, se aplicó la migración y se comprobó que los datos comerciales y de inventario permanecieron iguales: 71 productos, 3 ventas y 73 movimientos de inventario.

El servidor móvil real utiliza **`http://127.0.0.1:3016`** y se conecta a **`calcquim_operational`**, la misma base de Admin. El catálogo autenticado respondió con 71 productos, 12 categorías, 9 líneas y 10 grupos de precios. No se registró ninguna venta ficticia en esa base.

Para usarlo en la app:

1. Si estás viendo el ticket de la prueba anterior, pulsa **Nueva venta**. Si tienes un borrador sintético, consérvalo o cancélalo explícitamente antes de cambiar de servidor; no se migra a operativo.
2. En **Conexión**, escribe `http://127.0.0.1:3016`.
3. Copia el valor `credential` del [archivo privado de conexión](../.artifacts/mobile-real-connection.private.json) en el campo **Credencial móvil**. Es una credencial nueva; la del demo no sirve para la base real. No compartas ese archivo.
4. Pulsa **Guardar conexión** y después **Sincronizar catálogo**.
5. Comprueba el indicador **Base real** antes de usar **Registrar venta real**. Cada registro en este modo es una venta real de Admin y aplica sus reglas de inventario.

El servidor se dejó iniciado en segundo plano. Para iniciarlo nuevamente si la computadora o el proceso se reinician:

```powershell
cd D:\ReactApps\calcQuim
npm.cmd run real:server
```

El puerto 3003 del Admin existente permanece en servicio. El puerto 3015 corresponde al demo sintético y no debe usarse para estas pruebas reales. El proceso móvil utiliza el mismo motor y las mismas transacciones de Admin, con claves de idempotencia.

Para el emulador:

```powershell
adb -s emulator-5554 reverse tcp:3016 tcp:3016
```

Express sigue escuchando únicamente en localhost; no se abrió Wi-Fi ni se cambió el firewall. El acceso desde un celular físico por Wi-Fi continúa pendiente de autorización y configuración de red. La evidencia de la activación está en `.artifacts/mobile-operational-activation.private.json`; el respaldo se conserva en la carpeta privada de respaldos de Admin.

Las secciones siguientes describen la implementación y la validación sintética previa a esta activación.

Implementación de venta rápida sobre React Native, Expo 56, React Navigation y AsyncStorage existentes. Se consultaron los contratos y reglas reales de `D:/ReactApps/calcQuim-admin`. El catálogo comercial anterior queda fuera del flujo de venta oficial, sin borrar sus claves ni ejecutar su migración automática.

## Implementado

- Captura unificada con búsqueda por producto, línea, grupo y categoría; normalización de acentos, contexto comercial, frecuentes y recientes; paginación sin ocultar coincidencias.
- Tarifas por precio individual o grupo oficial. Una agrupación con tarifas/unidades diferentes exige selección explícita. Cada renglón conserva IDs oficiales y los productos compatibles en el momento de la captura.
- Cantidad con hasta seis decimales; importes con dos decimales, conservados como valor principal. Se reproduce `Admin.calculateItems`: litros desde 10 L reciben 15 % de descuento; por importe se utiliza el umbral monetario exacto de Admin. No se promedian precios. Tarifa cero solo admite captura por cantidad.
- Borrador persistente, edición, eliminación, cancelación con confirmación y modo recordado. Pago explícito entre las opciones existentes en Admin.
- Envío persistido antes de transmitir, clave estable, consulta antes de reintentar, bloqueo de edición con resultado desconocido, estados separados y recuperación después de reiniciar.
- Resumen automático exclusivamente después de evidencia de PostgreSQL; vista de cliente; PDF y compartir nativo con Expo Print y Sharing. El ticket contiene nombres realmente capturados, importes, cantidades, precio, descuento, folio y fecha.
- Admin: origen asignado por servidor, columna/filtro de origen, pendientes, historial y desglose desde el detalle de la venta.
- Revisiones comerciales elegidas por el propietario: mismo folio y origen, motivo obligatorio, precios históricos, historial anterior completo y ticket actualizado numerado. El ticket original nunca se reemplaza.
- Desglose compatible con la tarifa histórica y cantidades exactas. Las capturas por importe conservan el mecanismo existente de confirmación física antes de inventario.
- Reintentos y anulaciones utilizan las transacciones e idempotencia existentes de Admin. Las correcciones revierten salidas vigentes y registran las nuevas de manera atómica; agrupaciones vuelven a pendiente. Una venta con devolución parcial exige revisión específica y se bloquea su corrección automática.

## Componentes y mecanismos reutilizados

Se mantienen Expo, React Navigation, NativeWind, AsyncStorage y los recursos oficiales existentes. Se ampliaron `ActionButton` y `TotalCard`. El nuevo formulario concentra las antiguas capturas de monto/cantidad y lista; las pantallas anteriores se conservan en el repositorio como referencia. En Admin se reutilizan el motor de precios, `calculateItems`, transacciones, contador de folios, repositorios de ventas, movimientos/pendientes/asignaciones de inventario, motivos y controles de concurrencia.

Las funciones de unidades y cálculo de móvil proceden de Admin; el servidor importa directamente las originales. Al cambiar reglas en Admin, revisar la copia móvil, incrementar `pricingVersion` y ejecutar las pruebas de paridad.

## Persistencia y datos anteriores

- Estado nuevo: `calcquim_mobile_v1` (catálogo oficial, borrador, intento, uso y tickets originales).
- Credencial: `calcquim.mobile.token` en SecureStore; no forma parte del respaldo ni del ticket.
- `currentSale`, `calcquim_products` y `calcquim_products_version` solo se leen para consulta/respaldo desde Conexión y datos. No se convierten en ventas de PostgreSQL.
- Cambiar de servidor con una venta en curso se bloquea. Una sincronización de otra generación no sustituye la caché de un borrador existente.
- Un fallo de lectura no inicia escritores que sobrescriban datos corruptos.

## Contratos implementados

Todas las rutas móviles usan `Authorization: Bearer <credencial>` y responden sin información de compras ni credenciales.

| Método/ruta | Contrato |
|---|---|
| GET `/api/mobile/v1/catalog` | `{data:{categories,productLines,priceGroups,products},revision,generation,pricingVersion,generatedAt}` |
| GET `/api/mobile/v1/sales/status/:key` | `{status:"not_found"}` o `{receipt}` del resultado original confirmado |
| POST `/api/mobile/v1/sales` | Cabecera `Idempotency-Key`; cuerpo `{revision,generation,payment,items}`; resultado `{receipt,revision,generation}` |

Cada item enviado es `{reference:{kind,id},tariffKey,price,unit,entryMode,value}`. `kind`: `product`, `line`, `priceGroup`, `category`. El servidor vuelve a resolver referencia, tarifa, unidad, cantidades y total. No acepta el origen enviado por el cliente. Una revisión obsoleta devuelve 412; una clave reutilizada con otro contenido devuelve 409.

Admin utiliza sus comandos existentes más `correctMobileSale(saleId,{values,reason,physicalTreatment:"apply_difference",baselineTreatment})`. `values` conserva el orden y los modos de los renglones; una corrección no sustituye variantes ni cambia tarifas. `inventoryAllocate` sigue siendo el comando de desglose, con auditoría adicional para ventas móviles.

La migración `007_mobile_sales` permite referencias generales sin un producto ficticio y múltiples renglones del mismo producto, además de conservar pendientes anteriores de revisiones. Sus archivos están en `calcQuim-admin/server/migrations`. **No se ejecutó contra operativo.** No se modificaron migraciones históricas.

## Ejecutar pruebas aisladas

Desde `D:/ReactApps/calcQuim`, en PowerShell:

```powershell
npm.cmd test
npm.cmd run test:integration
```

La integración necesita la configuración privada ya existente de Admin para `calcquim_activation_test`. Verifica el nombre exacto antes de conectar, crea un esquema sintético único, aplica allí las migraciones y lo elimina al terminar. No utiliza `calcquim_operational`.

Para una sesión manual:

```powershell
npm.cmd run demo:server
```

El servidor de prueba escucha exclusivamente en `127.0.0.1:3015`. Su credencial pública de fixture es `synthetic-local-demo-token-not-production`; nunca usarla en operativo. Terminar con Ctrl+C o escribir `stop` elimina únicamente su esquema sintético. La aplicación debe configurarse con `http://127.0.0.1:3015`.

En otra terminal:

```powershell
adb -s emulator-5554 reverse tcp:3015 tcp:3015
adb -s emulator-5554 reverse tcp:8082 tcp:8082
$env:EXPO_OFFLINE='1'
npx.cmd expo start --localhost --port 8082
```

Abrir el proyecto en Expo Go compatible con SDK 56. Si Windows resuelve `localhost` únicamente a IPv6 y ADB no alcanza el puerto, revisar el enlace IPv4/IPv6 de Metro; no es necesario abrir Express a la red. No combinar los flags `--offline` y `--localhost`: Expo 56 los considera opciones excluyentes; se utiliza la variable `EXPO_OFFLINE`.

## Estado anterior a la autorización de conexión real

El código se aplicó también en Admin. Antes de la autorización indicada al inicio de este documento no se había modificado el esquema operativo ni su inventario. No se crearon ventas ficticias allí. No se hicieron commits ni pushes.

Las rutas móviles están deshabilitadas por defecto (`CALCQUIM_MOBILE_ENABLED` ausente). Requieren credencial de al menos 32 caracteres; el modo operativo además exige `CALCQUIM_MOBILE_OPERATIONAL_AUTHORIZED=yes`. El proceso móvil real configura esos valores exclusivamente en su propio proceso después de comprobar la evidencia de activación autorizada; no cambia el entorno del Admin que ya estaba ejecutándose.

Antes de una activación real faltan autorizaciones expresas para: respaldar y aplicar la migración 007 en operativo; habilitar registro móvil real con credenciales privadas; y, para Wi-Fi, definir interfaz/IP autorizada, TLS o transporte confiable y restricción de firewall/subred. La escucha de Express sigue fijada a `127.0.0.1` y las rutas administrativas siguen restringidas a localhost. No se modificó firewall ni configuración de red. El código no cambia por sí solo a `0.0.0.0`.

No se dispone del archivo Excel mencionado en el documento; no se incorporó ningún catálogo comercial de Excel al código.

## Verificación realizada

- Móvil y nueva integración: 21 pruebas aprobadas, con PostgreSQL real en esquema sintético; búsqueda, tarifas mixtas, precios individuales/grupo, mayoreo, centavos, borrador, datos anteriores, corrupción, respuesta perdida, reinicio, idempotencia concurrente, revisión obsoleta, origen, desglose, revisión comercial y anulación.
- Admin: 243 pruebas de aplicación aprobadas y 35 pruebas unitarias del servidor aprobadas.
- Regresión PostgreSQL de Admin: 10 pruebas de persistencia y 14 de inventario aprobadas, incluyendo respaldo/restauración, devoluciones parciales y protección contra descuentos duplicados.
- Compilaciones de Android (Hermes) y Admin (Vite) verificadas. Los resultados temporales se guardan en `.artifacts/`, excluido de Git.
- Prueba manual en Pixel 6 / Expo Go SDK 56: configurar servidor sintético, sincronizar catálogo, seleccionar una línea con dos tarifas, elegir $20/L, capturar 3 L, agregar y registrar por $60. Se abrió automáticamente el folio V-00001 sin inventar variante; se comprobó el modo cliente y la conservación del ticket después de recargar.
- PDF: se generó y apareció en el selector nativo de compartir Android. No se envió a ninguna persona ni servicio. Se corrigió la incompatibilidad de caché de Expo Go escribiendo el PDF generado en la caché de la experiencia mediante FileSystem.
- No se probó un teléfono físico por Wi-Fi ni se habilitó ninguna venta real.

Los archivos `integration/admin/` son una copia de revisión de los cambios ya aplicados en el repositorio vecino, no una segunda aplicación. Los scripts `prepare-admin`, `amend-admin`, `finalize-admin` y ajustes auxiliares documentan la preparación realizada y **no deben ejecutarse otra vez sobre un Admin que ya contiene esos cambios**.
