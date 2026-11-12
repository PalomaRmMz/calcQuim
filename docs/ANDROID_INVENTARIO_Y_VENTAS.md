# Inventario y ventas en Android

La navegación principal separa Venta rápida, Inventario y Ventas. Configuración
conserva la conexión y la credencial existentes; las credenciales no se incluyen
en el repositorio.

Inventario permite buscar productos de Jarcería, consultar existencias e historial,
capturar inventario y abrir Agregar producto conforme a los permisos del servidor.
Los intentos de captura y alta se conservan localmente y consultan su estado antes
de reintentar, evitando duplicados ante respuestas inciertas. Una operación pendiente
requiere resolverse con la conexión original antes de cambiarla.

Ventas separa tres fuentes: historial oficial de PostgreSQL, tickets originales
guardados en el dispositivo y datos locales anteriores. El historial se consulta
bajo demanda mediante GET y permiso independiente `sales:read`; incluye búsqueda
por folio exacto, fechas inclusivas, paginación y detalle de importes registrados.
Abrir o actualizar el historial no envía ventas ni modifica el borrador. Ante un
fallo de lectura, los resultados previos se identifican como consulta no actual.

Las pruebas unitarias se ejecutan mediante `npm test` y `npm run test:inventory`.
Algunas pruebas de integración requieren el repositorio hermano `calcQuim-admin`.
Los comandos `test:inventory:qa` y `test:inventory:web-qa` requieren además el entorno
QA existente y sus fixtures privados locales; no deben ejecutarse contra una base
operativa. Los fixtures, respaldos, credenciales, registros y capturas se mantienen
fuera del control de versiones.

Las herramientas `integration/existing-inventory-qa.mjs` y
`integration/verify-inventory-qa.mjs` preparan y comprueban ese entorno existente.
El servidor inicia en modo de lectura; `--write-authorized` habilita exclusivamente
las capturas permitidas dentro del QA verificado. No ejecutarlas para esta tarea
de revisión de Git ni utilizar configuración operativa como sustituto del QA.

Las copias preparadas de despliegue, diagnósticos de Expo y reportes operativos
locales se conservan en el equipo y no forman parte de esta entrega de fuentes.
Sus exclusiones específicas de esta estación se guardan en `.git/info/exclude`.
Esto incluye las pruebas históricas que importan esas copias preparadas; no se
confunden con las pruebas mantenidas en los comandos de `package.json`.
