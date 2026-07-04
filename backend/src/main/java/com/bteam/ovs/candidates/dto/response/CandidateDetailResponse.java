// backend/src/main/java/com/bteam/ovs/elections/controller/dto/CandidateDetailResponse.java
package com.bteam.ovs.candidates.dto.response;

import java.util.List;
import java.util.UUID;

public record CandidateDetailResponse(
        UUID candidateId,
        UUID electionId,
        String candidateKey,
        String name,
        Integer age,
        String title,
        String bio,
        List<String> policies,
        String websiteUrl,
        String imageUrl,
        PartyEmbed party) {
    public record PartyEmbed(
            String partyKey,
            String shortName,
            String name,
            String color,
            String description,
            List<String> ideologyTags) {
    }
}
