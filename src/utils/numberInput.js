export function sanitizeDecimalInput(value) {
    let cleaned = value.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");

    if (parts.length > 2) {
        cleaned = parts[0] + "." + parts.slice(1).join("");
    }
    return cleaned;
}