# Correcciones Admin de la auditoría Nexo

Fuentes para revisión, adicionales a `integration/admin-changes/nexo-integrated.patch`. **No se aplicaron al repositorio ni al servidor Admin operativo.** Sin commit, merge, push, despliegue ni APK.

- `HardwarePurchases.jsx`: identifica producto y presentación al comprar.
- `CommercialSaleForm.jsx`: permite agregar servicios comerciales al ticket.
- `LaundrySaleFields.jsx`: el mínimo respeta la regla de medias cargas, también con un identificador nuevo.
- `hardwareCreation.mjs`: distingue fracciones Unicode y reconoce sus equivalentes escritos.
- `operationsReport.mjs` y `reportPayment.mjs`: una corrección histórica no demuestra cobro de la diferencia; conserva el importe original conocido y muestra el cobro final sin determinar.
- `purchasePresentationLabel.mjs`: etiqueta del selector de jarcería.

`manifest.json` registra hashes de las fuentes probadas. Revisar después del parche integrado anterior, dentro de una copia QA. La futura integración operativa requiere conciliar los cambios locales del otro repositorio; no sustituirlos automáticamente.

Regresiones: `tests/hardware-fractions.test.mjs`, `tests/purchase-presentation-label.test.mjs`, `tests/report-payment.test.mjs` y `tests/laundry-fraction-render.test.mjs`. Requieren dependencias y copia Admin QA descritas en `qa/audit/README.md`.

- `SaleFormModal.css`: cantidad de limpieza compacta (128 px), botón adyacente en escritorio; verificación de geometría en 1280 y 375 px, sin desbordamiento.

- Contrato de efectivo móvil: `server/src/mobile/router.mjs`, servicios `dataset.mjs`, `commands.mjs` y `webPayment.mjs`, migración aditiva014. Solo se habilitó en QA sintético; cliente antiguo recibe409 cuando la política está activa. Exige integrar en conjunto el cliente móvil con comprobantes y validación monetaria. No reescribe ventas anteriores. Migración operativa pendiente de una autorización futura, fuera de esta auditoría.
