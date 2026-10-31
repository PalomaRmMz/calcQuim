// Instrumentación exclusivamente de desarrollo. No funciona en APK ni con datos operativos.
import { useEffect, useRef } from "react";
import { EMULATOR_QA } from "../domain/persistence.mjs";
import { catalogChoices } from "../domain/catalog.mjs";
import { makeLine } from "../domain/sale.mjs";
const base = "http://127.0.0.1:3017",
  fixtureToken = "synthetic-local-demo-token-not-production";
const safe = (m) =>
  EMULATOR_QA &&
  m.state?.baseUrl === base &&
  (!m.state.catalog || m.state.catalog.environment === "synthetic");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function request(path, body) {
  const r = await fetch(base + "/__qa" + path, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + fixtureToken,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!r.ok) throw new Error("QA " + r.status);
  return r.json();
}
export function useEmulatorProbe(model) {
  const current = useRef(model);
  current.current = model;
  useEffect(() => {
    if (!EMULATOR_QA) return;
    let running = false,
      stopped = false;
    const timer = setInterval(async () => {
      if (running || stopped || !safe(current.current) || current.current.busy)
        return;
      running = true;
      let command;
      try {
        command = await request("/next");
        if (!command) return;
        let m = current.current;
        if (command.action === "configure")
          await m.configure(base, fixtureToken);
        else if (command.action === "sync") await m.sync();
        else if (command.action === "newSale") await m.newSale();
        else if (command.action === "mode") await m.mode(command.mode);
        else if (command.action === "submit") await m.submit();
        else if (command.action === "add") {
          const count = Number(command.count || 1);
          if (!Number.isInteger(count) || count < 1 || count > 40)
            throw new Error("Límite de fixture.");
          for (let i = 0; i < count; i++) {
            m = current.current;
            if (!safe(m)) throw new Error("Fuera de fixture.");
            const c = catalogChoices(m.state.catalog.data).find(
              (c) => c.key === command.key,
            );
            if (!c || c.tariffs.length !== 1)
              throw new Error("Referencia de prueba ambigua.");
            const line = makeLine(
              c,
              c.tariffs[0],
              command.mode,
              command.value,
              `qa-${Date.now()}-${i}`,
            );
            if (!(await m.add(line))) throw new Error("La app estaba ocupada.");
            await delay(80);
          }
        } else if (command.action !== "state")
          throw new Error("Acción de fixture no permitida.");
        await delay(150);
        await request("/result", {
          id: command.id,
          state: current.current.state,
          error: current.current.error,
          connectionStatus: current.current.connectionStatus,
        });
      } catch (e) {
        if (command)
          await request("/result", { id: command.id, error: e.message }).catch(
            () => {},
          );
      } finally {
        running = false;
      }
    }, 700);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, []);
}
export async function collectSyntheticArtifact(model, name, base64) {
  if (
    safe(model) &&
    model.token === fixtureToken &&
    model.state.catalog?.environment === "synthetic"
  )
    await request("/artifact", { name, base64 });
}
