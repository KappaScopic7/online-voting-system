import type { VoteHistoryItem } from "../../api/votes";
import type { AllocVoteHistoryItem } from "../../model/allocVotingTypes";

export type VoteMethod = "NORMAL" | "ALLOC" | "MIXED" | "NONE";
export type ViewMode = "ALL" | "NORMAL" | "ALLOC";

export type UnifiedGroup = {
    electionId: string;
    electionTitle: string;
    normal: VoteHistoryItem[];
    alloc: AllocVoteHistoryItem[];
    method: VoteMethod;
    latestAt: string;
    latestStatus: string;
};
