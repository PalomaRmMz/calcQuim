# Cierre funcional Admin y backend

25 fuentes selectivas, sin dependencias, credenciales ni copia completa de QA. Requiere primero revisar los paquetes anteriores `integration/admin-changes` e `integration/audit-admin-changes` y sus requisitos (incluida la migración QA histórica 014 y el helper reportPayment). Este paquete es la versión posterior de las rutas coincidentes; no aplicar a ciegas ni sobrescribir los manifiestos anteriores.

Los motores commerce, laundryPricing y settlementLedger se incluyen completos, sin reexports hacia el móvil. El manifiesto registra origen y SHA256 exacto. No hay una migración nueva en esta fase. La configuración del servidor QA y sus rutas de fallos no forman parte de esta entrega.

Revisar diffs y pruebas en una carpeta aislada antes de integrar. Ejecutar `node qa/audit/prepare-functional-review.mjs` desde la raíz para comprobar integridad; no aplica cambios, no hace stage ni commits. Consultar [informe](../../qa/audit/FUNCTIONAL-REPORT.md) y [política monetaria pendiente](../../qa/audit/SETTLEMENT-POLICY.md). No habilitar registros financieros sin política aprobada.
