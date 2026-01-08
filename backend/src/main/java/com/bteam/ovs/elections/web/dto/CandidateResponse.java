package com.bteam.ovs.elections.web.dto;

import java.util.UUID;

public record CandidateResponse(
        UUID candidateId,
        UUID electionId,
        String name
) {}
