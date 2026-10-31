import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import * as SecureStore from "expo-secure-store";
import { randomUUID } from "expo-crypto";
import {
  emptyDraft,
  loadMobileState,
  readLegacyData,
  saveMobileState,
} from "../services/mobileStorage";
import { createMobileApi, serverUrl } from "../services/mobileApi.mjs";
import { validateCatalog } from "../domain/catalog.mjs";
import { submitSale } from "../domain/submission.mjs";
import { EMULATOR_QA } from "../domain/persistence.mjs";
const credentialKey = EMULATOR_QA
  ? "calcquim.mobile.token.qa"
  : "calcquim.mobile.token";

export function useMobileSale() {
  const [state, setState] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [token, setToken] = useState(""),
    [legacy, setLegacy] = useState(null);
  const current = useRef(null),
    lock = useRef(false);
  const [activity, setActivity] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("cached");
  const syncRef = useRef(null);
  useEffect(() => {
    (async () => {
      try {
        const s = await loadMobileState();
        current.current = s;
        setState(s);
        setToken((await SecureStore.getItemAsync(credentialKey)) || "");
        setLegacy(EMULATOR_QA ? {} : await readLegacyData());
      } catch (e) {
        setError(e.message);
      }
    })();
  }, []);
  async function commit(next) {
    await saveMobileState(next);
    current.current = next;
    setState(next);
  }
  async function run(task, label = "Procesando…") {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setActivity(label);
    setError("");
    try {
      return await task();
    } catch (e) {
      setError(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const editable = () => {
    if (!["draft", "rejected"].includes(current.current.draft.status))
      throw new Error(
        "Consulta el resultado del envío antes de modificar la venta.",
      );
  };
  async function sync() {
    if (lock.current || !current.current || !token) return;
    return run(async () => {
      setConnectionStatus("syncing");
      try {
        const catalog = validateCatalog(
          await createMobileApi(current.current.baseUrl, token).catalog(),
        );
        const draft = current.current.draft;
        if (
          draft.status !== "confirmed" &&
          draft.lines.length &&
          draft.generation &&
          draft.generation !== catalog.generation
        )
          throw new Error(
            "Cambió la generación del catálogo. Conservamos el borrador y la caché anterior para revisión.",
          );
        await commit({
          ...current.current,
          catalog: { ...catalog, syncedAt: new Date().toISOString() },
        });
        setConnectionStatus("connected");
      } catch (e) {
        setConnectionStatus("offline");
        throw e;
      }
    }, "Actualizando catálogo…");
  }
  syncRef.current = sync;
  useEffect(() => {
    if (!state || !token) return;
    let wasConnected = false;
    const unsubscribe = NetInfo.addEventListener((network) => {
      const connected = network.isConnected === true; // La API local funciona aunque Wi-Fi no tenga Internet.
      if (connected && !wasConnected) syncRef.current?.();
      if (!network.isConnected) setConnectionStatus("offline");
      wasConnected = connected;
    });
    const active = AppState.addEventListener("change", (next) => {
      if (next === "active") syncRef.current?.();
    });
    syncRef.current?.();
    return () => {
      unsubscribe();
      active.remove();
    };
  }, [!!state, token, state?.baseUrl]);
  useEffect(() => {
    if (connectionStatus !== "offline" || !token) return;
    const timer = setInterval(() => {
      if (AppState.currentState === "active") syncRef.current?.();
    }, 15000);
    return () => clearInterval(timer);
  }, [connectionStatus, token]);
  return {
    state,
    error,
    busy,
    activity,
    token,
    legacy,
    connectionStatus,
    configure: (url, secret) =>
      run(async () => {
        const baseUrl = serverUrl(url);
        if (
          baseUrl !== current.current.baseUrl &&
          current.current.draft.status !== "confirmed" &&
          (current.current.draft.lines.length || current.current.draft.attempt)
        )
          throw new Error(
            "Termina o cancela explícitamente el borrador del servidor anterior antes de cambiar la dirección.",
          );
        await SecureStore.setItemAsync(credentialKey, secret.trim());
        setToken(secret.trim());
        await commit({
          ...current.current,
          baseUrl,
          catalog:
            baseUrl === current.current.baseUrl
              ? current.current.catalog
              : null,
        });
      }),
    sync,
    mode: (value) => run(() => commit({ ...current.current, mode: value })),
    payment: (value) =>
      run(async () => {
        editable();
        await commit({
          ...current.current,
          draft: {
            ...current.current.draft,
            payment: value,
            status: "draft",
            attempt: null,
          },
        });
      }),
    add: (line, editingId) =>
      run(async () => {
        editable();
        const s = current.current,
          key = `${line.reference.kind}:${line.reference.id}`;
        const lines = editingId
          ? s.draft.lines.map((l) => (l.id === editingId ? line : l))
          : [...s.draft.lines, line];
        await commit({
          ...s,
          usage: {
            ...s.usage,
            [key]: {
              count: (s.usage[key]?.count || 0) + 1,
              at: new Date().toISOString(),
            },
          },
          draft: {
            ...s.draft,
            generation: s.catalog.generation,
            lines,
            status: "draft",
            attempt: null,
          },
        });
        return true;
      }),
    remove: (id) =>
      run(async () => {
        editable();
        await commit({
          ...current.current,
          draft: {
            ...current.current.draft,
            lines: current.current.draft.lines.filter((l) => l.id !== id),
            status: "draft",
            attempt: null,
          },
        });
      }),
    cancel: () =>
      run(async () => {
        editable();
        await commit({ ...current.current, draft: emptyDraft() });
      }),
    submit: () =>
      run(async () => {
        const s = current.current;
        if (s.draft.status === "confirmed") return s.draft;
        if (!s.catalog)
          throw new Error("Sincroniza primero el catálogo oficial.");
        const result = await submitSale({
          draft: s.draft,
          catalog: s.catalog,
          api: createMobileApi(s.baseUrl, token),
          uuid: randomUUID,
          persist: async (draft) => {
            const receipts =
              draft.receipt &&
              !current.current.receipts.some((r) => r.id === draft.receipt.id)
                ? [draft.receipt, ...current.current.receipts]
                : current.current.receipts;
            const oldCatalog = current.current.catalog;
            const catalog =
              draft.status === "confirmed" &&
              draft.serverGeneration === oldCatalog?.generation &&
              Number.isSafeInteger(draft.serverRevision)
                ? { ...oldCatalog, revision: draft.serverRevision }
                : oldCatalog;
            await commit({ ...current.current, catalog, draft, receipts });
          },
        });
        if (result.status === "confirmed") setConnectionStatus("connected");
        else if (result.status === "offline") setConnectionStatus("offline");
        return result;
      }, "Enviando…"),
    newSale: () =>
      run(async () => {
        if (current.current.draft.status !== "confirmed")
          throw new Error("Confirma o cancela explícitamente el borrador.");
        await commit({ ...current.current, draft: emptyDraft() });
        return true;
      }),
  };
}
