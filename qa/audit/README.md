> Continuación funcional: [informe de cierre](FUNCTIONAL-REPORT.md) y [checkpoint](FUNCTIONAL-PROGRESS.md). Estado: aprobado para continuar QA; revisión 307. El contenido anterior se conserva como registro de su fase.

# Auditoría integral Nexo

Consultar primero [PROGRESS.md](PROGRESS.md). El checkpoint más reciente determina el siguiente paso; no volver a ejecutar altas ni compras ya registradas.

Ejecución conservada: `2026-11-15T00-18-48-246Z_99e55160`. Evidencias locales en `.artifacts/audit/<ejecución>/`, además de logs de suites en `.artifacts/audit/`. Datos sintéticos; no importar tickets históricos. Referencias comerciales consultadas con SELECT permitido y transacción READ ONLY.

## Reanudar con seguridad

Desde `D:/ReactApps/calcQuim`, ejecutar `node qa/audit/resume.mjs`. Comprueba identidad SQL/API, permisos, generación, saldos y movimientos; crea una carpeta de evidencia nueva. Si falla identidad, no escribir. Inventariar puertos con `netstat -ano -p tcp`; nunca detener procesos por nombre genérico.

Servicios propios: PostgreSQL55439, API63337, web5207 y Metro8107. Operativos conocidos: PostgreSQL5432, API3003/3016/3099 y web5173. No usarlos para pruebas. El rol QA no tiene privilegios de superusuario, crear bases ni crear roles. Su instancia no contiene bases operativas.

`state.private.json`, `postgres.private.json` y `latest.private.json` son archivos locales ignorados. No imprimirlos ni versionarlos. No mezclar credenciales operativas. No recrear cluster/base/esquema existentes: `init-postgres.mjs` y `bootstrap.mjs` son pasos iniciales, no herramientas de reanudación.

Si un servicio propio está detenido, verificar identidad y puerto libre antes de arrancar `node qa/audit/start.mjs`, `node qa/audit/metro.mjs` o Vite con `qa/audit/vite.config.mjs`. PostgreSQL de esta ejecución se inició con `postgres.exe -D <directorio registrado en postgres.private.json>`; `pg_ctl` falló por restricciones del token Windows. No iniciar otro servidor sobre el mismo directorio.

Web: `http://127.0.0.1:5207`, botón «Abrir entorno PostgreSQL de ensayo». Navegación real con Chromium/Playwright local y contexto exclusivo. No usar perfil del usuario. Dependencias Admin QA bajo `qa/integrated/admin`; copia de fuentes y dependencias se documenta en `qa/integrated/README.md`. No confundir esa copia ignorada con el repositorio Admin operativo.

Android: solo `emulator-5554`, Expo Go, sin instalar APK ni borrar almacenamiento. Puentes propios `adb -s emulator-5554 reverse tcp:63337 tcp:63337` y `... tcp:8107 tcp:8107`. Conservar puentes históricos. `metro.mjs` configura namespace por ejecución, URL y token QA. Los helpers PowerShell leen XML nuevo y rechazan dumps fallidos. Sus acciones exigen coincidencia única exacta; no reutilizar coordenadas de capturas anteriores. ADB requiere acceso fuera del sandbox en este entorno por el directorio `.android`.

## Verificación y reproducción

- `node --test qa/audit/business.test.mjs`: oráculo independiente de centavos, secuencia60ciclos y revisión obsoleta de alta móvil. Esquemas sintéticos adicionales, nunca el operativo.
- Suites `regression`, `stability`, `recovery` y `web-cash` en esta carpeta adaptan las históricas al cluster55439. `prepare-regression.mjs` genera esas copias; no volver a generarlas durante un ejercicio en curso. Las fechas de fixture usan CDMX.
- `node --test tests/business-time.test.mjs tests/hardware-fractions.test.mjs tests/laundry-fraction-render.test.mjs tests/purchase-presentation-label.test.mjs tests/qa-namespace.test.mjs tests/report-payment.test.mjs`: regresiones técnicas nuevas. Ejecutar desde la raíz.
- La suite web requiere cwd `qa/integrated/admin`; consultar su `package.json`. Build desde allí: `node node_modules/vite/bin/vite.js build --config ../../audit/vite.config.mjs --outDir ../../../.artifacts/audit/<directorio-nuevo>`. No usar `--emptyOutDir`: conservar artefactos.
- `reconstruct-supply-function.mjs` exporta ayudante de formularios con contexto explícito `{page,supplyRef,ref,uiLog,fs,evidenceDir}`. No es un importador ni un replay idempotente. `ui-catalog.json` y referencias privadas documentan lo ya creado. No repetir contra el mismo esquema.

La reconstrucción completa por interfaces está evidenciada en la bitácora, no empaquetada como una sola ejecución automática. Algunas configuraciones avanzadas (habilitación física, política de efectivo y `loadPricing`) necesitaron API QA y están identificadas como tales en el informe.

La ruta protegida `/audit/fault/lost-response` pertenece exclusivamente al servidor de auditoría. Requiere token/generación y consume el fallo en la siguiente venta móvil exitosa después de confirmarla. No activarla salvo durante un ejercicio observado; no trasladarla a producción.

Fuentes Admin corregidas para revisión: `integration/audit-admin-changes/manifest.json`. No aplicar automáticamente. `git-add-selective.txt` es solo una lista revisable; no se ejecutó stage, commit ni push. Los artefactos y archivos privados deben seguir ignorados.

No hay acceso al contador de créditos. Los horarios de renovación informados por el usuario son referencias, no eventos observables ni capacidad de reanudar automáticamente.
