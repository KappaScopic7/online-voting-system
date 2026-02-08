// frontend/src/shared/components/ElectionListView.tsx
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

export type ElectionListLike = {
    electionId: string;
    title?: string | null;
    status: "UPCOMING" | "ONGOING" | "ENDED" | string;
    startsAt?: string | null;
    endsAt?: string | null;
};

type StatusFilter = "ALL" | "UPCOMING" | "ONGOING" | "ENDED";
type SortKey = "STATUS" | "STARTS_AT" | "ENDS_AT" | "TITLE";

function formatJST(iso?: string | null): string {
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

function statusLabel(status: string): string {
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

export function ElectionListView(props: {
    title: string;
    items: ElectionListLike[] | null; // null: loading
    error?: string | null;
    isLoading?: boolean;
    onReload?: () => void;

    detailsHref: (e: ElectionListLike) => string;
    renderRowActions?: (e: ElectionListLike) => ReactNode;
}) {
    const {
        title,
        items,
        error,
        isLoading,
        onReload,
        detailsHref,
        renderRowActions,
    } = props;

    const [q, setQ] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [sortKey, setSortKey] = useState<SortKey>("STATUS");

    const filtered = useMemo(() => {
        if (!items) return null;

        const keyword = q.trim().toLowerCase();
        let arr = items.slice();

        if (statusFilter !== "ALL")
            arr = arr.filter((e) => e.status === statusFilter);

        if (keyword) {
            arr = arr.filter((e) =>
                (e.title ?? "").toLowerCase().includes(keyword),
            );
        }

        const rank = (s?: string) =>
            s === "ONGOING" ? 0 : s === "UPCOMING" ? 1 : s === "ENDED" ? 2 : 9;

        arr.sort((a, b) => {
            if (sortKey === "STATUS") {
                const r = rank(a.status) - rank(b.status);
                if (r !== 0) return r;
                return (a.startsAt ?? "").localeCompare(b.startsAt ?? "");
            }
            if (sortKey === "STARTS_AT")
                return (a.startsAt ?? "").localeCompare(b.startsAt ?? "");
            if (sortKey === "ENDS_AT")
                return (a.endsAt ?? "").localeCompare(b.endsAt ?? "");
            if (sortKey === "TITLE")
                return (a.title ?? "").localeCompare(b.title ?? "");
            return 0;
        });

        return arr;
    }, [items, q, statusFilter, sortKey]);

    return (
        <div>
            <header
                style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                <h3 style={{ margin: 0 }}>{title}</h3>
                {onReload && (
                    <button onClick={onReload} disabled={!!isLoading}>
                        {isLoading ? "Reloading..." : "Reload"}
                    </button>
                )}
            </header>

            <section
                style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginTop: 12,
                }}
            >
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="タイトル検索"
                />
                <select
                    value={statusFilter}
                    onChange={(e) =>
                        setStatusFilter(e.target.value as StatusFilter)
                    }
                >
                    <option value="ALL">すべて</option>
                    <option value="ONGOING">開催中</option>
                    <option value="UPCOMING">予定</option>
                    <option value="ENDED">終了</option>
                </select>
                <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as SortKey)}
                >
                    <option value="STATUS">状態</option>
                    <option value="STARTS_AT">開始日時</option>
                    <option value="ENDS_AT">終了日時</option>
                    <option value="TITLE">タイトル</option>
                </select>
            </section>

            {error && (
                <div role="alert" style={{ marginTop: 12 }}>
                    {error}
                </div>
            )}

            {items === null ? (
                <p style={{ marginTop: 12 }}>Loading...</p>
            ) : filtered && filtered.length === 0 ? (
                <p style={{ marginTop: 12 }}>選挙がありません</p>
            ) : (
                <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                    {filtered!.map((e) => (
                        <div
                            key={e.electionId}
                            style={{
                                border: "1px solid #ddd",
                                borderRadius: 8,
                                padding: 12,
                            }}
                        >
                            <strong>{e.title}</strong>
                            <div>{statusLabel(e.status)}</div>
                            <div>開始: {formatJST(e.startsAt)}</div>
                            <div>終了: {formatJST(e.endsAt)}</div>

                            <div
                                style={{
                                    display: "flex",
                                    gap: 12,
                                    alignItems: "center",
                                    marginTop: 8,
                                    flexWrap: "wrap",
                                }}
                            >
                                <Link to={detailsHref(e)}>詳細へ →</Link>
                                {renderRowActions?.(e)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
