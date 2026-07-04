package com.bteam.ovs.voting.dto.response;

import java.time.Instant;
import java.util.UUID;

public record VoteHistoryItem(
        UUID voteId,
        UUID electionId,
        String electionTitle,
        String electionStatus,

        String type, // "CANDIDATE" | "NONE_SUPPORT" | "JUDGE_REVIEW"
        UUID targetId, // candidateId / judgeCandidateId / null
        String label, // candidateName / "誰も支持しない" / judgeName
        Boolean approve, // JUDGE_REVIEW のみ（OK=true / NO=false）

        Instant castedAt) {
}
