// voting/pages/VoteHistoryPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchVoteHistory, type VoteHistoryItem } from "../api/votes";

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

type Group = {
    electionId: string;
    electionTitle: string;
    items: VoteHistoryItem[];
};

export function VoteHistoryPage() {
    const [items, setItems] = useState<VoteHistoryItem[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // UI control（仮）
    const [q, setQ] = useState("");

    const load = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const data = await fetchVoteHistory();
            setItems(data);
        } catch (err: any) {
            setError(
                err?.response?.data?.message ?? "Failed to load vote history",
            );
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const groups: Group[] = useMemo(() => {
        if (!items) return [];
        const map = new Map<string, Group>();

        for (const v of items) {
            const key = v.electionId;
            if (!map.has(key)) {
                map.set(key, {
                    electionId: v.electionId,
                    electionTitle: v.electionTitle,
                    items: [],
                });
            }
            map.get(key)!.items.push(v);
        }

        return Array.from(map.values()).sort((a, b) => {
            const at = a.items[0]?.castedAt ?? "";
            const bt = b.items[0]?.castedAt ?? "";
            return bt.localeCompare(at);
        });
    }, [items]);

    const filteredGroups = useMemo(() => {
        const keyword = q.trim().toLowerCase();
        if (!keyword) return groups;

        return groups
            .map((g) => {
                const hitElection = (g.electionTitle ?? "")
                    .toLowerCase()
                    .includes(keyword);
                const hitItems = g.items.filter((v) =>
                    (v.candidateName ?? "").toLowerCase().includes(keyword),
                );
                if (hitElection) return g; // 選挙名ヒットなら全表示
                if (hitItems.length === 0) return null;
                return { ...g, items: hitItems };
            })
            .filter((x): x is Group => x !== null);
    }, [groups, q]);

    const totalVotes = useMemo(() => items?.length ?? 0, [items]);
    const totalGroups = useMemo(() => groups.length, [groups]);

    const isDev = import.meta.env?.DEV;

    return (
        <div style={{ padding: 16, display: "grid", gap: 12, maxWidth: 920 }}>
            <header
                style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                <Link to="/me">← 戻る</Link>
                <h2 style={{ margin: 0 }}>投票履歴</h2>

                <button
                    onClick={load}
                    style={{ marginLeft: "auto" }}
                    disabled={isLoading}
                >
                    {isLoading ? "Reloading..." : "Reload"}
                </button>
            </header>

            <div
                style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="検索（選挙名 / 候補者名）"
                    style={{ flex: 1, minWidth: 240 }}
                />
                <span style={{ fontSize: 12, opacity: 0.75 }}>
                    合計 {totalVotes} 件（{totalGroups} 選挙）
                </span>
            </div>

            {error && (
                <div
                    style={{
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        padding: 12,
                    }}
                    role="alert"
                >
                    <div
                        style={{
                            display: "flex",
                            gap: 12,
                            alignItems: "center",
                            flexWrap: "wrap",
                        }}
                    >
                        <p style={{ margin: 0 }}>{error}</p>
                        <button onClick={load} style={{ marginLeft: "auto" }}>
                            再試行
                        </button>
                    </div>
                </div>
            )}

            {items === null ? (
                <p>Loading...</p>
            ) : items.length === 0 ? (
                <div
                    style={{
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        padding: 12,
                    }}
                >
                    <p style={{ margin: 0 }}>投票履歴はありません</p>
                </div>
            ) : filteredGroups.length === 0 ? (
                <div
                    style={{
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        padding: 12,
                    }}
                >
                    <p style={{ margin: 0 }}>該当する履歴が見つかりません</p>
                </div>
            ) : (
                <div style={{ display: "grid", gap: 12 }}>
                    {filteredGroups.map((g) => {
                        const latest = g.items[0];
                        return (
                            <section
                                key={g.electionId}
                                style={{
                                    border: "1px solid #ddd",
                                    borderRadius: 10,
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
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <strong style={{ fontSize: 16 }}>
                                        {g.electionTitle}
                                    </strong>
                                    <span style={{ opacity: 0.85 }}>
                                        回数: {g.items.length}
                                    </span>
                                </div>

                                <div style={{ fontSize: 13, opacity: 0.8 }}>
                                    最新: {formatJST(latest?.castedAt ?? null)}
                                </div>

                                <div
                                    style={{
                                        display: "grid",
                                        gap: 6,
                                        marginTop: 4,
                                    }}
                                >
                                    {g.items.map((v) => (
                                        <div
                                            key={v.voteId}
                                            style={{
                                                borderTop: "1px dashed #ddd",
                                                paddingTop: 8,
                                                display: "flex",
                                                gap: 12,
                                                alignItems: "baseline",
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width: 150,
                                                    fontSize: 12,
                                                    opacity: 0.85,
                                                }}
                                            >
                                                {formatJST(v.castedAt)}
                                            </span>
                                            <span>
                                                投票先:{" "}
                                                <strong>
                                                    {v.candidateName}
                                                </strong>
                                            </span>

                                            {/* 本番はJSON全表示しない（DEVのみ） */}
                                            {isDev && (
                                                <details
                                                    style={{
                                                        marginLeft: "auto",
                                                    }}
                                                >
                                                    <summary
                                                        style={{
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        詳細
                                                    </summary>
                                                    <pre
                                                        style={{
                                                            whiteSpace:
                                                                "pre-wrap",
                                                            margin: 0,
                                                        }}
                                                    >
                                                        {JSON.stringify(
                                                            v,
                                                            null,
                                                            2,
                                                        )}
                                                    </pre>
                                                </details>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div
                                    style={{
                                        marginTop: 8,
                                        display: "flex",
                                        gap: 12,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <Link
                                        to={`/elections/${g.electionId}/candidates`}
                                    >
                                        候補者（公開）
                                    </Link>
                                    <Link
                                        to={`/elections/${g.electionId}/result`}
                                    >
                                        結果
                                    </Link>
                                </div>

                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: 12,
                                        opacity: 0.65,
                                    }}
                                >
                                    ※
                                    結果が未公開の場合、結果ページで「未公開」表示になります。
                                </p>
                            </section>
                        );
                    })}
                </div>
            )}

            {isDev && (
                <details>
                    <summary>Debug</summary>
                    <pre style={{ whiteSpace: "pre-wrap" }}>
                        {JSON.stringify(
                            { items, error, groups, filteredGroups },
                            null,
                            2,
                        )}
                    </pre>
                </details>
            )}
        </div>
    );
}
