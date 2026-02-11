import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchPartyDetail, fetchPartyCandidates } from "../api/parties";
import type {
    PartyCandidateItem,
    PartyDetailResponse,
} from "../model/partyTypes";

import { Page, Card, DevDebug } from "../../shared/ui/page";
import { ErrorCard } from "../../shared/ui/ErrorCard";
import { useAsyncLoad } from "../../shared/hooks/useAsyncLoad";
import { useFromBackTo } from "../../shared/routes/useFromBackTo";

import { PartyPill } from "../ui/PartyPill";
import { FavoriteButton } from "../../me/ui/FavoriteButton";
import { CandidateCard } from "../../candidates/ui/CandidateCard";

type PartyCandidatePerson = {
    candidateKey: string;
    name: string;
    age: number | null;
    title: string | null;
    imageUrl?: string | null;

    representativeElectionId: string;
    representativeCandidateId: string;

    electionsCount: number;

    // 画像fallback安定化（表示順）
    index: number;
};

export function PartyDetailPage() {
    const { partyKey } = useParams<{ partyKey: string }>();

    // ✅ 共通：from/backTo/self
    const { self, backTo } = useFromBackTo("/parties");

    const {
        data: party,
        error: partyError,
        isLoading: partyLoading,
        run: loadParty,
    } = useAsyncLoad<PartyDetailResponse>(async () => {
        if (!partyKey) throw new Error("Invalid partyKey");
        return fetchPartyDetail(partyKey);
    });

    const {
        data: cands,
        error: candsError,
        isLoading: candsLoading,
        run: loadCands,
    } = useAsyncLoad<PartyCandidateItem[]>(async () => {
        if (!partyKey) throw new Error("Invalid partyKey");
        return fetchPartyCandidates(partyKey);
    });

    const isLoading = partyLoading || candsLoading;
    const err = partyError ?? candsError ?? null;

    const load = async () => {
        await Promise.all([loadParty(), loadCands()]);
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [partyKey]);

    // 人物単位：candidateKeyでグルーピング
    const people = useMemo<PartyCandidatePerson[] | null>(() => {
        if (cands === null) return null;

        const map = new Map<string, PartyCandidateItem[]>();
        for (const c of cands) {
            if (!map.has(c.candidateKey)) map.set(c.candidateKey, []);
            map.get(c.candidateKey)!.push(c);
        }

        const list: PartyCandidatePerson[] = [];

        for (const [candidateKey, items] of map.entries()) {
            const rep = [...items].sort((a: any, b: any) => {
                const sa =
                    typeof a.sortOrder === "number" ? a.sortOrder : 999999;
                const sb =
                    typeof b.sortOrder === "number" ? b.sortOrder : 999999;
                return sa - sb;
            })[0];

            list.push({
                candidateKey,
                name: rep.name,
                age: rep.age ?? null,
                title: rep.title,
                imageUrl: (rep as any).imageUrl ?? null,
                representativeElectionId: (rep as any).electionId,
                representativeCandidateId: (rep as any).candidateId,
                electionsCount: items.length,
                index: 0,
            });
        }

        list.sort((a, b) => a.name.localeCompare(b.name, "ja"));
        return list.map((p, idx) => ({ ...p, index: idx }));
    }, [cands]);

    const count = people ? people.length : 0;

    if (!partyKey) {
        return (
            <Page
                title={<h1 style={{ margin: 0, fontSize: 20 }}>政党詳細</h1>}
                actions={<Link to={backTo}>← 戻る</Link>}
                maxWidth={980}
            >
                <ErrorCard message="Invalid partyKey" />
            </Page>
        );
    }

    const color = party?.color ?? null;

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>政党詳細</h1>}
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

                    {party?.id ? (
                        <span style={{ marginLeft: "auto" }}>
                            <FavoriteButton
                                targetType="PARTY"
                                targetId={party.id}
                            />
                        </span>
                    ) : null}

                    <button
                        onClick={load}
                        disabled={isLoading}
                        style={{ marginLeft: 8 }}
                    >
                        {isLoading ? "Reloading..." : "再読み込み"}
                    </button>
                </div>
            }
            maxWidth={980}
        >
            {err && (
                <ErrorCard
                    message={err}
                    actions={<button onClick={load}>再試行</button>}
                />
            )}

            {!party ? (
                <Card>{isLoading ? "読み込み中…" : "Not loaded"}</Card>
            ) : (
                <Card>
                    <div
                        style={{
                            padding: 12,
                            display: "grid",
                            gap: 10,
                            background: "#fff",
                            borderRadius: 12,
                            boxShadow: color
                                ? `inset 4px 0 0 0 ${color}`
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
                            <strong style={{ fontSize: 18 }}>
                                {party.name}
                            </strong>

                            <PartyPill
                                shortName={party.shortName}
                                name={party.name}
                                color={party.color}
                            />

                            <span
                                style={{
                                    marginLeft: "auto",
                                    fontSize: 12,
                                    opacity: 0.7,
                                }}
                            >
                                partyKey: {party.partyKey}
                            </span>
                        </div>

                        {party.description ? (
                            <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                                {party.description}
                            </div>
                        ) : (
                            <div style={{ fontSize: 13, opacity: 0.75 }}>
                                説明はありません
                            </div>
                        )}

                        {!!party.ideologyTags?.length && (
                            <div
                                style={{
                                    display: "flex",
                                    gap: 8,
                                    flexWrap: "wrap",
                                }}
                            >
                                {party.ideologyTags.map((t) => (
                                    <PartyPill
                                        key={t}
                                        shortName={t}
                                        name={t}
                                        color={party.color}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
            )}

            <Card>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                    }}
                >
                    <div style={{ fontWeight: 800 }}>この政党の候補者</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                        {people === null ? "…" : count} 人
                    </div>
                </div>

                <div
                    style={{
                        marginTop: 12,
                        display: "grid",
                        gap: 10,
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(260px, 1fr))",
                        alignItems: "stretch",
                    }}
                >
                    {people === null ? (
                        <div style={{ opacity: 0.8 }}>読み込み中…</div>
                    ) : people.length === 0 ? (
                        <div
                            style={{
                                padding: 12,
                                border: "1px solid #eee",
                                borderRadius: 12,
                                background: "#fafafa",
                            }}
                        >
                            候補者がいません
                        </div>
                    ) : (
                        people.map((p, idx) => (
                            <CandidateCard
                                key={`${p.representativeElectionId}:${p.representativeCandidateId}`}
                                c={
                                    {
                                        // CandidateItem に寄せて最低限埋める（CandidateCard が参照するもの）
                                        id: p.representativeCandidateId,
                                        electionId: p.representativeElectionId,
                                        name: p.name,
                                        title: p.title,
                                        sortOrder: idx + 1,
                                        party: {
                                            // この画面は「政党内の候補者」なので party 情報は画面上の党で固定
                                            name: party?.name ?? "",
                                            shortName: party?.shortName ?? "",
                                            color: party?.color ?? null,
                                        },
                                        // CandidateCard が candidateKey を読むので載せる
                                        candidateKey: p.candidateKey,
                                        // もし API imageUrl を使わせたいなら載せる
                                        imageUrl: p.imageUrl ?? null,
                                    } as any
                                }
                                from={self}
                                detailUrl={`/elections/${encodeURIComponent(
                                    p.representativeElectionId,
                                )}/candidates/${encodeURIComponent(p.representativeCandidateId)}`}
                                showSortOrder={false}
                                showId={false}
                                indexOverride={idx}
                            />
                        ))
                    )}
                </div>
            </Card>

            <DevDebug
                value={{
                    partyKey,
                    party,
                    cands,
                    people,
                    err,
                    isLoading,
                    backTo,
                    self,
                }}
            />
        </Page>
    );
}
