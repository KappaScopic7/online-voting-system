package com.bteam.ovs.vote.dto;

public record MyVoteResponse(
        Long candidateId,
        String candidateName,
        String partyName
) {
}
