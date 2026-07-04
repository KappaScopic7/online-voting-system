package com.bteam.ovs.candidates.dto.response;

import java.util.UUID;

public record CandidateResponse(
        UUID candidateId,
        UUID electionId,
        String name) {
}
