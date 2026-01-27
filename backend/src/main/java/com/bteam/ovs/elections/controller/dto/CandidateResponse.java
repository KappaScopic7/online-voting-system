package com.bteam.ovs.elections.controller.dto;

import java.util.UUID;

public record CandidateResponse(
        UUID candidateId,
        UUID electionId,
        String name) {
}
