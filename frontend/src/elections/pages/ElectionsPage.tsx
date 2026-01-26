// frontend/src/elections/pages/ElectionsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchElections, type ElectionListItem } from "../api/elections";
import { useAuth } from "../../auth/AuthContext";
import {
    formatJST,
    statusLabel,
    statusRank,
} from "../../shared/elections/format";

type StatusFilter = "ALL" | "UPCOMING" | "ONGOING" | "ENDED";
type SortKey = "STATUS" | "STARTS_AT" | "ENDS_AT" | "TITLE";

export function ElectionsPage() {
    const { me, isLoading: authLoading } = useAuth();
    const loc = useLocation();
    const from = loc.pathname + loc.search;

    const [items, setItems] = useState<ElectionListItem[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // UI controls (仮)
    const [q, setQ] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [onlyCanCast, setOnlyCanCast] = useState(false);
    const [onlyHasResult, setOnlyHasResult] = useState(false);
    const [sortKey, setSortKey] = useState<SortKey>("STATUS");

    const load = async () => {
        setError(null);
        setIsLoading(true);
        try {
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
        if (onlyCanCast) arr = arr.filter((e) => e.canCast);
        if (onlyHasResult) arr = arr.filter((e) => e.hasResult);

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
    }, [items, q, statusFilter, onlyCanCast, onlyHasResult, sortKey]);

    const isDev = import.meta.env?.DEV;

    return (
        <div style={{ padding: 12, display: "grid", gap: 12}}>
            {/* Header */}
            <header
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                }}
            >

                <h2 style={{ margin: 0 }}>選挙一覧</h2>

                <button onClick={load} disabled={isLoading}>
                    {isLoading ? "Reloading..." : "再読み込み"}
                </button>

                <div
                    style={{
                        marginLeft: "auto",
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    {authLoading ? (
                        <span style={{ fontSize: 12, opacity: 0.75 }}>
                            認証確認中...
                        </span>
                    ) : !me ? (
                        <>
                            <span style={{ fontSize: 12, opacity: 0.75 }}>
                                ログインすると投票できます
                            </span>
                            <Link to="/login" state={{ from }}>
                                ログイン
                            </Link>
                        </>
                    ) : (
                        <span style={{ fontSize: 12, opacity: 0.75 }}>
                            ログイン中
                        </span>
                    )}
                </div>
            </header>

            {/* Controls */}
            <section
                style={{
                    padding: 12,
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    display: "grid",
                    gap: 10,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="タイトル検索"
                        style={{ flex: 1, minWidth: 220 }}
                    />

                    <label
                        style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                        }}
                    >
                        <span style={{ fontSize: 12, opacity: 0.8 }}>状態</span>
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
                    </label>

                    <label
                        style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={onlyCanCast}
                            onChange={(e) => setOnlyCanCast(e.target.checked)}
                        />
                        <span style={{ fontSize: 12, opacity: 0.8 }}>
                            投票可能のみ
                        </span>
                    </label>

                    <label
                        style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={onlyHasResult}
                            onChange={(e) => setOnlyHasResult(e.target.checked)}
                        />
                        <span style={{ fontSize: 12, opacity: 0.8 }}>
                            結果ありのみ
                        </span>
                    </label>

                    <label
                        style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                        }}
                    >
                        <span style={{ fontSize: 12, opacity: 0.8 }}>
                            並び替え
                        </span>
                        <select
                            value={sortKey}
                            onChange={(e) =>
                                setSortKey(e.target.value as SortKey)
                            }
                        >
                            <option value="STATUS">状態（開催中優先）</option>
                            <option value="STARTS_AT">開始日時</option>
                            <option value="ENDS_AT">終了日時</option>
                            <option value="TITLE">タイトル</option>
                        </select>
                    </label>
                </div>
            </section>

            {/* Error */}
            {error && (
                <div
                    role="alert"
                    style={{ padding: 8, border: "1px solid #ccc" }}
                >
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            flexWrap: "wrap",
                        }}
                    >
                        <span>{error}</span>
                        <button onClick={load} style={{ marginLeft: "auto" }}>
                            再試行
                        </button>
                    </div>
                </div>
            )}

            {/* List */}
            {filtered === null ? (
                <p>Loading...</p>
            ) : filtered.length === 0 ? (
                <div
                    style={{
                        padding: 12,
                        border: "1px solid #ddd",
                        borderRadius: 8,
                    }}
                >
                    <p style={{ marginTop: 0 }}>選挙がありません</p>
                    <p style={{ marginBottom: 0, opacity: 0.8, fontSize: 13 }}>
                        条件を変えるか、管理者に確認してください。
                    </p>
                </div>
            ) : (
                <div style={{ display: "grid", gap: 12 }}>
                    {filtered.map((e) => {
                        const voted = !!e.currentVote;
                        return (
                            <div
                                key={e.electionId}
                                style={{
                                    border: "1px solid #ddd",
                                    borderRadius: 8,
                                    padding: 12,
                                    display: "grid",
                                    gap: 8,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        gap: 12,
                                        alignItems: "center",
                                    }}
                                >
                                    <strong style={{ fontSize: 16 }}>
                                        {e.title}
                                    </strong>
                                    <span
                                        style={{
                                            fontSize: 12,
                                            padding: "2px 8px",
                                            border: "1px solid #ccc",
                                            borderRadius: 999,
                                        }}
                                    >
                                        {statusLabel(e.status)}
                                    </span>
                                </div>

                                <div style={{ fontSize: 13, opacity: 0.85 }}>
                                    <div>開始: {formatJST(e.startsAt)}</div>
                                    <div>終了: {formatJST(e.endsAt)}</div>
                                </div>

                                <div style={{ fontSize: 13 }}>
                                    候補者数: {e.candidateCount}
                                    {voted ? (
                                        <span style={{ marginLeft: 12 }}>
                                            現在の投票:{" "}
                                            {e.currentVote?.candidateName ??
                                                `候補ID: ${e.currentVote?.candidateId}`}
                                        </span>
                                    ) : (
                                        <span
                                            style={{
                                                marginLeft: 12,
                                                opacity: 0.6,
                                            }}
                                        >
                                            現在の投票: なし
                                        </span>
                                    )}
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        gap: 12,
                                        flexWrap: "wrap",
                                        alignItems: "center",
                                    }}
                                >
                                    <Link
                                        to={`/elections/${e.electionId}/candidates`}
                                    >
                                        候補者一覧
                                    </Link>

                                    {e.hasResult ? (
                                        <Link
                                            to={`/elections/${e.electionId}/result`}
                                        >
                                            結果
                                        </Link>
                                    ) : (
                                        <span style={{ opacity: 0.5 }}>
                                            結果（未公開）
                                        </span>
                                    )}

                                    <span style={{ marginLeft: "auto" }}>
                                        {!me ? (
                                            <Link to="/login" state={{ from }}>
                                                ログインして投票
                                            </Link>
                                        ) : e.canCast ? (
                                            <Link
                                                to={`/voting/start?electionId=${e.electionId}`}
                                                state={{ from }}
                                            >
                                                <b>投票する →</b>
                                            </Link>
                                        ) : (
                                            <span style={{ opacity: 0.5 }}>
                                                投票不可
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {isDev && (
                <details>
                    <summary>Debug</summary>
                    <pre style={{ whiteSpace: "pre-wrap" }}>
                        {JSON.stringify({ items, error, me }, null, 2)}
                    </pre>
                </details>
            )}
        </div>
    );
}
