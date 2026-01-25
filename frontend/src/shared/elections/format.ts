// frontend/src/shared/elections/format.ts
export function formatJST(iso?: string | null): string {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}/${m}/${day} ${hh}:${mm}`;
}

export function statusLabel(status: string): string {
    switch (status) {
        case "UPCOMING":
            return "予定";
        case "ONGOING":
            return "開催中";
        case "ENDED":
            return "終了";
        default:
            return status;
    }
}

export function statusRank(status?: string | null): number {
    const s = status ?? "";
    return s === "ONGOING" ? 0 : s === "UPCOMING" ? 1 : s === "ENDED" ? 2 : 9;
}
