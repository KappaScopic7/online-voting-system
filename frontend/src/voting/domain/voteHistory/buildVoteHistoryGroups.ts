import type { VoteHistoryItem } from "../../api/votes";
import type { AllocVoteHistoryItem } from "../../model/allocVotingTypes";
import type { UnifiedGroup } from "./voteHistoryTypes";

function cmpDescIso(a?: string | null, b?: string | null) {
    return (b ?? "").localeCompare(a ?? "");
}

export function buildVoteHistoryGroups(
    normalItems: VoteHistoryItem[] | null,
    allocItems: AllocVoteHistoryItem[] | null,
): UnifiedGroup[] {
    if (!normalItems || !allocItems) return [];

    const map = new Map<string, UnifiedGroup>();

    const ensure = (electionId: string, electionTitle: string) => {
        const existing = map.get(electionId);
        if (existing) {
            if (!existing.electionTitle && electionTitle) {
                existing.electionTitle = electionTitle;
            }
            return existing;
        }
        const g: UnifiedGroup = {
            electionId,
            electionTitle,
            normal: [],
            alloc: [],
            method: "NONE",
            latestAt: "",
            latestStatus: "",
        };
        map.set(electionId, g);
        return g;
    };

    for (const v of normalItems)
        ensure(v.electionId, v.electionTitle).normal.push(v);
    for (const v of allocItems)
        ensure(v.electionId, v.electionTitle).alloc.push(v);

    for (const g of map.values()) {
        g.normal.sort((a, b) => cmpDescIso(a.castedAt, b.castedAt));
        g.alloc.sort((a, b) => cmpDescIso(a.castedAt, b.castedAt));

        // method detect
        const hasN = g.normal.some((v) => v.type !== "JUDGE_REVIEW");
        const hasJR = g.normal.some((v) => v.type === "JUDGE_REVIEW");
        const hasA = g.alloc.length > 0;

        g.method =
            hasA && (hasN || hasJR)
                ? "MIXED"
                : hasA
                  ? "ALLOC"
                  : hasN || hasJR
                    ? "NORMAL"
                    : "NONE";

        // latest
        const latestNormal = g.normal[0]?.castedAt ?? "";
        const latestAlloc = g.alloc[0]?.castedAt ?? "";

        const latestAt =
            latestNormal.localeCompare(latestAlloc) >= 0
                ? latestNormal
                : latestAlloc;

        const latestStatus =
            (latestAt === latestNormal
                ? g.normal[0]?.electionStatus
                : g.alloc[0]?.electionStatus) ??
            g.normal[0]?.electionStatus ??
            g.alloc[0]?.electionStatus ??
            "";

        g.latestAt = latestAt;
        g.latestStatus = latestStatus;
    }

    return Array.from(map.values()).sort((a, b) =>
        cmpDescIso(a.latestAt, b.latestAt),
    );
}
