import { ElectionCardFrame } from "../../elections/ui/ElectionCardFrame";
import { CandidateCard } from "./CandidateCard";
import type { ElectionMeta } from "../model/candidatesView";
import type { CandidateItem } from "../model/candidateTypes";

export type CandidatesByElectionGroup = {
    electionId: string;
    list: CandidateItem[];
};

export function CandidateGroupsByElection(props: {
    from: string;
    groups: CandidatesByElectionGroup[];
    electionMetaById: Record<string, ElectionMeta>;
}) {
    const { from, groups, electionMetaById } = props;

    return (
        <section style={{ display: "grid", gap: 14 }}>
            {groups.map((g) => {
                const meta = electionMetaById[g.electionId];
                const title = meta?.title ?? `選挙: ${g.electionId}`;

                return (
                    <ElectionCardFrame
                        key={g.electionId}
                        e={{
                            electionId: g.electionId,
                            title,
                            startsAt: meta?.startsAt,
                            endsAt: meta?.endsAt,
                            status: meta?.status as any,
                            hasResult: false,
                        }}
                        from={from}
                        meta={<span>候補者: {g.list.length}</span>}
                        // 候補者一覧ページの中なので、下段リンクは最低限で良い
                        showCandidatesLink={false}
                        showResultLink={false}
                    >
                        <div
                            style={{
                                marginTop: 8,
                                display: "grid",
                                gap: 10,
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(240px, 1fr))",
                                alignItems: "stretch",
                            }}
                        >
                            {g.list.map((c, idx) => (
                                <CandidateCard
                                    key={c.id}
                                    c={c}
                                    from={from}
                                    detailUrl={`/elections/${encodeURIComponent(g.electionId)}/candidates/${encodeURIComponent(c.id)}`}
                                    showId={false}
                                    showSortOrder={false}
                                    indexOverride={idx}
                                />
                            ))}
                        </div>
                    </ElectionCardFrame>
                );
            })}
        </section>
    );
}
