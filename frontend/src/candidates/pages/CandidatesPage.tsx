// frontend/src/candidates/pages/CandidatesPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { CandidateItem } from "../model/candidateTypes";
import type { ElectionListItem } from "../../elections/model/electionTypes";
import type { PartyListItem } from "../../parties/model/partyTypes";
import { fetchCandidates } from "../api/candidates";
import { fetchElections } from "../../elections/api/elections";
import { fetchParties } from "../../parties/api/parties";
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

type DisplayMode = "ELECTION" | "PERSON";

function PartyBadge({
    shortName,
    name,
    color,
}: {
    shortName: string;
    name?: string;
    color?: string | null;
}) {
    return (
        <span
            title={name ?? shortName}
            style={{
                fontSize: 12,
                padding: "2px 10px",
                borderRadius: 999,
                border: "1px solid #eee",
                background: "#fafafa",
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

type PersonItem = {
    // candidateKey が無い場合でも動くように "personKey" を持たせる
    personKey: string;
    candidateKey?: string | null;
    name: string;
    title: string;
    age?: number | null; // もし入っていれば
    party: CandidateItem["party"] | null;
    electionsCount: number;
    repElectionId: string;
    repCandidateId: string;
};

function PersonCard({ p, from }: { p: PersonItem; from: string }) {
    const partyColor = p.party?.color ?? null;

    return (
        <Link
            to={`/elections/${p.repElectionId}/candidates/${p.repCandidateId}`}
            state={{ from }}
            style={{ textDecoration: "none", color: "inherit" }}
        >
            <div
                style={{
                    border: "1px solid #eee",
                    borderRadius: 12,
                    padding: 12,
                    display: "grid",
                    gap: 6,
                    background: "#fff",
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
                    <strong style={{ fontSize: 16 }}>{p.name}</strong>

                    {p.party ? (
                        <PartyBadge
                            shortName={p.party.shortName}
                            name={p.party.name}
                            color={p.party.color}
                        />
                    ) : (
                        <span style={{ fontSize: 12, opacity: 0.6 }}>
                            無所属
                        </span>
                    )}

                    <span
                        style={{
                            fontSize: 12,
                            opacity: 0.7,
                            padding: "2px 8px",
                            border: "1px solid #eee",
                            borderRadius: 999,
                            background: "#fafafa",
                        }}
                        title="出馬数"
                    >
                        出馬 {p.electionsCount} 件
                    </span>

                    {p.candidateKey ? (
                        <span
                            style={{
                                fontSize: 12,
                                opacity: 0.7,
                                padding: "2px 8px",
                                border: "1px solid #eee",
                                borderRadius: 999,
                                background: "#fafafa",
                            }}
                            title="candidateKey"
                        >
                            {p.candidateKey}
                        </span>
                    ) : null}

                    <span
                        style={{
                            marginLeft: "auto",
                            fontSize: 12,
                            opacity: 0.7,
                        }}
                    >
                        候補者の詳細を見る →
                    </span>
                </div>

                <div style={{ fontSize: 13, opacity: 0.85 }}>{p.title}</div>
            </div>
        </Link>
    );
}

// candidateKey が型に無い可能性があるので any 経由で読む（壊さない）
function readCandidateKey(c: CandidateItem): string | null {
    const k = (c as any)?.candidateKey;
    return typeof k === "string" && k.trim() ? k.trim() : null;
}

function readAge(c: CandidateItem): number | null {
    const a = (c as any)?.age;
    return typeof a === "number" ? a : null;
}

function buildPersonKey(c: CandidateItem): {
    personKey: string;
    candidateKey?: string | null;
} {
    const ck = readCandidateKey(c);
    if (ck) return { personKey: `ck:${ck}`, candidateKey: ck };

    // フォールバック：候補者一覧APIに candidateKey が無い場合でも人物単位に近い表示にする
    // name/title/partyKey が同一なら同一人物扱い
    const pk = c.party?.partyKey ?? "ind";
    return { personKey: `f:${c.name}|${c.title}|${pk}`, candidateKey: null };
}

export function CandidatesPage() {
    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;

    const backTo = normalizeFrom(state.from ?? "/");
    const from = loc.pathname + loc.search;

    const [items, setItems] = useState<CandidateItem[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // meta
    const [electionMetaById, setElectionMetaById] = useState<
        Record<string, ElectionMeta>
    >({});
    const [elections, setElections] = useState<ElectionListItem[]>([]);
    const [metaLoading, setMetaLoading] = useState(false);

    // parties
    const [parties, setParties] = useState<PartyListItem[]>([]);
    const [partiesLoading, setPartiesLoading] = useState(false);

    // filters (server-side: electionId/partyKey, local: q)
    const [mode, setMode] = useState<DisplayMode>("ELECTION");
    const [electionId, setElectionId] = useState("");
    const [partyKey, setPartyKey] = useState("");
    const [q, setQ] = useState("");

    // 初回：elections meta
    useEffect(() => {
        let cancelled = false;
        setMetaLoading(true);
        fetchElections()
            .then((list: ElectionListItem[]) => {
                if (cancelled) return;
                setElections(list);

                const map: Record<string, ElectionMeta> = {};
                list.forEach((e) => {
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
                // metaは落ちても致命的ではない
            })
            .finally(() => {
                if (!cancelled) setMetaLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    // 初回：parties
    useEffect(() => {
        let cancelled = false;
        setPartiesLoading(true);
        fetchParties()
            .then((list: PartyListItem[]) => {
                if (cancelled) return;
                setParties(list);
            })
            .catch(() => {
                // partiesは落ちても致命的ではない
            })
            .finally(() => {
                if (!cancelled) setPartiesLoading(false);
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

    // ★ 人物単位（candidateKeyがあればそれ優先）
    const people = useMemo<PersonItem[] | null>(() => {
        if (!filtered) return null;

        const map = new Map<string, CandidateItem[]>();
        for (const c of filtered) {
            const { personKey } = buildPersonKey(c);
            if (!map.has(personKey)) map.set(personKey, []);
            map.get(personKey)!.push(c);
        }

        const list: PersonItem[] = [];
        for (const [personKey, group] of map.entries()) {
            // 代表は「ソート順が最小のもの」優先（安定させる）
            const rep = [...group].sort((a, b) => a.sortOrder - b.sortOrder)[0];
            const { candidateKey: ck } = buildPersonKey(rep);

            list.push({
                personKey,
                candidateKey: ck ?? undefined,
                name: rep.name,
                title: rep.title ?? "",
                age: readAge(rep),
                party: rep.party ?? null,
                electionsCount: group.length,
                repElectionId: rep.electionId,
                repCandidateId: rep.id,
            });
        }

        // 表示順：政党→名前
        list.sort((a, b) => {
            const pa = a.party?.shortName ?? "無所属";
            const pb = b.party?.shortName ?? "無所属";
            const pcmp = pa.localeCompare(pb, "ja");
            if (pcmp !== 0) return pcmp;
            return a.name.localeCompare(b.name, "ja");
        });

        return list;
    }, [filtered]);

    // ★ 選挙単位：electionId ごとにグルーピング
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
            return ta.localeCompare(tb, "ja");
        });

        return entries;
    }, [filtered, electionMetaById]);

    const totalCount = filtered?.length ?? 0;
    const personCount = people?.length ?? 0;

    const resetFilters = () => {
        setElectionId("");
        setPartyKey("");
        setQ("");
        setTimeout(loadCandidates, 0);
    };

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
                    {/* mode */}
                    <div
                        style={{
                            display: "flex",
                            gap: 10,
                            flexWrap: "wrap",
                            alignItems: "center",
                        }}
                    >
                        <span style={{ fontSize: 12, opacity: 0.7 }}>
                            表示モード
                        </span>

                        <label
                            style={{
                                display: "flex",
                                gap: 6,
                                alignItems: "center",
                            }}
                        >
                            <input
                                type="radio"
                                checked={mode === "ELECTION"}
                                onChange={() => setMode("ELECTION")}
                            />
                            <span style={{ fontSize: 13 }}>選挙単位</span>
                        </label>

                        <label
                            style={{
                                display: "flex",
                                gap: 6,
                                alignItems: "center",
                            }}
                        >
                            <input
                                type="radio"
                                checked={mode === "PERSON"}
                                onChange={() => setMode("PERSON")}
                            />
                            <span style={{ fontSize: 13 }}>人物単位</span>
                        </label>

                        <span
                            style={{
                                marginLeft: "auto",
                                fontSize: 12,
                                opacity: 0.7,
                            }}
                        >
                            {metaLoading ? "選挙情報読み込み中…" : " "}
                            {partiesLoading ? "政党情報読み込み中…" : " "}
                        </span>
                    </div>

                    {/* server filters */}
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
                                選挙（任意）
                            </span>
                            <select
                                value={electionId}
                                onChange={(e) => setElectionId(e.target.value)}
                                style={{ padding: 8, minWidth: 380 }}
                            >
                                <option value="">（指定なし）</option>
                                {elections.map((e) => (
                                    <option
                                        key={e.electionId}
                                        value={e.electionId}
                                    >
                                        {e.title}
                                    </option>
                                ))}
                            </select>
                            <span style={{ fontSize: 11, opacity: 0.6 }}>
                                ※UUID手入力したい場合は下に貼ってOK
                            </span>
                            <input
                                value={electionId}
                                onChange={(e) => setElectionId(e.target.value)}
                                placeholder="electionId(UUID) 直入力"
                                style={{ padding: 8 }}
                            />
                        </label>

                        <label style={{ display: "grid", gap: 4 }}>
                            <span style={{ fontSize: 12, opacity: 0.7 }}>
                                政党（任意）
                            </span>
                            <select
                                value={partyKey}
                                onChange={(e) => setPartyKey(e.target.value)}
                                style={{ padding: 8, minWidth: 260 }}
                            >
                                <option value="">（指定なし）</option>
                                {parties.map((p) => (
                                    <option key={p.partyKey} value={p.partyKey}>
                                        {p.name}（{p.shortName}）
                                    </option>
                                ))}
                                <option value="__independent__">
                                    無所属だけ（※未対応なら手入力で）
                                </option>
                            </select>
                            <input
                                value={partyKey}
                                onChange={(e) => setPartyKey(e.target.value)}
                                placeholder="partyKey 直入力（tokyo_reform など）"
                                style={{ padding: 8 }}
                            />
                        </label>

                        <div
                            style={{
                                display: "flex",
                                gap: 8,
                                alignItems: "center",
                            }}
                        >
                            <button
                                onClick={loadCandidates}
                                disabled={isLoading}
                            >
                                絞り込み
                            </button>
                            <button onClick={resetFilters} disabled={isLoading}>
                                解除
                            </button>
                        </div>
                    </div>

                    {/* local search */}
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

            {filtered === null ? (
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
            ) : mode === "PERSON" ? (
                <section style={{ display: "grid", gap: 14 }}>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                        表示件数: {personCount}（元レコード: {totalCount}）
                    </div>

                    <div style={{ display: "grid", gap: 10 }}>
                        {people!.map((p) => (
                            <PersonCard key={p.personKey} p={p} from={from} />
                        ))}
                    </div>
                </section>
            ) : (
                <section style={{ display: "grid", gap: 14 }}>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                        表示件数: {totalCount}（選挙: {groups?.length ?? 0} 件）
                    </div>

                    {groups!.map((g) => {
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
                    mode,
                    items,
                    filteredCount: totalCount,
                    personCount,
                    error,
                    isLoading,
                    electionId,
                    partyKey,
                    q,
                    groupsLen: groups?.length ?? null,
                    electionsLoaded: elections.length,
                    partiesLoaded: parties.length,
                }}
            />
        </Page>
    );
}
