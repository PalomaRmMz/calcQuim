> Continuaci?n: [cierre final](FINAL-REPORT.md) y [checkpoint](FINAL-PROGRESS.md). La candidata documentada debajo se conserva intacta.

# Integración candidata de Nexo

Destino aislado: `D:/ReactApps/calcQuim/.artifacts/nexo-candidate-2026-11-15T21-44-20-714Z/`. Fuentes Admin/backend en `admin/`, snapshot móvil en `mobile/`. Copia y artefactos ignorados por Git; paquetes anteriores conservados.

## Etapa 1 — fuentes y dependencias completadas

- Base Admin operativo limpia y hashes previos de los 26 archivos del primer paquete comprobados antes de copiar.
- Aplicados, en orden: admin-changes (26), audit-admin-changes (14), functional-admin-changes (25). Total 65 aplicaciones sobre 51 rutas distintas; última versión prevalece solo dentro de la cadena aprobada.
- Los 51 resultados comparados con fuentes validadas. Comparación adicional de todo src, server/src y migraciones: cero diferencias respecto de QA aprobado, sustituyendo los cuatro reexports QA por motores completos. Lista y hashes en sources.json; source-differences.json vacío.
- Dependencias copiadas físicamente, sin junctions hacia proyectos operativos o QA. Fuentes móviles congeladas y hasheadas en mobile-sources.json. No se copiaron credenciales, .env, bases de datos, artefactos operativos ni carpetas .git.
- Configuración de build candidata separada, sin activar modo operativo. Ningún servicio de la candidata se arrancó sobre puertos operativos.

## Etapa 2 — validación mínima completada

- Web Vite build: código 0; salida ../web-build, advertencia de tamaño de chunks.
- Backend: comprobación sintáctica de todas las fuentes .mjs y 45/45 pruebas unitarias.
- Integración crítica contra fuentes candidatas/snapshot móvil: 37/37, incluida política de efectivo, compatibilidad de solicitudes antiguas/nuevas, recibos, correcciones, idempotencia, recuperación, concurrencia, lavandería y compras.
- Migraciones 001–014 ejecutadas por esas pruebas exclusivamente en esquemas sintéticos nuevos de la instancia QA55439. Runtime de pruebas comprueba base/rol/host antes de migrar. No se migró el escenario visible ni PostgreSQL operativo.
- Android: compilado grafo JavaScript completo con Metro QA existente, dev=false/minify=true; HTTP200, 4,740,698 bytes. Snapshot cotejado contra fuentes compiladas. No es build nativo ni APK.
- Pendiente al guardar este bloque: finalizar suites web/móvil en curso, comprobación de dependencias y manifiesto final. Consultar checkpoint.json y validation.json antes de repetir pruebas. Política de liquidaciones sigue deshabilitada.

No se observa contador de créditos ni renovaciones. No reconstruir el escenario comercial. Scripts de preparación/validación abortan antes de sobrescribir una ejecución; no relanzarlos contra la misma carpeta para repetir todo innecesariamente.


## Etapa 3 — cierre completado y validado

- Resultado final: integración candidata completada y validada. [Informe](CANDIDATE-REPORT.md), [manifiesto final](candidate-manifest.json) y [lista selectiva](candidate-review-files.txt).
- Web:335 pruebas aprobadas y un archivo bloqueado por fixture faltante; incorporados los ocho archivos fuente benchmarks desde base limpia y repetido solo ese archivo,4/4 aprobado. Cobertura total339, logs inicial/final conservados. Móvil y adicionales58/58. No quedó fallo sin resolver.
- npm ls válido web/backend; dependencias físicas sin enlaces. Backend:45/45; integración candidata37/37; JavaScript Android compilado completo y snapshot verificado. Las ramas opcionales QA no contienen credenciales en fuentes; el bundle compilado es evidencia QA ignorada, no distribuible.
- Migraciones001–014 presentes y probadas solo en esquemas sintéticos nuevos de55439. Sin migraciones operativas ni cambios del escenario comercial existente. Verificador de lectura de21:48UTC conserva revisión307,119 cuentas,15ventas/9compras y documentos históricos.
- Cierre final en .artifacts/nexo-candidate-2026-11-15T21-44-20-714Z/checkpoint.json:51 archivos Admin consolidados,88 archivos móviles, dependencias válidas, Admin operativo limpio y0staged. sources.json registra además los fixtures recuperados.
- Siguiente paso exacto: revisar candidate-manifest.json y logs conforme a CANDIDATE-REPORT.md. No relanzar reconstrucción ni compras/ventas. No ejecutar start/dev/activación heredados sin runtime QA explícito. Una activación posterior requiere su propia ventana y revisión de configuración, permisos y migraciones. Liquidaciones continúan deshabilitadas. No se hicieron commits, push, APK ni despliegue.
