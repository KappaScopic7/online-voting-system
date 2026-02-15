// frontend/src/identity/utils/identityValidation.ts

export function looksLikeUuid(v: unknown) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        String(v ?? "").trim(),
    );
}

export function isPinValid(pin: string) {
    return /^\d{4}$/.test(pin);
}

export function hasWebNfc() {
    return typeof (window as any).NDEFReader !== "undefined";
}

export function isMobileBrowser() {
    const ua = navigator.userAgent ?? "";
    return /Android|iPhone|iPad|iPod/i.test(ua);
}

export function extractUuidFromNdef(event: any): string | null {
    const msg = event?.message;
    const records = msg?.records;
    if (!records || !Array.isArray(records)) return null;

    for (const rec of records) {
        try {
            if (rec.recordType === "text") {
                const encoding = rec.encoding ?? "utf-8";
                const text = rec.data
                    ? new TextDecoder(encoding).decode(rec.data)
                    : "";
                const v = String(text).trim();
                if (looksLikeUuid(v)) return v;
            }

            if (rec.recordType === "url") {
                const url = rec.data
                    ? new TextDecoder("utf-8").decode(rec.data)
                    : "";
                const m = String(url).match(
                    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
                );
                if (m?.[0]) return m[0];
            }
        } catch {
            // ignore
        }
    }
    return null;
}
