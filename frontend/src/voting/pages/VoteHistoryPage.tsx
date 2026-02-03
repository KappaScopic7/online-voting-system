// frontend/src/voting/pages/VoteHistoryPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchVoteHistory, type VoteHistoryItem } from "../api/votes";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { normalizeFrom } from "../../shared/normalizeFrom";

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

type LocationState = { from?: string } | null;

function VoteRow({ v }: { v: VoteHistoryItem }) {
    const [hover, setHover] = useState(false);
    const isDev = import.meta.env?.DEV;

    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 12,
                display: "flex",
                gap: 12,
                alignItems: "baseline",
                flexWrap: "wrap",
                background: hover ? "#fafafa" : "#fff",
                transition: "background 120ms ease",
            }}
        >
            <span style={{ width: 160, fontSize: 12, opacity: 0.8 }}>
                {formatJST(v.castedAt)}
            </span>

            <span>
                投票先: <strong>{v.candidateName}</strong>
            </span>

            {isDev && (
                <span
                    style={{ marginLeft: "auto", fontSize: 12, opacity: 0.7 }}
                >
                    voteId: {v.voteId}
                </span>
            )}
        </div>
    );
}

export function VoteHistoryPage() {
    const [items, setItems] = useState<VoteHistoryItem[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const loc = useLocation();
    const state = (loc.state as LocationState) ?? null;

    const backTo = normalizeFrom(state?.from ?? "/me");
    const from = loc.pathname + loc.search;

    // UI control
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
            setItems([]); // 画面は空扱いにする
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

        // 各グループ内：新しい順
        for (const g of map.values()) {
            g.items.sort((a, b) =>
                (b.castedAt ?? "").localeCompare(a.castedAt ?? ""),
            );
        }

        // グループ：最新投票が新しい順
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

    const totalVotes = items?.length ?? 0;
    const totalGroups = groups.length;

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>投票履歴</h1>}
            actions={
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <Link to={backTo}>← 戻る</Link>

                    <button
                        onClick={load}
                        disabled={isLoading}
                        style={{ marginLeft: 8 }}
                    >
                        {isLoading ? "Reloading..." : "再読み込み"}
                    </button>
                </div>
            }
            maxWidth={920}
        >
            <Card>
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
                        style={{ flex: 1, minWidth: 240, padding: 8 }}
                    />
                    <span style={{ fontSize: 12, opacity: 0.75 }}>
                        合計 {totalVotes} 件（{totalGroups} 選挙）
                    </span>
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
                            <div style={{ fontWeight: 800 }}>エラー</div>
                            <div style={{ opacity: 0.9 }}>{error}</div>
                        </div>
                        <button onClick={load} style={{ marginLeft: "auto" }}>
                            再試行
                        </button>
                    </div>
                </Card>
            )}

            {items === null ? (
                <Card>読み込み中…</Card>
            ) : items.length === 0 ? (
                <Card>
                    <p style={{ margin: 0 }}>投票履歴はありません</p>
                </Card>
            ) : filteredGroups.length === 0 ? (
                <Card>
                    <p style={{ margin: 0 }}>該当する履歴が見つかりません</p>
                </Card>
            ) : (
                <div style={{ display: "grid", gap: 12 }}>
                    {filteredGroups.map((g) => {
                        const latest = g.items[0];

                        return (
                            <Card key={g.electionId}>
                                <div style={{ display: "grid", gap: 10 }}>
                                    {/* header */}
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: 12,
                                            flexWrap: "wrap",
                                            alignItems: "baseline",
                                        }}
                                    >
                                        <strong style={{ fontSize: 16 }}>
                                            <Link
                                                to={`/elections/${g.electionId}`}
                                                state={{ from }}
                                            >
                                                {g.electionTitle}
                                            </Link>
                                        </strong>

                                        <span
                                            style={{
                                                fontSize: 12,
                                                opacity: 0.75,
                                            }}
                                        >
                                            回数: {g.items.length}
                                        </span>
                                    </div>

                                    <div
                                        style={{ fontSize: 12, opacity: 0.75 }}
                                    >
                                        最新:{" "}
                                        {formatJST(latest?.castedAt ?? null)}
                                    </div>

                                    {/* rows */}
                                    <div style={{ display: "grid", gap: 10 }}>
                                        {g.items.map((v) => (
                                            <VoteRow key={v.voteId} v={v} />
                                        ))}
                                    </div>

                                    {/* actions */}
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 12,
                                            flexWrap: "wrap",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Link
                                            to={`/elections/${g.electionId}/candidates`}
                                            state={{ from }}
                                        >
                                            候補者（公開）
                                        </Link>

                                        {/* ★ 結果は入口へ統一 */}
                                        <Link
                                            to={`/elections/result?electionId=${g.electionId}`}
                                            state={{ from }}
                                        >
                                            結果
                                        </Link>

                                        <span style={{ marginLeft: "auto" }}>
                                            {latest?.electionStatus ===
                                            "ONGOING" ? (
                                                /* ★ 投票変更も入口へ統一 */
                                                <Link
                                                    to={`/voting/entry?electionId=${g.electionId}`}
                                                    state={{ from }}
                                                >
                                                    <b>投票を変更する →</b>
                                                </Link>
                                            ) : (
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        opacity: 0.6,
                                                    }}
                                                >
                                                    投票期間終了
                                                </span>
                                            )}
                                        </span>
                                    </div>

                                    <div
                                        style={{ fontSize: 12, opacity: 0.65 }}
                                    >
                                        ※
                                        結果が未公開の場合、結果ページで「未公開」表示になります。
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            <DevDebug
                value={{
                    itemsLen: items?.length ?? null,
                    error,
                    groupsLen: groups.length,
                    filteredGroupsLen: filteredGroups.length,
                    backTo,
                    from,
                    q,
                    isLoading,
                }}
            />
        </Page>
    );
}
