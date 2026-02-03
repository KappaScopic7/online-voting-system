// frontend/src/elections/pages/ElectionsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchElections } from "../api/elections";
import type { ElectionListItem } from "../model/electionTypes";
import { useAuth } from "../../user/UserAuthContext";
import {
    formatJST,
    statusLabel,
    statusRank,
} from "../../shared/elections/format";
import { Card, DevDebug, Page } from "../../shared/ui/page";

type StatusFilter = "ALL" | "UPCOMING" | "ONGOING" | "ENDED";
type SortKey = "STATUS" | "STARTS_AT" | "ENDS_AT" | "TITLE";

function ElectionItemCard({
    e,
    from,
    meExists,
}: {
    e: ElectionListItem;
    from: string;
    meExists: boolean;
}) {
    const voted = !!e.currentVote;

    const [hover, setHover] = useState(false);

    const statusPillStyle: React.CSSProperties = {
        fontSize: 12,
        padding: "2px 10px",
        border: "1px solid #eee",
        borderRadius: 999,
        background: "#fafafa",
        whiteSpace: "nowrap",
        opacity: 0.95,
    };

    const action = (() => {
        if (e.status === "ONGOING") {
            if (!meExists) {
                return (
                    <Link
                        to="/login"
                        state={{ from }}
                        style={{ textDecoration: "none" }}
                    >
                        <b>ログインして投票 →</b>
                    </Link>
                );
            }

            if (e.canCast) {
                return (
                    <span
                        style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                        }}
                    >
                        <Link
                            to={`/voting/start?electionId=${e.electionId}`}
                            state={{ from }}
                            style={{ textDecoration: "none" }}
                        >
                            <b>通常投票 →</b>
                        </Link>

                        <Link
                            to={`/alloc-voting/start?electionId=${e.electionId}`}
                            state={{ from }}
                            style={{ textDecoration: "none" }}
                        >
                            <b>配分投票 →</b>
                        </Link>
                    </span>
                );
            }

            return <span style={{ opacity: 0.6 }}>投票不可</span>;
        }

        if (e.status === "ENDED") {
            if (e.hasResult) {
                return (
                    <Link
                        to={`/elections/${e.electionId}/result`}
                        state={{ from }}
                        style={{ textDecoration: "none" }}
                    >
                        結果を見る →
                    </Link>
                );
            }
            return <span style={{ opacity: 0.6 }}>終了（結果未公開）</span>;
        }

        return <span style={{ opacity: 0.6 }}>開始前</span>;
    })();

    return (
        <Card>
            <div
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                style={{
                    border: "1px solid #eee",
                    borderRadius: 12,
                    padding: 12,
                    display: "grid",
                    gap: 10,
                    background: hover ? "#fafafa" : "#fff",
                    transition: "background 120ms ease",
                }}
            >
                {/* top row */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <strong style={{ fontSize: 16 }}>
                        <Link
                            to={`/elections/${e.electionId}`}
                            state={{ from }}
                            style={{ textDecoration: "none", color: "inherit" }}
                        >
                            {e.title}
                        </Link>
                    </strong>

                    <span style={statusPillStyle}>{statusLabel(e.status)}</span>
                </div>

                {/* dates */}
                <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.6 }}>
                    <div>開始: {formatJST(e.startsAt)}</div>
                    <div>終了: {formatJST(e.endsAt)}</div>
                </div>

                {/* meta */}
                <div
                    style={{
                        fontSize: 13,
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <span>候補者数: {e.candidateCount}</span>
                    {voted ? (
                        <span>
                            現在の投票:{" "}
                            {e.currentVote?.candidateName ?? "投票済み"}
                        </span>
                    ) : (
                        <span style={{ opacity: 0.6 }}>現在の投票: なし</span>
                    )}
                </div>

                {/* links row */}
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
                        state={{ from }}
                    >
                        候補者一覧
                    </Link>

                    {e.hasResult ? (
                        <Link
                            to={`/elections/${e.electionId}/result`}
                            state={{ from }}
                        >
                            結果
                        </Link>
                    ) : (
                        <span style={{ opacity: 0.5 }}>結果（未公開）</span>
                    )}

                    <span style={{ marginLeft: "auto" }}>{action}</span>
                </div>
            </div>
        </Card>
    );
}

export function ElectionsPage() {
    const { me, isLoading: authLoading } = useAuth();

    const loc = useLocation();
    const from = loc.pathname + loc.search;

    const [items, setItems] = useState<ElectionListItem[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // UI controls
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
            setItems([]); // 画面は空扱いにする（error card で理由は見せる）
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            return (a.title ?? "").localeCompare(b.title ?? "");
        });

        return arr;
    }, [items, q, statusFilter, onlyCanCast, onlyHasResult, sortKey]);

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>選挙一覧</h1>}
            actions={
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <button onClick={load} disabled={isLoading}>
                        {isLoading ? "Reloading..." : "再読み込み"}
                    </button>

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
            }
        >
            <Card>
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
            </Card>

            {error && (
                <Card role="alert">
                    <div
                        style={{
                            display: "flex",
                            gap: 12,
                            alignItems: "center",
                            flexWrap: "wrap",
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: 700 }}>エラー</div>
                            <div style={{ opacity: 0.9 }}>{error}</div>
                        </div>
                        <button onClick={load} style={{ marginLeft: "auto" }}>
                            再試行
                        </button>
                    </div>
                </Card>
            )}

            {filtered === null ? (
                <Card>読み込み中…</Card>
            ) : filtered.length === 0 ? (
                <Card>
                    <p style={{ marginTop: 0, marginBottom: 6 }}>
                        選挙がありません
                    </p>
                    <p style={{ margin: 0, opacity: 0.8, fontSize: 13 }}>
                        条件を変えるか、管理者に確認してください。
                    </p>
                </Card>
            ) : (
                <div style={{ display: "grid", gap: 12 }}>
                    {filtered.map((e) => (
                        <ElectionItemCard
                            key={e.electionId}
                            e={e}
                            from={from}
                            meExists={!!me}
                        />
                    ))}
                </div>
            )}

            <DevDebug
                value={{
                    items,
                    error,
                    isLoading,
                    filteredLen: filtered?.length ?? null,
                }}
            />
        </Page>
    );
}
