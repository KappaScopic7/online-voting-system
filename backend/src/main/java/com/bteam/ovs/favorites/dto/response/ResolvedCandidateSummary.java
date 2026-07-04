package com.bteam.ovs.favorites.dto.response;

import java.util.UUID;

public record ResolvedCandidateSummary(
        UUID id,
        UUID electionId,
        String candidateKey,
        String name,
        Integer age,
        String title,
        String partyKey,
        int sortOrder) {
}
