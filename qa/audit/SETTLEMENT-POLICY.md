# Diferencias monetarias: estructura disponible y decisiones pendientes

La edición comercial conserva el documento original y calcula una diferencia. No acredita que esa diferencia se cobró o devolvió. La anulación tampoco acredita un reembolso. Ese comportamiento se conserva.

## Implementado en este cierre

- Proyección de importe comercial, documento vigente, cobro original documentado, cobros adicionales registrados, devoluciones registradas y saldo pendiente.
- Contrato técnico de constancia confirmada: ID, clave de idempotencia, venta, dirección (cobro/devolución), importe en centavos, método, fecha, referencia, motivo y responsable.
- Duplicado idéntico de clave cuenta una sola vez; contenido diferente con la misma clave se rechaza. Importes fraccionarios de centavo, referencias incompletas y devoluciones sin respaldo se rechazan.
- Panel web de diferencias y contrato del historial Android que distingue total documentado de cobro confirmado. Previsualización de la corrección móvil antes de confirmar.
- Sin cambios de comprobantes históricos, sin constancias financieras inventadas y **sin endpoint ni control habilitado para registrar liquidaciones**. Los eventos usados en pruebas son fixtures en memoria, no operaciones financieras del escenario auditado.

## Política no definida en el modelo existente

Antes de habilitar el registro deben quedar aprobados:

1. Quién puede confirmar, revisar y rectificar una constancia; permisos y evidencia del responsable.
2. Pagos parciales, excedentes y límites respecto del saldo; tratamiento de reversos mediante eventos compensatorios.
3. Si el redondeo corresponde al documento o a cada liquidación. No aplicar automáticamente la política de venta a un pago adicional.
4. Métodos permitidos, fecha efectiva, correcciones retroactivas y referencia o comprobante exigido.
5. Destino monetario de anulaciones, devoluciones parciales y bienes retenidos. No deducir un reembolso de un movimiento físico.

No hay una configuración aprobada de estas decisiones en las referencias consultadas. La instrucción de esta fase permite implementar la estructura técnica segura y documentar el pendiente; no autoriza inventar esa política. Los importes pendientes permanecen visibles y los reportes siguen mostrando el cobro final sin determinar cuando corresponde.
