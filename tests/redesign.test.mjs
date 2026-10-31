import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  commercialChoices,
  searchCommercial,
  specificChoices,
} from "../src/domain/commercial.mjs";
import { ticketModel, ticketHtml } from "../src/domain/ticket.mjs";
import { logoDataUri } from "../src/domain/logo.mjs";
import { catalogChoices } from '../src/domain/catalog.mjs';
import { makeLine } from '../src/domain/sale.mjs';
import { saleCapturedAt,saleLastChangedAt,saleMoment } from '../integration/admin-saleAuditView.mjs';
import { ticketHtml as adminTicketHtml } from '../../calcQuim-admin/src/services/saleReceipt.js';
const data = {
  categories: [
    { id: 1, name: "Multiusos", active: true },
    { id: 2, name: "Detergentes", active: true },
    { id: 3, name: "Suavizantes", active: true },
  ],
  productLines: [
    { id: 1, name: "Fabuloso", categoryId: 1, active: true },
    { id: 2, name: "Pinol", categoryId: 1, active: true },
  ],
  priceGroups: [
    { id: 1, name: "Fabulosos normales", price: 10, active: true },
    { id: 2, name: "Pinol estándar", price: 10, active: true },
    { id: 3, name: "Detergentes", price: 19, active: true },
    { id: 4, name: "Suavizantes estándar", price: 15, active: true },
  ],
  products: [
    { id: 1, name: "Lavanda", categoryId: 1, lineId: 1, priceGroupId: 1 },
    { id: 2, name: "Limón", categoryId: 1, lineId: 1, priceGroupId: 1 },
    { id: 3, name: "Verde", categoryId: 1, lineId: 2, priceGroupId: 2 },
    { id: 4, name: "Carisma", categoryId: 2, priceGroupId: 3 },
    { id: 5, name: "Carisma", categoryId: 3, priceGroupId: 4 },
    { id: 6, name: "Cloro", categoryId: 1, price: 6 },
    { id: 7, name: "Otro individual", categoryId: 1, price: 6 },
  ].map((p) => ({ ...p, unit: "litro", active: true, available: true })),
};
test("inicio sin resultados; opciones por relaciones y variantes secundarias", () => {
  const options = commercialChoices(data);
  assert.deepEqual(searchCommercial(options, ""), []);
  assert.deepEqual(searchCommercial(options, "  "), []);
  const found = searchCommercial(options, "FABULOSO");
  assert.equal(found.length, 1);
  assert.equal(found[0].kind, "line");
  assert.deepEqual(found[0].tariffs[0].productIds, [1, 2]);
  assert.equal(specificChoices(data, "fabuloso").length, 2);
  assert.equal(searchCommercial(options, "fabulosos normales").length, 1);
  assert.equal(searchCommercial(options, "limon")[0].name, "Fabuloso");
  assert.notEqual(options.find((c) => c.name === "Pinol").key, found[0].key);
  assert.equal(options.filter((c) => c.kind === "product").length, 2);
});
test("Carisma mantiene contexto y no une familias de precio compartido", () => {
  assert.equal(searchCommercial(commercialChoices(data), "carisma").length, 2);
  const ambiguous = specificChoices(data, "carisma");
  assert.ok(ambiguous.some((c) => c.context.includes("Detergentes")));
  assert.ok(ambiguous.some((c) => c.context.includes("Suavizantes")));
  assert.notEqual(ambiguous[0].key, ambiguous[1].key);
  const other = structuredClone(data);
  other.products.find((p) => p.id === 5).priceGroupId = 3;
  const options = commercialChoices(other);
  assert.ok(!options.some((c) => c.kind === "priceGroup" && c.refId === 3));
  for (const id of [4, 5])
    assert.ok(options.some((c) => c.kind === "product" && c.refId === id));
});
test("una línea con dos tarifas no se publica como opción comercial ambigua", () => {
  const other = structuredClone(data);
  other.products.push({
    id: 8,
    name: "Especial",
    categoryId: 1,
    lineId: 1,
    price: 13,
    unit: "litro",
    active: true,
    available: true,
  });
  const options = commercialChoices(other);
  assert.ok(!options.some((c) => c.key === "line:1"));
  assert.ok(options.some((c) => c.key === "priceGroup:1"));
  assert.ok(options.some((c) => c.key === "product:8"));
});
const receipt = {
  id: "internal-sale-id",
  status: "confirmed",
  folio: "MUESTRA-001",
  createdAt: "2026-10-30T18:30:00Z",
  total: 50,
  items: [
    {
      name: "Fabuloso <prueba>",
      quantity: 3,
      unit: "litro",
      price: 10,
      amount: 30,
      entryMode: "quantity",
    },
    {
      name: "Detergentes de prueba",
      quantity: 20 / 19,
      unit: "litro",
      price: 19,
      amount: 20,
      entryMode: "amount",
    },
  ],
};
test("ticket comparte modelo, datos exactos, importe original y logo intacto", async () => {
  const model = ticketModel(receipt),
    html = ticketHtml(receipt);
  assert.equal(model.total, "$50.00");
  assert.equal(model.items[1].amount, "$20.00");
  assert.equal(model.items[1].captured, "Por importe · $20.00");
  for (const value of [
    "2411561100",
    "Niños Héroes No. 10",
    "Tepetitla de Lardizábal",
    "¡Gracias por tu compra!",
    "Ticket original",
  ])
    assert.ok(html.includes(value));
  assert.ok(html.includes("Fabuloso &lt;prueba&gt;"));
  assert.ok(!html.includes("internal-sale-id"));
  assert.deepEqual(
    Buffer.from(logoDataUri.split(",")[1], "base64"),
    await readFile(new URL("../assets/full-clean-logo.png", import.meta.url)),
  );
  assert.throws(() => ticketModel({ ...receipt, total: 49 }));
  const updated = { ...receipt, corrected: true, version: 2 };
  assert.match(ticketHtml(updated), /Ticket actualizado · Versión 2/);
  assert.equal(ticketModel(receipt).version, "Ticket original");
});
test('cantidades y pesos a tarifa 19 conservan los importes solicitados',()=>{
 const choice=catalogChoices(data).find(c=>c.key==='product:4');
 assert.equal(makeLine(choice,choice.tariffs[0],'quantity','3','a').amount,57);
 const amount=makeLine(choice,choice.tariffs[0],'amount','20','b');assert.equal(amount.amount,20);assert.ok(Math.abs(amount.quantity-20/19)<1e-12);assert.equal(amount.capturedValue,'20');
});
test('Admin y móvil generan el mismo contenido y preservan auditoría sin inventar horas',()=>{
 assert.equal(adminTicketHtml(receipt),ticketHtml(receipt));
 const sale={createdAt:'2026-10-30T18:00:00Z',history:[{at:'2026-10-30T20:00:00Z',action:'breakdown'},{at:'2026-10-30T19:00:00Z',action:'commercial_correction'}]};
 assert.equal(saleCapturedAt(sale),sale.createdAt);assert.equal(saleLastChangedAt(sale),'2026-10-30T20:00:00Z');assert.equal(saleMoment(null),'Sin dato histórico');assert.equal(saleCapturedAt({createdAt:'2026-10-30'}),null);
});
test("ticket largo conserva todos los conceptos y reglas de paginado", () => {
  const long = {
    ...receipt,
    total: 600,
    items: Array.from({ length: 30 }, (_, i) => ({
      ...receipt.items[1],
      name: `Concepto ${i + 1}`,
    })),
  };
  const html = ticketHtml(long);
  assert.equal(ticketModel(long).items.length, 30);
  assert.ok(html.includes("Concepto 30"));
  assert.match(html, /display:table-header-group/);
  assert.match(html, /break-inside:avoid/);
});
