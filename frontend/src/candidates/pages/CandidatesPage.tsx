// frontend/src/candidates/pages/CandidatesPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { CandidateItem } from "../model/candidateTypes";
import type { ElectionListItem } from "../../elections/model/electionTypes";
import { fetchCandidates } from "../api/candidates";
import { fetchElections } from "../../elections/api/elections";
import { normalizeFrom } from "../../shared/normalizeFrom";

type LocationState = { from?: string };

type ElectionMeta = {
    title: string;
    startsAt?: string;
    endsAt?: string;
    status?: string;
};

export function CandidatesPage() {
    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;

    const backTo = normalizeFrom(state.from ?? "/");
    const from = loc.pathname + loc.search;

    const [items, setItems] = useState<CandidateItem[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // election meta (id -> title, etc.)
    const [electionMetaById, setElectionMetaById] = useState<
        Record<string, ElectionMeta>
    >({});

    // filters (server-side: electionId/partyKey, local: q)
    const [electionId, setElectionId] = useState("");
    const [partyKey, setPartyKey] = useState("");
    const [q, setQ] = useState("");

    const isDev = import.meta.env?.DEV;

    const load = async () => {
        setError(null);
        setIsLoading(true);

        try {
            // candidates + elections meta を並列取得
            const [cands, elections] = await Promise.all([
                fetchCandidates({
                    electionId: electionId.trim() || undefined,
                    partyKey: partyKey.trim() || undefined,
                }),
                fetchElections(), // 公開GET
            ]);

            setItems(cands);

            // id -> meta
            const map: Record<string, ElectionMeta> = {};
            (elections as ElectionListItem[]).forEach((e) => {
                map[e.electionId] = {
                    title: e.title,
                    startsAt: e.startsAt,
                    endsAt: e.endsAt,
                    status: e.status,
                };
            });
            setElectionMetaById(map);
        } catch (err: any) {
            setError(
                err?.response?.data?.message ?? "Failed to load candidates",
            );
            setItems([]);
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
        const qq = q.trim().toLowerCase();
        if (!qq) return items;
        return items.filter((c) => {
            const name = (c.name ?? "").toLowerCase();
            const title = (c.title ?? "").toLowerCase();
            return name.includes(qq) || title.includes(qq);
        });
    }, [items, q]);

    // electionId ごとにグルーピング
    const groups = useMemo(() => {
        if (!filtered) return null;

        const m = new Map<string, CandidateItem[]>();
        for (const c of filtered) {
            const key = c.electionId;
            if (!m.has(key)) m.set(key, []);
            m.get(key)!.push(c);
        }

        // 見た目の順序：選挙タイトル（あれば）→ electionId
        const entries = Array.from(m.entries()).map(([id, list]) => ({
            electionId: id,
            list: [...list].sort((a, b) => a.sortOrder - b.sortOrder),
        }));

        entries.sort((a, b) => {
            const ta = electionMetaById[a.electionId]?.title ?? a.electionId;
            const tb = electionMetaById[b.electionId]?.title ?? b.electionId;
            return ta.localeCompare(tb);
        });

        return entries;
    }, [filtered, electionMetaById]);

    const totalCount = filtered?.length ?? 0;

    return (
        <div style={{ padding: 16, display: "grid", gap: 12, maxWidth: 980 }}>
            <header style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Link to={backTo}>← 戻る</Link>
                <h2 style={{ margin: 0 }}>候補者一覧</h2>

                <button
                    onClick={load}
                    style={{ marginLeft: "auto" }}
                    disabled={isLoading}
                >
                    {isLoading ? "Reloading..." : "再読み込み"}
                </button>
            </header>

            {/* Filters */}
            <section
                style={{
                    display: "grid",
                    gap: 10,
                    border: "1px solid #eee",
                    borderRadius: 10,
                    padding: 12,
                }}
            >
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <label style={{ display: "grid", gap: 4 }}>
                        <span style={{ fontSize: 12, opacity: 0.7 }}>
                            electionId（任意）
                        </span>
                        <input
                            value={electionId}
                            onChange={(e) => setElectionId(e.target.value)}
                            placeholder="UUID"
                            style={{ padding: 8, minWidth: 320 }}
                        />
                    </label>

                    <label style={{ display: "grid", gap: 4 }}>
                        <span style={{ fontSize: 12, opacity: 0.7 }}>
                            partyKey（任意）
                        </span>
                        <input
                            value={partyKey}
                            onChange={(e) => setPartyKey(e.target.value)}
                            placeholder="tokyo_reform など"
                            style={{ padding: 8, minWidth: 220 }}
                        />
                    </label>

                    <button onClick={load} disabled={isLoading}>
                        絞り込み
                    </button>

                    <button
                        onClick={() => {
                            setElectionId("");
                            setPartyKey("");
                            setQ("");
                            setTimeout(load, 0);
                        }}
                        disabled={isLoading}
                    >
                        解除
                    </button>
                </div>

                <label style={{ display: "grid", gap: 4 }}>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>
                        検索（ローカル：名前/肩書き）
                    </span>
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="例：DX / 子育て / 鈴木"
                        style={{ padding: 8 }}
                    />
                </label>
            </section>

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
                        }}
                    >
                        <span>{error}</span>
                        <button onClick={load} style={{ marginLeft: "auto" }}>
                            再試行
                        </button>
                    </div>
                </div>
            )}

            {groups === null ? (
                <p>Loading...</p>
            ) : totalCount === 0 ? (
                <div
                    style={{
                        padding: 12,
                        border: "1px solid #ddd",
                        borderRadius: 8,
                    }}
                >
                    <p style={{ marginTop: 0 }}>候補者がいません</p>
                    <p style={{ marginBottom: 0, opacity: 0.8, fontSize: 13 }}>
                        条件に一致する候補者がいないか、まだ登録されていません。
                    </p>
                </div>
            ) : (
                <section style={{ display: "grid", gap: 14 }}>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                        表示件数: {totalCount}（選挙: {groups.length} 件）
                    </div>

                    {groups.map((g) => {
                        const meta = electionMetaById[g.electionId];
                        const title = meta?.title ?? `選挙: ${g.electionId}`;

                        return (
                            <div
                                key={g.electionId}
                                style={{
                                    border: "1px solid #eee",
                                    borderRadius: 12,
                                    padding: 12,
                                    display: "grid",
                                    gap: 10,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 10,
                                        alignItems: "baseline",
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <h3 style={{ margin: 0 }}>{title}</h3>

                                    <span
                                        style={{ fontSize: 12, opacity: 0.7 }}
                                    >
                                        候補者: {g.list.length}
                                    </span>

                                    <Link
                                        to={`/elections/${g.electionId}`}
                                        state={{ from }}
                                        style={{
                                            marginLeft: "auto",
                                            fontSize: 13,
                                        }}
                                    >
                                        選挙詳細へ →
                                    </Link>
                                </div>

                                {isDev && (
                                    <div style={{ fontSize: 12, opacity: 0.6 }}>
                                        electionId: {g.electionId}
                                    </div>
                                )}

                                <div style={{ display: "grid", gap: 8 }}>
                                    {g.list.map((c) => {
                                        const detailUrl = `/elections/${c.electionId}/candidates/${c.id}`;
                                        return (
                                            <Link
                                                key={c.id}
                                                to={detailUrl}
                                                state={{ from }}
                                                style={{
                                                    border: "1px solid #ddd",
                                                    borderRadius: 10,
                                                    padding: 12,
                                                    display: "grid",
                                                    gap: 6,
                                                    textDecoration: "none",
                                                    color: "inherit",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: 10,
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <strong
                                                        style={{ fontSize: 16 }}
                                                    >
                                                        {c.name}
                                                    </strong>

                                                    {c.party ? (
                                                        <span
                                                            style={{
                                                                fontSize: 12,
                                                                padding:
                                                                    "2px 8px",
                                                                border: "1px solid #eee",
                                                                borderRadius: 999,
                                                                opacity: 0.9,
                                                            }}
                                                            title={c.party.name}
                                                        >
                                                            {c.party.shortName}
                                                        </span>
                                                    ) : (
                                                        <span
                                                            style={{
                                                                fontSize: 12,
                                                                opacity: 0.6,
                                                            }}
                                                        >
                                                            無所属
                                                        </span>
                                                    )}

                                                    <span
                                                        style={{
                                                            marginLeft: "auto",
                                                            fontSize: 12,
                                                            opacity: 0.7,
                                                        }}
                                                    >
                                                        # {c.sortOrder}
                                                    </span>
                                                </div>

                                                <div
                                                    style={{
                                                        fontSize: 13,
                                                        opacity: 0.85,
                                                    }}
                                                >
                                                    {c.title}
                                                </div>

                                                {isDev && (
                                                    <div
                                                        style={{
                                                            fontSize: 12,
                                                            opacity: 0.6,
                                                        }}
                                                    >
                                                        candidateId: {c.id} /
                                                        key: {c.candidateKey}
                                                    </div>
                                                )}

                                                <div
                                                    style={{
                                                        fontSize: 13,
                                                        opacity: 0.85,
                                                    }}
                                                >
                                                    候補者の詳細を見る →
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </section>
            )}
        </div>
    );
}
