// frontend/src/elections/ui/ElectionCandidatesListCard.tsx
import type { ElectionDetailResponse } from "../model/electionTypes";
import { Card } from "../../shared/ui/page";
import { CandidateCard } from "../../candidates/ui/CandidateCard";

export function ElectionCandidatesListCard(props: {
    data: ElectionDetailResponse;
    from: string;
}) {
    const { data, from } = props;

    return (
        <Card>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "baseline",
                    marginBottom: 10,
                }}
            >
                <div style={{ fontWeight: 800 }}>候補者</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {data.candidates.length} 人
                </div>
            </div>

            <div
                style={{
                    display: "grid",
                    gap: 10,
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    alignItems: "stretch",
                }}
            >
                {data.candidates.map((c: any, idx: number) => (
                    <CandidateCard
                        key={c.id}
                        c={
                            {
                                id: c.id,
                                electionId: data.electionId,
                                name: c.name,
                                title: c.title ?? null,
                                sortOrder: c.sortOrder ?? idx + 1,

                                party: c.party ?? null,

                                candidateKey: c.candidateKey ?? null,
                                imageUrl: c.imageUrl ?? null,
                            } as any
                        }
                        from={from}
                        detailUrl={`/elections/${encodeURIComponent(
                            data.electionId,
                        )}/candidates/${encodeURIComponent(String(c.id))}`}
                        showSortOrder={false}
                        showId={false}
                        indexOverride={idx}
                    />
                ))}
            </div>
        </Card>
    );
}
