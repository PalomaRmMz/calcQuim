import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { randomUUID } from "expo-crypto";
import ActionButton from "../components/ActionButton";
import TotalCard from "../components/TotalCard";
import {
  BrandHeader,
  ConnectionBadge,
  Notice,
  styles,
} from "../components/BrandUI";
import { COLORS as C } from "../domain/brand.mjs";
import { catalogChoices } from "../domain/catalog.mjs";
import {
  officialCommercialChoices,
  searchCommercial,
  specificChoices,
} from "../domain/commercial.mjs";
import { makeLine, money, total } from "../domain/sale.mjs";
export { styles } from "../components/BrandUI";

export default function QuickSaleScreen({ navigation, model: m }) {
  const [query, setQuery] = useState(""),
    [selection, setSelection] = useState(null),
    [tariffKey, setTariffKey] = useState(""),
    [value, setValue] = useState(""),
    [editingId, setEditingId] = useState(null),
    [notice, setNotice] = useState(""),
    [showSpecific, setShowSpecific] = useState(false),
    [limit, setLimit] = useState(6);
  const didSelect = useRef(false);
  const searchRef = useRef(null),
    valueRef = useRef(null),
    scrollRef = useRef(null),
    s = m.state;
  const choices = useMemo(() => catalogChoices(s?.catalog?.data), [s?.catalog]);
  const primary = useMemo(
    () => officialCommercialChoices(s?.catalog),
    [s?.catalog],
  );
  const matches = useMemo(
    () => searchCommercial(primary, query, s?.usage),
    [primary, query, s?.usage],
  );
  const variants = useMemo(
    () => specificChoices(s?.catalog?.data, query, s?.usage),
    [s?.catalog, query, s?.usage],
  );
  const choice = selection && choices.find((c) => c.key === selection),
    tariff = choice?.tariffs.find((t) => t.key === tariffKey);
  let preview = null;
  try {
    if (choice && value)
      preview = makeLine(choice, tariff, s.mode, value, editingId || "preview");
  } catch {
    /* Agregar muestra el error concreto. */
  }
  useEffect(() => {
    if (selection) {
      didSelect.current = true;
      valueRef.current?.focus();
    } else if (didSelect.current) {
      didSelect.current = false;
      searchRef.current?.focus();
    }
  }, [selection]);
  useEffect(() => {
    if (s?.draft.status === "confirmed")
      navigation.navigate("SaleSummary", { receiptId: s.draft.receipt.id });
  }, [s?.draft.status, navigation]);
  if (!s)
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.page}>
          <Notice>{m.error || "Cargando venta…"}</Notice>
        </View>
      </SafeAreaView>
    );
  const editable = ["draft", "rejected"].includes(s.draft.status),
    locked = !editable;
  function focusValue() {
    requestAnimationFrame(() => valueRef.current?.focus());
  }
  function reset() {
    setSelection(null);
    setTariffKey("");
    setValue("");
    setEditingId(null);
    setQuery("");
    setShowSpecific(false);
    setNotice("");
  }
  function select(c) {
    setSelection(c.key);
    setTariffKey(c.tariffs.length === 1 ? c.tariffs[0].key : "");
    setValue("");
    setEditingId(null);
    setQuery("");
    setShowSpecific(false);
    setNotice("");
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    focusValue();
  }
  async function add() {
    try {
      const line = makeLine(
        choice,
        tariff,
        s.mode,
        value,
        editingId || randomUUID(),
      );
      if (await m.add(line, editingId)) {
        reset();
        scrollRef.current?.scrollTo({ y: 0, animated: true });
        requestAnimationFrame(() => searchRef.current?.focus());
      }
    } catch (e) {
      setNotice(e.message);
    }
  }
  async function edit(line) {
    const c = choices.find(
      (c) =>
        c.kind === line.reference.kind &&
        String(c.refId) === String(line.reference.id),
    );
    if (!c) {
      setNotice(
        "Este concepto ya no está disponible. Revisa la conexión y el catálogo.",
      );
      return;
    }
    select(c);
    setTariffKey(line.tariffKey);
    setValue(line.capturedValue);
    setEditingId(line.id);
    await m.mode(line.entryMode);
    focusValue();
  }
  function result(c, specific = false) {
    const t = c.tariffs[0];
    return (
      <Pressable
        key={c.key}
        accessibilityRole="button"
        accessibilityLabel={`${c.name}, ${c.context}, ${money(t.price)} por ${t.unit}`}
        disabled={locked || m.busy}
        onPress={() => select(c)}
        style={styles.result}
      >
        <View style={styles.row}>
          <Text style={styles.resultName}>{c.name}</Text>
          <Text style={styles.price}>
            {money(t.price)}
            <Text style={{ fontWeight: "400", fontSize: 12 }}> / {t.unit}</Text>
          </Text>
        </View>
        <Text style={styles.muted}>
          {c.context}
          {specific ? " · Variante específica" : ""}
        </Text>
      </Pressable>
    );
  }
  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      style={styles.root}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.root}
      >
        <BrandHeader
          onSettings={() => {
            Keyboard.dismiss();
            navigation.navigate("Connection");
          }}
        />
        <ConnectionBadge
          status={m.connectionStatus}
          catalog={s.catalog}
          onPress={() => navigation.navigate("Connection")}
        />
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.page}
        >
          <Notice>{m.error || notice || s.draft.error}</Notice>
          {!s.catalog && (
            <View style={styles.card}>
              <Text style={styles.heading}>Tu catálogo de Admin</Text>
              <Text style={styles.muted}>
                Configura la conexión para cargar los productos y sus precios
                oficiales.
              </Text>
              <ActionButton
                label="Conectar con Admin"
                icon="wifi"
                fullWidth
                onPress={() => navigation.navigate("Connection")}
              />
            </View>
          )}
          <View style={styles.card}>
            {!choice ? (
              <>
                <View
                  style={[
                    styles.row,
                    {
                      borderWidth: 1,
                      borderColor: C.line,
                      borderRadius: 13,
                      paddingHorizontal: 12,
                    },
                  ]}
                >
                  <Feather name="search" size={19} color={C.primary} />
                  <TextInput
                    ref={searchRef}
                    editable={!locked}
                    accessibilityLabel="Buscar producto, línea, grupo o categoría"
                    value={query}
                    onChangeText={(text) => {
                      setQuery(text);
                      setShowSpecific(false);
                      setLimit(6);
                      setNotice("");
                    }}
                    placeholder="¿Qué vas a vender?"
                    placeholderTextColor={C.muted}
                    autoCorrect={false}
                    returnKeyType="search"
                    style={{
                      flex: 1,
                      fontSize: 16,
                      minHeight: 50,
                      color: C.ink,
                      paddingVertical: 10,
                    }}
                  />
                  {!!query && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Limpiar búsqueda"
                      onPress={() => {
                        reset();
                        searchRef.current?.focus();
                      }}
                      style={{ padding: 8 }}
                    >
                      <Feather name="x" size={18} color={C.muted} />
                    </Pressable>
                  )}
                </View>
                {!!query.trim() && (
                  <>
                    <Text style={styles.eyebrow}>OPCIONES DE VENTA</Text>
                    {matches.slice(0, limit).map((c) => result(c))}
                    {!matches.length && (
                      <Text style={styles.muted}>
                        No encontramos opciones disponibles con esa búsqueda.
                      </Text>
                    )}
                    {matches.length > limit && (
                      <Pressable onPress={() => setLimit(limit + 10)}>
                        <Text style={styles.link}>
                          Ver más opciones ({matches.length - limit})
                        </Text>
                      </Pressable>
                    )}
                    {variants.length > 0 && (
                      <>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setShowSpecific(!showSpecific)}
                          style={[styles.row, { paddingVertical: 10 }]}
                        >
                          <Text
                            style={[
                              styles.link,
                              { flex: 1, paddingVertical: 0 },
                            ]}
                          >
                            {showSpecific
                              ? "Ocultar variantes específicas"
                              : "Buscar una variante específica"}{" "}
                            ({variants.length})
                          </Text>
                          <Feather
                            name={showSpecific ? "chevron-up" : "chevron-down"}
                            size={16}
                            color={C.primary}
                          />
                        </Pressable>
                        {showSpecific &&
                          variants.slice(0, limit).map((c) => result(c, true))}
                        {showSpecific && variants.length > limit && (
                          <Pressable onPress={() => setLimit(limit + 10)}>
                            <Text style={styles.link}>Ver más variantes</Text>
                          </Pressable>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <View style={styles.row}>
                  <Text style={styles.heading}>
                    {editingId ? "Editar concepto" : "Agregar a la venta"}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Cambiar selección"
                    onPress={() => {
                      reset();
                      requestAnimationFrame(() => searchRef.current?.focus());
                    }}
                    style={{ padding: 7 }}
                  >
                    <Feather name="x" color={C.muted} size={20} />
                  </Pressable>
                </View>
                <View>
                  <Text style={styles.resultName}>{choice.name}</Text>
                  <Text style={styles.muted}>{choice.context}</Text>
                </View>
                {choice.tariffs.length === 1 && tariff ? (
                  <Text
                    style={{
                      color: C.primary,
                      fontSize: 20,
                      fontWeight: "800",
                    }}
                  >
                    {money(tariff.price)}{" "}
                    <Text style={{ fontSize: 13, fontWeight: "500" }}>
                      / {tariff.unit}
                    </Text>
                  </Text>
                ) : (
                  <View style={styles.wrap}>
                    {choice.tariffs.map((t) => (
                      <Pressable
                        key={t.key}
                        onPress={() => {
                          setTariffKey(t.key);
                          setValue("");
                        }}
                        style={[
                          styles.chip,
                          t.key === tariffKey && styles.selected,
                        ]}
                      >
                        <Text
                          style={
                            t.key === tariffKey ? styles.white : styles.price
                          }
                        >
                          {money(t.price)} / {t.unit}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                <View style={[styles.row, { gap: 6 }]}>
                  {[
                    ["quantity", "Por cantidad"],
                    ["amount", "Por importe"],
                  ].map(([mode, label]) => (
                    <Pressable
                      key={mode}
                      accessibilityRole="button"
                      accessibilityState={{ selected: s.mode === mode }}
                      disabled={m.busy}
                      onPress={async () => {
                        if (mode !== s.mode) {
                          await m.mode(mode);
                          setValue("");
                          focusValue();
                        }
                      }}
                      style={[
                        styles.chip,
                        { flex: 1, alignItems: "center", paddingVertical: 12 },
                        s.mode === mode && styles.selected,
                      ]}
                    >
                      <Text
                        style={s.mode === mode ? styles.white : styles.price}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View
                  style={[
                    styles.row,
                    {
                      borderColor: C.line,
                      borderWidth: 1,
                      borderRadius: 13,
                      paddingHorizontal: 14,
                    },
                  ]}
                >
                  <TextInput
                    ref={valueRef}
                    editable={!locked}
                    accessibilityLabel={
                      s.mode === "amount"
                        ? "Importe en pesos"
                        : `Cantidad en ${tariff?.unit || "unidad"}`
                    }
                    keyboardType="decimal-pad"
                    value={value}
                    onChangeText={setValue}
                    placeholder={
                      s.mode === "amount" ? "Importe en pesos" : "Cantidad"
                    }
                    placeholderTextColor={C.muted}
                    style={{
                      flex: 1,
                      fontSize: 26,
                      fontWeight: "700",
                      color: C.ink,
                      paddingVertical: 12,
                      minHeight: 58,
                    }}
                  />
                  <Text style={styles.muted}>
                    {s.mode === "amount" ? "MXN" : tariff?.unit}
                  </Text>
                </View>
                {preview && (
                  <Text style={styles.muted}>
                    {preview.entryMode === "amount" ? "≈ " : ""}
                    {Number(preview.quantity.toFixed(6))} {preview.unit} ·{" "}
                    <Text style={styles.price}>{money(preview.amount)}</Text>
                    {preview.discountRate ? " · Mayoreo 15 %" : ""}
                  </Text>
                )}
              </>
            )}
          </View>
          <View style={styles.row}>
            <Text style={styles.heading}>Venta en curso</Text>
            <Text style={styles.muted}>
              {s.draft.lines.length}{" "}
              {s.draft.lines.length === 1 ? "concepto" : "conceptos"}
            </Text>
          </View>
          {!s.draft.lines.length ? (
            <View
              style={{ alignItems: "center", paddingVertical: 28, gap: 10 }}
            >
              <Feather name="shopping-bag" size={28} color={C.cyan} />
              <Text style={styles.muted}>Busca un producto para comenzar.</Text>
            </View>
          ) : (
            <View style={styles.card}>
              {s.draft.lines.map((line) => (
                <View
                  key={line.id}
                  style={[styles.result, { paddingVertical: 9 }]}
                >
                  <View style={styles.row}>
                    <Text style={styles.resultName}>{line.name}</Text>
                    <Text style={styles.price}>{money(line.amount)}</Text>
                  </View>
                  <Text style={styles.muted}>
                    {line.entryMode === "amount" ? "≈ " : ""}
                    {Number(line.quantity.toFixed(6))} {line.unit} ·{" "}
                    {money(line.price)} / {line.unit}
                    {line.discountRate ? " · Mayoreo 15 %" : ""}
                  </Text>
                  <View
                    style={[
                      styles.row,
                      { justifyContent: "flex-end", gap: 20 },
                    ]}
                  >
                    <Pressable
                      disabled={locked || m.busy}
                      accessibilityRole="button"
                      accessibilityLabel={`Editar ${line.name}`}
                      onPress={() => edit(line)}
                    >
                      <Text style={styles.link}>Editar</Text>
                    </Pressable>
                    <Pressable
                      disabled={locked || m.busy}
                      accessibilityRole="button"
                      accessibilityLabel={`Eliminar ${line.name}`}
                      onPress={() => m.remove(line.id)}
                    >
                      <Text style={styles.danger}>Eliminar</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
          {s.draft.lines.length > 0 && (
            <>
              <Text style={styles.eyebrow}>FORMA DE PAGO</Text>
              <View style={styles.wrap}>
                {["Efectivo", "Transferencia", "Tarjeta"].map((payment) => (
                  <Pressable
                    key={payment}
                    disabled={locked || m.busy}
                    onPress={() => m.payment(payment)}
                    style={[
                      styles.chip,
                      s.draft.payment === payment && styles.selected,
                    ]}
                  >
                    <Text
                      style={
                        s.draft.payment === payment
                          ? styles.white
                          : styles.price
                      }
                    >
                      {payment}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable
                disabled={locked || m.busy}
                onPress={() =>
                  Alert.alert(
                    "Cancelar borrador",
                    "Se eliminarán únicamente los conceptos de esta venta sin registrar.",
                    [
                      { text: "Conservar", style: "cancel" },
                      {
                        text: "Cancelar borrador",
                        style: "destructive",
                        onPress: m.cancel,
                      },
                    ],
                  )
                }
              >
                <Text style={styles.danger}>Cancelar borrador</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
        <View style={styles.footer}>
          <TotalCard
            total={total(s.draft.lines)}
            compact
            pendingAmount={preview?.amount}
          />
          {!editable && s.draft.status !== "confirmed" && (
            <Text style={styles.muted}>
              Venta pendiente de confirmación. Consulta el resultado antes de
              editar.
            </Text>
          )}
          <View style={styles.row}>
            {choice && (
              <View style={{ flex: 1 }}>
                <ActionButton
                  disabled={locked || m.busy || !tariff || !value.trim()}
                  label={editingId ? "Guardar concepto" : "Agregar a la venta"}
                  icon={editingId ? "check" : "plus"}
                  onPress={add}
                  fullWidth
                />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <ActionButton
                disabled={
                  m.busy ||
                  !!choice ||
                  !s.draft.lines.length ||
                  s.draft.status === "confirmed"
                }
                label={
                  m.activity === "Enviando…" && m.busy
                    ? "Registrando…"
                    : ["unknown", "offline"].includes(s.draft.status)
                      ? "Consultar y reintentar"
                      : "Registrar venta"
                }
                icon="check"
                onPress={() => {
                  Keyboard.dismiss();
                  m.submit();
                }}
                fullWidth
                variant={choice ? "dark" : "primary"}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
