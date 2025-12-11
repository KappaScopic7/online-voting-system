package com.bteam.ovs.election.dto;

public record ElectionResultItem(
        Long candidateId,
        String candidateName,
        String partyName,
        long voteCount
) {
}
