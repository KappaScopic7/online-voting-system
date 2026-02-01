package com.bteam.ovs.candidates.controller.dto;

import java.util.UUID;

public record CandidateResponse(
        UUID candidateId,
        UUID electionId,
        String name) {
}
