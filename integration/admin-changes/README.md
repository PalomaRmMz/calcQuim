# Cambios selectivos de Nexo para Admin

`nexo-integrated.patch` contiene fuentes de productos, inventario y estabilidad más ajustes de interfaz. `manifest.json` identifica 26 archivos y hashes de base; los hashes de resultado normalizan finales CRLF/LF. No incluye dependencias, copias QA completas, credenciales, datos, migraciones nuevas ni configuración de puertos operativos.

Se generó respecto al estado local de `D:/ReactApps/calcQuim-admin`, conservando su modificación previa de `salesHistory.mjs`. Los tres motores compartidos se incluyen como fuentes completas, sin rutas a `qa/` ni al móvil. El parche se aplicó y verificó en una carpeta aislada; la combinación está probada en `qa/integrated/admin`.

**No se aplicó al repositorio ni al servidor que atiende ventas reales.** Aplicarlo allí queda fuera de esta entrega. No ejecutar una aplicación del parche o reinicio sobre el directorio operativo mientras esté atendiendo ventas.

Para preparar únicamente la copia local de QA, si no existe:

```powershell
node qa/integrated/bootstrap-admin.mjs
```

El script comprueba la base y escribe únicamente en `qa/integrated/admin`; aborta ante cambios de base y conserva copias existentes. No ejecuta servicios ni migraciones. La revisión y sus resultados están en [el informe integrado](../../qa/integrated/README.md).
