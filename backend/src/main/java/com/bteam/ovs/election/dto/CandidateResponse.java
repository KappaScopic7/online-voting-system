package com.bteam.ovs.election.dto;

public record CandidateResponse(
        Long id,
        String name,
        String partyName,
        String profile
) {
}
