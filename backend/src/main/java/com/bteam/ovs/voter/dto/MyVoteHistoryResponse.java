package com.bteam.ovs.voter.dto;

import com.bteam.ovs.election.domain.ElectionStatus;

import java.time.LocalDateTime;

public record MyVoteHistoryResponse(
        Long electionId,
        String electionCode,
        String electionName,
        String districtName,
        ElectionStatus electionStatus,
        LocalDateTime electionStartsAt,
        LocalDateTime electionEndsAt,
        Long voteId,
        LocalDateTime votedAt,
        Long candidateId,
        String candidateName,
        String partyName
) {
}
