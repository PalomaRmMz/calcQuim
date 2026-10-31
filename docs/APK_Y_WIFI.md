# APK de pruebas y conexión Wi-Fi

El código 2 incluye el [rediseño definitivo, ticket PNG/PDF y pruebas](REDISENO_Y_TICKET.md).

La variante se llama **CalcQuim Pruebas**, utiliza `com.pamrm2089.calcQuim.pruebas` y se instala junto a la aplicación anterior. Incluye el código JavaScript y no necesita Expo Go, Metro ni un cable USB para funcionar.

## APK generado

- [Descargar APK firmado](https://expo.dev/artifacts/eas/btq6xg67-4CKNmPVj_QeD_cEAUCkvFshAza09wzUyDQ.apk).
- Copia local: `D:\ReactApps\calcQuim\dist\CalcQuim-Pruebas-WiFi-v2.apk`.
- Versión 1.0.0, código 2; Android 7 o posterior; ARM y x86, de 32 y 64 bits.
- Firma APK v2 verificada con Android SDK `apksigner`. Se comprobó que incluye el código de la app, la URL Wi-Fi y el permiso de Internet; la credencial privada no está incluida.
- SHA-256: `9ed240a75738b813c5b1b63e53cf249ce0d79a7cc27108a155e6deb2301989a2`.

## Conexión autorizada

- Dirección del servidor: **http://192.168.1.64:3016**.
- Computadora y celular deben usar la misma Wi-Fi, dentro de `192.168.1.0/24`.
- Solo se expone por red la API móvil autenticada. Las rutas administrativas de Admin no están montadas en el servicio Wi-Fi.
- El servidor se conecta a `calcquim_operational`: **Registrar venta** crea ventas reales y utiliza las reglas de inventario de Admin.
- No se modificó el firewall: las reglas existentes ya permiten Node.js. El servicio rechaza conexiones de otras subredes y no escucha en `0.0.0.0`.

## Instalar y configurar

1. Descarga el APK en el celular e instálalo. Android puede pedir permiso para instalar desde el navegador o administrador de archivos que estés utilizando.
2. Abre **CalcQuim Pruebas → Conexión**. La instalación nueva trae preseleccionada `http://192.168.1.64:3016`.
3. Introduce el valor `credential` del [archivo privado local](../.artifacts/mobile-real-connection.private.json). No compartas ese archivo. La credencial no está incluida en el APK ni se envió a Expo EAS.
4. Pulsa **Guardar conexión** y **Sincronizar catálogo**. Debe aparecer **Admin conectado** y la fecha de sincronización; las opciones aparecen al escribir en el buscador.
5. Registra únicamente ventas que realmente quieras guardar en Admin; no se generaron ventas ficticias para validar esta conexión.

Para comprobar la comunicación desde el celular antes de usar la app, abre en su navegador **http://192.168.1.64:3016/health**. Debe responder `status: ok`; ese endpoint no revela productos ni credenciales. Si no abre, comprueba la Wi-Fi, que no sea una red de invitados con aislamiento y que el servidor esté iniciado.

## Mantener Express iniciado

El proceso se dejó iniciado en segundo plano. Si reinicias la computadora o lo cierras, ejecuta desde `D:\ReactApps\calcQuim`:

```powershell
npm.cmd run real:server:lan
```

No ejecutes simultáneamente otra instancia del servidor móvil en el puerto 3016. El Admin habitual en 3003/5173 puede seguir funcionando.

Si cambia la IP Wi-Fi de la computadora, habrá que actualizar la dirección autorizada del servidor y la URL en la app. Este APK no publica la base de datos en Internet y PostgreSQL continúa escuchando solo en localhost.

## Compilación

Se autorizó enviar únicamente el código de la app a Expo EAS, usando la cuenta `pamrm2089`. `.easignore` excluye `.artifacts`, credenciales, respaldos, archivos de entorno, documentación y scripts de integración. El perfil `apk` genera un APK instalable y configura la URL Wi-Fi pública; no contiene contraseñas de PostgreSQL ni la credencial móvil.

Compilación solicitada: https://expo.dev/accounts/pamrm2089/projects/calcQuim/builds/d7dc1716-cf92-4b93-a364-decbd0b76dfa

## Verificación

La API Wi-Fi respondió con los 71 productos oficiales al presentar la credencial; rechazó la consulta sin credencial con 401 y devolvió 404 para rutas administrativas incluso con la cabecera Host falsificada como localhost. Las pruebas de subred, configuración del APK y lógica móvil aprobaron. El servidor local sigue disponible también en `127.0.0.1:3016`.

También se comprobó desde Android una solicitud directa a `192.168.1.64:3016/health`, con respuesta HTTP 200. No depende de una redirección USB. La conexión desde el teléfono físico debe comprobarse en su misma Wi-Fi al instalar el APK.

El APK firmado se instaló correctamente en el emulador y arrancó en frío como `com.pamrm2089.calcQuim.pruebas.MainActivity`, con el proceso React Native `main` activo y sin errores de arranque en los registros revisados. No se utilizó Expo Go ni se introdujo la credencial o registró una venta durante esta comprobación.
