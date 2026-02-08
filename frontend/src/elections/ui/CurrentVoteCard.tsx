// frontend/src/elections/ui/CurrentVoteCard.tsx
import { Card } from "../../shared/ui/page";
import { formatLocal } from "../../shared/datetime/formatLocal";
import type { ElectionDetailResponse } from "../model/electionTypes";

function resolveCandidateName(
    candidateId: string | null | undefined,
    candidates: { id: string; name: string }[],
): string {
    if (!candidateId) return "誰も支持しない";
    const hit = candidates.find((c) => c.id === candidateId);
    return hit?.name ?? candidateId;
}

export function CurrentVoteCard({ data }: { data: ElectionDetailResponse }) {
    if (!data.currentVote) return null;

    const label =
        data.currentVote.candidateName ??
        resolveCandidateName(data.currentVote.candidateId, data.candidates);

    return (
        <Card>
            <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontWeight: 800 }}>現在の投票</div>
                <div>{label}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                    castedAt: {formatLocal(data.currentVote.castedAt)}
                </div>
            </div>
        </Card>
    );
}
