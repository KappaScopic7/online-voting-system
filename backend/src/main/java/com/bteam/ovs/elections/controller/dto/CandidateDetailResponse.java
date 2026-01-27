// backend/src/main/java/com/bteam/ovs/elections/controller/dto/CandidateDetailResponse.java
package com.bteam.ovs.elections.controller.dto;

import java.util.List;
import java.util.UUID;

public record CandidateDetailResponse(
        UUID candidateId,
        UUID electionId,

        String candidateKey,
        String name,
        Integer age,

        PartySummary party, // ★ここ（無所属は null）

        String title,
        String bio,
        List<String> policies,

        String websiteUrl,
        String imageUrl,

        int sortOrder) {
}
