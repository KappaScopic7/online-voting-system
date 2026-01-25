// frontend/src/admin/pages/AdminElectionsPage.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    fetchElections,
    type ElectionListItem,
} from "../../elections/api/elections";
import { useStaffAuth } from "../../staff/StaffAuthContext";
import {
    formatJST,
    statusLabel,
    statusRank,
} from "../../shared/elections/format";

type StatusFilter = "ALL" | "UPCOMING" | "ONGOING" | "ENDED";
type SortKey = "STATUS" | "STARTS_AT" | "ENDS_AT" | "TITLE";

export function AdminElectionsPage() {
    const { staff } = useStaffAuth();

    const [items, setItems] = useState<ElectionListItem[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [q, setQ] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [sortKey, setSortKey] = useState<SortKey>("STATUS");

    const load = useCallback(async () => {
        setError(null);
        setIsLoading(true);
        try {
            // TODO: 将来は admin 専用 API（staff token）に差し替え
            const data = await fetchElections();
            setItems(data);
        } catch (err: any) {
            setError(
                err?.response?.data?.message ?? "Failed to load elections",
            );
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

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

        arr.sort((a, b) => {
            if (sortKey === "STATUS") {
                const r = statusRank(a.status) - statusRank(b.status);
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
            {/* Header */}
            <header
                style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                <h3 style={{ margin: 0 }}>選挙管理</h3>

                <button onClick={load} disabled={isLoading}>
                    {isLoading ? "Reloading..." : "Reload"}
                </button>

                {/* 将来用：作成 */}
                <button type="button" disabled>
                    + 新規作成（予定）
                </button>

                <span
                    style={{ fontSize: 12, opacity: 0.7, marginLeft: "auto" }}
                >
                    {staff ? `${staff.role} としてログイン中` : "未ログイン"}
                </span>
            </header>

            {/* Filters */}
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

            {/* Error */}
            {error && (
                <div role="alert" style={{ marginTop: 12 }}>
                    {error}
                </div>
            )}

            {/* List */}
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

                            <div style={{ marginTop: 8 }}>
                                <Link to={`/admin/elections/${e.electionId}`}>
                                    管理画面へ →
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
