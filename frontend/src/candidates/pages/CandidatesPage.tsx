import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { CandidateItem } from "../model/candidateTypes";
import { CandidateGroupsByElection } from "../ui/CandidateGroupsByElection";
import type { ElectionListItem } from "../../elections/model/electionTypes";
import type { PartyListItem } from "../../parties/model/partyTypes";
import { fetchCandidates } from "../api/candidates";
import { fetchElections } from "../../elections/api/elections";
import { fetchParties } from "../../parties/api/parties";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { useFromBackTo } from "../../shared/routes/useFromBackTo";
import { ErrorCard } from "../../shared/ui/ErrorCard";
import { CollapsibleFilter } from "../../shared/ui/CollapsibleFilter";
import {
    CandidatesFilterPanel,
    type DisplayMode,
} from "../ui/CandidatesFilterPanel";
import { PersonCard } from "../ui/PersonCard";
import {
    filterCandidates,
    groupByElection,
    toPeople,
    type ElectionMeta,
} from "../model/candidatesView";

export function CandidatesPage() {
    const { self: from, backTo } = useFromBackTo("/");

    // candidates
    const [items, setItems] = useState<CandidateItem[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // meta (elections)
    const [electionMetaById, setElectionMetaById] = useState<
        Record<string, ElectionMeta>
    >({});
    const [elections, setElections] = useState<ElectionListItem[]>([]);
    const [metaLoading, setMetaLoading] = useState(false);

    // parties
    const [parties, setParties] = useState<PartyListItem[]>([]);
    const [partiesLoading, setPartiesLoading] = useState(false);

    // filters
    const [mode, setMode] = useState<DisplayMode>("ELECTION");
    const [electionId, setElectionId] = useState("");
    const [partyKey, setPartyKey] = useState("");
    const [q, setQ] = useState("");

    // ----------------------------
    // Loaders
    // ----------------------------
    const loadCandidates = async (opts?: {
        electionId?: string;
        partyKey?: string;
    }) => {
        setError(null);
        setIsLoading(true);

        const eid = (opts?.electionId ?? electionId).trim();
        const pk = (opts?.partyKey ?? partyKey).trim();

        try {
            const cands = await fetchCandidates({
                electionId: eid || undefined,
                partyKey: pk || undefined,
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

    const resetFilters = () => {
        // UI state
        setElectionId("");
        setPartyKey("");
        setQ("");

        // ★確実に「空条件」で取り直す（setTimeout不要）
        loadCandidates({ electionId: "", partyKey: "" });
    };

    // ----------------------------
    // Initial loads
    // ----------------------------
    useEffect(() => {
        // 初回 candidates
        let cancelled = false;

        (async () => {
            setError(null);
            setIsLoading(true);
            try {
                const cands = await fetchCandidates({});
                if (!cancelled) setItems(cands);
            } catch (err: any) {
                if (!cancelled) {
                    setError(
                        err?.response?.data?.message ??
                            "Failed to load candidates",
                    );
                    setItems([]);
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        // elections meta
        let cancelled = false;

        (async () => {
            setMetaLoading(true);
            try {
                const list = await fetchElections();
                if (cancelled) return;

                setElections(list);

                const map: Record<string, ElectionMeta> = {};
                for (const e of list) {
                    map[e.electionId] = {
                        title: e.title,
                        startsAt: e.startsAt,
                        endsAt: e.endsAt,
                        status: e.status,
                    };
                }
                setElectionMetaById(map);
            } catch (err: any) {
                // ★握り潰さない（候補者は見れるがメタが壊れてる等を検知しやすく）
                if (!cancelled) {
                    setError((prev) => prev ?? "選挙情報の取得に失敗しました");
                }
            } finally {
                if (!cancelled) setMetaLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        // parties
        let cancelled = false;

        (async () => {
            setPartiesLoading(true);
            try {
                const list = await fetchParties();
                if (cancelled) return;
                setParties(list);
            } catch (err: any) {
                if (!cancelled) {
                    setError((prev) => prev ?? "政党情報の取得に失敗しました");
                }
            } finally {
                if (!cancelled) setPartiesLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    function isPartyProxyCandidate(c: CandidateItem): boolean {
        const k = (c as any)?.candidateKey;
        return typeof k === "string" && k.startsWith("PR_");
    }

    // View models
    const visibleItems = useMemo(
        () => (items ?? []).filter((c) => !isPartyProxyCandidate(c)),
        [items],
    );

    const filtered = useMemo(
        () => filterCandidates(visibleItems, q),
        [visibleItems, q],
    );
    const people = useMemo(() => toPeople(filtered), [filtered]);
    const groups = useMemo(
        () => groupByElection(filtered, electionMetaById),
        [filtered, electionMetaById],
    );

    const totalCount = filtered?.length ?? 0;
    const personCount = people?.length ?? 0;

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
                        onClick={() => loadCandidates()}
                        disabled={isLoading}
                        style={{ marginLeft: 8 }}
                    >
                        {isLoading ? "Reloading..." : "再読み込み"}
                    </button>
                </div>
            }
            maxWidth={980}
        >
            <CollapsibleFilter
                title="絞り込み"
                defaultOpen={false}
                right={
                    <span style={{ whiteSpace: "nowrap" }}>
                        {mode === "PERSON"
                            ? `表示: ${personCount}（元: ${totalCount}）`
                            : `表示: ${totalCount}（選挙: ${groups?.length ?? 0}）`}
                    </span>
                }
            >
                <CandidatesFilterPanel
                    mode={mode}
                    setMode={setMode}
                    elections={elections}
                    parties={parties}
                    metaLoading={metaLoading}
                    partiesLoading={partiesLoading}
                    electionId={electionId}
                    setElectionId={setElectionId}
                    partyKey={partyKey}
                    setPartyKey={setPartyKey}
                    q={q}
                    setQ={setQ}
                    isLoading={isLoading}
                    onApply={() => loadCandidates()}
                    onReset={resetFilters}
                />
            </CollapsibleFilter>

            {error && (
                <ErrorCard
                    message={error}
                    actions={
                        <button onClick={() => loadCandidates()}>再試行</button>
                    }
                />
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

                    <CandidateGroupsByElection
                        from={from}
                        groups={groups!}
                        electionMetaById={electionMetaById}
                    />
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
                    metaLoading,
                    partiesLoading,
                }}
            />
        </Page>
    );
}
