// frontend/src/shared/datetime/formatLocal.ts
export function formatLocal(iso: string) {
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}
