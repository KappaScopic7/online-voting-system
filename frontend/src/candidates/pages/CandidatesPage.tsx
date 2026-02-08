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

    // filters
    const [mode, setMode] = useState<DisplayMode>("ELECTION");
    const [electionId, setElectionId] = useState("");
    const [partyKey, setPartyKey] = useState("");
    const [q, setQ] = useState("");

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
            .catch(() => {})
            .finally(() => {
                if (!cancelled) setMetaLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        setPartiesLoading(true);

        fetchParties()
            .then((list: PartyListItem[]) => {
                if (cancelled) return;
                setParties(list);
            })
            .catch(() => {})
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

    const filtered = useMemo(() => filterCandidates(items, q), [items, q]);
    const people = useMemo(() => toPeople(filtered), [filtered]);
    const groups = useMemo(
        () => groupByElection(filtered, electionMetaById),
        [filtered, electionMetaById],
    );

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
                onApply={loadCandidates}
                onReset={resetFilters}
            />

            {error && (
                <ErrorCard
                    message={error}
                    actions={<button onClick={loadCandidates}>再試行</button>}
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
                }}
            />
        </Page>
    );
}
