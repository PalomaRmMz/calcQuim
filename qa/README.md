# Nexo: informe de revisión QA

14 de noviembre de 2026. **Implementado en QA y listo para revisión; sin activación operativa ni APK definitiva.**

## A. Diagnóstico

El formulario móvil exigía unidad base y presentaciones técnicas incluso para artículos sencillos. Su inicial aceptaba solo una cantidad equivalente. El endpoint rechazaba la composición física, aunque el backend ya tenía apertura automática, cuentas de paquetes, auditoría y transacciones.

Además, Android no solicitaba la capacidad comercial ni generaba renglones de venta por presentación. Modificar solo el formulario habría dejado el producto sin poder venderse desde el celular.

El backend y la web completos están en el repositorio vecino `D:/ReactApps/calcQuim-admin`. Sus fuentes se copiaron a `qa/admin`, dentro del espacio autorizado. No se aplicaron cambios a ese repositorio ni a su servidor operativo. Se respetaron las modificaciones previas de `MainSections.js` y `SalesScreen.js`.

## B. Implementación

- **Android:** `HardwareCreateScreen.js`, `ItemSelect.js`, `BrandUI.js`. Tres modalidades rápidas, precios claros, inicial físico, total automático y controles accesibles. Selector modal con contraste, desplazamiento, cierre con Atrás y teclado descartado al abrirlo. «Más opciones» conserva unidades y factores adicionales, compra/venta independientes y selección explícita del paquete contado.
- **Motor compartido:** `src/domain/hardwareCreation.mjs`, `commerce.mjs`, `laundryPricing.mjs`. La web y el backend QA importan los mismos motores. Las presentaciones sin precio positivo no aparecen para venta. Precio pendiente conserva las definiciones y bloquea la venta del producto.
- **Venta móvil:** catálogo con capacidad comercial, renglones por presentación, protocolo de envío y conservación de cálculos comerciales al recalcular ventas de limpieza. El alta confirmada sincroniza el catálogo. Sesión e intentos QA usan almacenamiento separado.
- **Backend QA:** `mobile/hardware-creation.mjs`, `mobile/router.mjs`, `mobile/commercial.mjs`, `services/productInitialInventory.mjs`, `services/commerce.mjs`, `repositories/inventory.mjs`, `repositories/packInventory.mjs`. Se resuelve el índice de presentación al ID recién creado dentro de la transacción. Un fallo revierte producto, precios e inicial. Se reutilizan revisión, bloqueo e idempotencia existentes.
- **Stock:** los productos nuevos rechazan ventas con saldo insuficiente o desconocido. La modalidad dual habilita apertura automática. La modalidad solo paquete no expone venta individual. Se preservan las reglas históricas y las composiciones desconocidas.
- **Web QA:** `QuickHardwareCreate.jsx`, `HardwareProductsPage.jsx`, `InitialInventoryFields.jsx`, identidad visible Nexo · Administración. Se conserva el editor avanzado.
- **Entorno:** Metro excluye las fuentes y cachés QA. El engrane flotante «Tools» pertenece a Expo Go. El logotipo oficial permanece intacto; no se rediseñaron iconos ni splash.

El modelo existente conserva una presentación física cerrada seleccionada por producto. Cuando hay varios contenidos se exige elegir el contado y se respeta su factor. No se añadió seguimiento simultáneo de varias familias de paquetes cerrados para un mismo producto.

[Manifiesto de diferencias de Admin](source-changes.json). La copia depende de esta estructura QA y sus módulos compartidos; no copiar archivos aislados al repositorio operativo.

## C. PostgreSQL y aislamiento

Base verificada: **calcquim_activation_test**, host **127.0.0.1**. Esquema del emulador: `calcquim_test_nexo_f54ecd8e7d404aa783a0`, propósito `synthetic`.

Cada ejecución automatizada crea otro esquema nuevo con nombre restringido. No reutiliza tablas históricas. Se aplicaron las migraciones existentes **001–013** incrementalmente a los esquemas nuevos. No se creó una migración de negocio adicional, no se ejecutó `down` y no se transformaron productos existentes. Los nuevos indicadores usan los registros JSON existentes.

Los scripts verifican base y esquema antes de escribir; al reabrir la revisión comprueban el propósito sintético. Ninguna conexión de estos scripts apuntó a `calcquim_operational`. No hubo despliegue, publicación, push, merge ni modificación de datos operativos. La integración de compras se preparó exclusivamente en QA, con corte histórico explícito.

[Evidencia de PostgreSQL del ejercicio Android](emulator-evidence.json).

## D. Pruebas ejecutadas

| Comprobación | Resultado |
|---|---:|
| Suite móvil existente | 44/44 |
| Suite web de la copia QA | 339/339 |
| Unitarias del backend QA | 45/45 |
| Integración y regresión PostgreSQL QA | 19/19 |
| Compilación Vite web QA | Correcta |
| Compilación/exportación del bundle Android | Correcta |
| Emulador Pixel 6, Expo Go / SDK 56 | Alta, ventas B–D y consulta ejecutadas |

Las pruebas QA cubren: alta HTTP y reintento; reversión completa de un alta inválida; tres modalidades; precio pendiente con composición; ventas; stock insuficiente sin cambios parciales; auditoría; dos solicitudes concurrentes; reposición sin duplicación; compra independiente de venta; factores distintos; apertura deshabilitada. Mr Big 600 y 800 hojas se probaron con fixtures sintéticos y paquetes de cuatro, usando el motor existente.

Los fallos iniciales de montaje y cachés se corrigieron y las suites afectadas se repitieron. No quedan fallos en los resultados indicados. El build web advierte del tamaño de algunos chunks, sin impedir la compilación.

No se construyó una APK nativa nueva: se utilizó el Expo Go instalado y se compiló el JavaScript Android. **No se generó ni distribuyó una APK definitiva.**

## E. Ejercicio Naturella

Naturella · Nocturna Súper Abundante. Categoría Higiene personal, creada con el comando normal únicamente en el esquema QA nuevo. Paquete de 8: $21. Pieza: $5.

| Operación | Cobro | Cerrados | Sueltas | Equivalentes | Ejecución |
|---|---:|---:|---:|---:|---|
| A: alta | — | 4 | 0 | 32 | Formulario Android y HTTP automatizado |
| B: vender 1 pieza | $5 | 3 | 7 | 31 | Android y automatizada |
| C: vender 2 piezas | $10 | 3 | 5 | 29 | Android y automatizada |
| D: vender 1 paquete | $21 | 2 | 5 | 21 | Android y automatizada |
| E: intentar vender 22 piezas | Rechazo | 2 | 5 | 21 | Integración automatizada |
| F: verificar integridad | — | 2 | 5 | 21 | PostgreSQL, solo lectura |

En el esquema del emulador quedaron una sola Naturella, tres ventas de origen `MOVIL`, tres salidas, un inicial y exactamente una apertura automática. La apertura no produce otro descuento de unidades base. La web mostró los mismos precios y el saldo **2/5/21**.

[Resultados automatizados](naturella-results.json). Los esquemas de pruebas se conservan sin borrar datos.

## F. Evidencia visual real

- [Formulario Android: paquete y pieza](../.artifacts/nexo-qa/screenshots/formulario-paquete-pieza.png).
- [Selector de modalidades](../.artifacts/nexo-qa/screenshots/selector-modalidades.png).
- [Inventario Android final](../.artifacts/nexo-qa/screenshots/inventario-final.png).
- [Recibo Android de $21](../.artifacts/nexo-qa/screenshots/venta-paquete.png).
- [Inventario web compartido](../.artifacts/nexo-qa/screenshots/web-inventario.png).

## G. Estado y límites

**Terminado en QA:** alta simplificada, guardado transaccional, inicial físico, venta móvil por presentación, apertura automática, restricciones de stock, sincronización, consulta web y trazabilidad. Pruebas automatizadas y ejercicio Android documentados.

**No probado:** celular físico y comparación de su APK instalada. La prueba E fue por HTTP, no mediante pulsaciones del emulador. La regresión Mr Big fue sintética; no se realizaron ventas sobre productos operativos. No se añadió una pantalla Android de compras: la recepción se validó mediante el backend y el flujo comercial existente.

**Pendiente:** revisión visual y aceptación del propietario. La activación en el repositorio/servidor operativo y el empaquetado definitivo permanecen fuera de esta ejecución. No hay bloqueo de infraestructura para revisar el QA. La aceptación de esta fase no autoriza producción.

## H. Instrucciones exactas de revisión

Desde `D:/ReactApps/calcQuim`:

```powershell
node qa/review.mjs
```

El comando reutiliza el QA preparado, inicia los servicios que falten, configura puentes para un emulador y abre Nexo QA en Expo Go. No hay que reconstruir conexiones ni escribir credenciales. Mantenerlo abierto si inició procesos.

1. Si Android muestra el ticket confirmado, volver o pulsar **Nueva venta**; abrir **Inventario**.
2. Buscar **Naturella** y abrir su ficha: **2 paquetes × 8 + 5 piezas = 21**. «Ver historial» permite revisar movimientos.
3. Formulario: **Inventario → Agregar producto → Forma de venta → Por paquete y pieza**. Naturella ya está registrada; no guardarla otra vez con el mismo nombre.
4. Web: **http://127.0.0.1:5185/productos-jarceria**. Pulsar «Abrir entorno PostgreSQL de ensayo» si aparece. Inventario: **http://127.0.0.1:5185/inventarios/jarceria**. «Actualizar datos» recarga lo registrado desde Android.
5. Repetir A–F sin alterar el ejercicio visible: `node --test qa/acceptance.test.mjs qa/regression.test.mjs`. Usa nuevos esquemas aislados.
6. Verificar el ejercicio visible sin modificarlo: `node qa/verify-review.mjs`.

Reversión: detener los procesos QA y volver al código anterior. La base operativa no requiere restauración porque no se modificó. No se incluye ninguna orden destructiva para borrar evidencia QA.
