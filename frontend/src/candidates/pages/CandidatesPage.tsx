// frontend/src/candidates/pages/CandidatesPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { CandidateItem } from "../model/candidateTypes";
import type { ElectionListItem } from "../../elections/model/electionTypes";
import { fetchCandidates } from "../api/candidates";
import { fetchElections } from "../../elections/api/elections";
import { normalizeFrom } from "../../shared/normalizeFrom";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { formatJST, statusLabel } from "../../shared/elections/format";

type LocationState = { from?: string };

type ElectionMeta = {
    title: string;
    startsAt?: string;
    endsAt?: string;
    status?: string;
};

function PartyBadge({
    shortName,
    name,
    color,
}: {
    shortName: string;
    name?: string;
    color?: string | null;
}) {
    // color は " #RRGGBB " を想定。無ければ薄い枠のみ
    return (
        <span
            title={name ?? shortName}
            style={{
                fontSize: 12,
                padding: "2px 10px",
                borderRadius: 999,
                border: "1px solid #eee",
                background: "#fafafa",
                // 党カラーを「左ボーダー」で控えめに使う
                boxShadow: color ? `inset 4px 0 0 0 ${color}` : undefined,
            }}
        >
            {shortName}
        </span>
    );
}

function CandidateCard({ c, from }: { c: CandidateItem; from: string }) {
    const partyColor = c.party?.color ?? null;

    return (
        <Link
            to={`/elections/${c.electionId}/candidates/${c.id}`}
            state={{ from }}
            style={{
                textDecoration: "none",
                color: "inherit",
            }}
        >
            <div
                style={{
                    border: "1px solid #eee",
                    borderRadius: 12,
                    padding: 12,
                    display: "grid",
                    gap: 6,
                    background: "#fff",
                    // 党カラーがある時だけアクセント
                    boxShadow: partyColor
                        ? `inset 4px 0 0 0 ${partyColor}`
                        : undefined,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <strong style={{ fontSize: 16 }}>{c.name}</strong>

                    {c.party ? (
                        <PartyBadge
                            shortName={c.party.shortName}
                            name={c.party.name}
                            color={c.party.color}
                        />
                    ) : (
                        <span style={{ fontSize: 12, opacity: 0.6 }}>
                            無所属
                        </span>
                    )}

                    <span
                        style={{
                            marginLeft: "auto",
                            fontSize: 12,
                            opacity: 0.7,
                        }}
                        title="表示順"
                    >
                        #{c.sortOrder}
                    </span>
                </div>

                <div style={{ fontSize: 13, opacity: 0.85 }}>{c.title}</div>

                <div style={{ fontSize: 13, opacity: 0.85 }}>
                    候補者の詳細を見る →
                </div>
            </div>
        </Link>
    );
}

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
    const [metaLoading, setMetaLoading] = useState(false);

    // filters (server-side: electionId/partyKey, local: q)
    const [electionId, setElectionId] = useState("");
    const [partyKey, setPartyKey] = useState("");
    const [q, setQ] = useState("");

    // 初回だけ：elections meta を取る（毎回やると無駄が多い）
    useEffect(() => {
        let cancelled = false;
        setMetaLoading(true);
        fetchElections()
            .then((elections: ElectionListItem[]) => {
                if (cancelled) return;
                const map: Record<string, ElectionMeta> = {};
                elections.forEach((e) => {
                    map[e.electionId] = {
                        title: e.title,
                        startsAt: e.startsAt,
                        endsAt: e.endsAt,
                        status: e.status,
                    };
                });
                setElectionMetaById(map);
            })
            .catch(() => {
                // meta は落ちても致命的ではない（候補者表示はできる）
            })
            .finally(() => {
                if (!cancelled) setMetaLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const loadCandidates = async () => {
        setError(null);
        setIsLoading(true);

        try {
            const cands = await fetchCandidates({
                electionId: electionId.trim() || undefined,
                partyKey: partyKey.trim() || undefined,
            });
            setItems(cands);
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
        loadCandidates();
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

        const entries = Array.from(m.entries()).map(([id, list]) => ({
            electionId: id,
            list: [...list].sort((a, b) => a.sortOrder - b.sortOrder),
        }));

        // 見た目の順序：選挙タイトル（あれば）→ electionId
        entries.sort((a, b) => {
            const ta = electionMetaById[a.electionId]?.title ?? a.electionId;
            const tb = electionMetaById[b.electionId]?.title ?? b.electionId;
            return ta.localeCompare(tb);
        });

        return entries;
    }, [filtered, electionMetaById]);

    const totalCount = filtered?.length ?? 0;

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>候補者一覧</h1>}
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
                        onClick={loadCandidates}
                        disabled={isLoading}
                        style={{ marginLeft: 8 }}
                    >
                        {isLoading ? "Reloading..." : "再読み込み"}
                    </button>
                </div>
            }
            maxWidth={980}
        >
            <Card>
                <div style={{ display: "grid", gap: 10 }}>
                    <div
                        style={{
                            display: "flex",
                            gap: 10,
                            flexWrap: "wrap",
                            alignItems: "end",
                        }}
                    >
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

                        <button onClick={loadCandidates} disabled={isLoading}>
                            絞り込み
                        </button>

                        <button
                            onClick={() => {
                                setElectionId("");
                                setPartyKey("");
                                setQ("");
                                setTimeout(loadCandidates, 0);
                            }}
                            disabled={isLoading}
                        >
                            解除
                        </button>

                        <span
                            style={{
                                marginLeft: "auto",
                                fontSize: 12,
                                opacity: 0.7,
                            }}
                        >
                            {metaLoading ? "選挙情報読み込み中…" : " "}
                        </span>
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
                        <button
                            onClick={loadCandidates}
                            style={{ marginLeft: "auto" }}
                        >
                            再試行
                        </button>
                    </div>
                </Card>
            )}

            {groups === null ? (
                <Card>読み込み中…</Card>
            ) : totalCount === 0 ? (
                <Card>
                    <p style={{ marginTop: 0, marginBottom: 6 }}>
                        候補者がいません
                    </p>
                    <p style={{ margin: 0, opacity: 0.8, fontSize: 13 }}>
                        条件に一致する候補者がいないか、まだ登録されていません。
                    </p>
                </Card>
            ) : (
                <section style={{ display: "grid", gap: 14 }}>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                        表示件数: {totalCount}（選挙: {groups.length} 件）
                    </div>

                    {groups.map((g) => {
                        const meta = electionMetaById[g.electionId];
                        const title = meta?.title ?? `選挙: ${g.electionId}`;

                        return (
                            <Card key={g.electionId}>
                                <div style={{ display: "grid", gap: 10 }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 10,
                                            alignItems: "baseline",
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <h2 style={{ margin: 0, fontSize: 16 }}>
                                            {title}
                                        </h2>

                                        <span
                                            style={{
                                                fontSize: 12,
                                                opacity: 0.7,
                                            }}
                                        >
                                            候補者: {g.list.length}
                                        </span>

                                        {meta?.status ? (
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    opacity: 0.7,
                                                }}
                                            >
                                                状態:{" "}
                                                <b>
                                                    {statusLabel(
                                                        meta.status as any,
                                                    )}
                                                </b>
                                            </span>
                                        ) : null}

                                        {meta?.startsAt ? (
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    opacity: 0.7,
                                                }}
                                            >
                                                {formatJST(meta.startsAt)} 〜{" "}
                                                {formatJST(meta.endsAt)}
                                            </span>
                                        ) : null}

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

                                    <div style={{ display: "grid", gap: 10 }}>
                                        {g.list.map((c) => (
                                            <CandidateCard
                                                key={c.id}
                                                c={c}
                                                from={from}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </section>
            )}

            <DevDebug
                value={{
                    items,
                    error,
                    isLoading,
                    electionId,
                    partyKey,
                    q,
                    groupsLen: groups?.length ?? null,
                }}
            />
        </Page>
    );
}
