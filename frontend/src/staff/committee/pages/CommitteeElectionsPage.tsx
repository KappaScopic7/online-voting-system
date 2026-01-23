// committee/pages/CommitteeElectionsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    fetchElections,
    type ElectionListItem,
} from "../../../elections/api/elections";
import { useStaffAuth } from "../../../staff/StaffAuthContext";

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

type StatusFilter = "ALL" | "UPCOMING" | "ONGOING" | "ENDED";
type SortKey = "STATUS" | "STARTS_AT" | "ENDS_AT" | "TITLE";

export function CommitteeElectionsPage() {
    const { staff } = useStaffAuth();

    const [items, setItems] = useState<ElectionListItem[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // filters
    const [q, setQ] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [sortKey, setSortKey] = useState<SortKey>("STATUS");

    const load = async () => {
        setError(null);
        setIsLoading(true);
        try {
            // ※ 将来は「委員会担当選挙のみ」の API に差し替える
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
    };

    useEffect(() => {
        load();
    }, []);

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
            const rank = (s?: string) =>
                s === "ONGOING" ? 0 : s === "UPCOMING" ? 1 : 2;

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
            {/* Header */}
            <header>
                <h3>担当選挙一覧</h3>

                <button onClick={load} disabled={isLoading}>
                    {isLoading ? "Reloading..." : "Reload"}
                </button>

                {staff && (
                    <span style={{ fontSize: 12, opacity: 0.7 }}>
                        {staff.role} としてログイン中
                    </span>
                )}
            </header>

            {/* Filters */}
            <section>
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
            {error && <div role="alert">{error}</div>}

            {/* List */}
            {filtered === null ? (
                <p>Loading...</p>
            ) : filtered.length === 0 ? (
                <p>担当選挙がありません</p>
            ) : (
                <div>
                    {filtered.map((e) => (
                        <div key={e.electionId}>
                            <strong>{e.title}</strong>
                            <div>{statusLabel(e.status)}</div>
                            <div>開始: {formatJST(e.startsAt)}</div>
                            <div>終了: {formatJST(e.endsAt)}</div>

                            <div>
                                <Link
                                    to={`/committee/elections/${e.electionId}`}
                                >
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
