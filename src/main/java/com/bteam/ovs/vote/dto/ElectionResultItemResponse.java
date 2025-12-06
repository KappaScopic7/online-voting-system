package com.bteam.ovs.vote.dto;

public record ElectionResultItemResponse(
        Long candidateId,
        String candidateName,
        String partyName,
        long voteCount
) {
}
