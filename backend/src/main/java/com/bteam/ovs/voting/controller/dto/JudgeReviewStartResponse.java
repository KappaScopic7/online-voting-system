package com.bteam.ovs.voting.controller.dto;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public record JudgeReviewStartResponse(
        UUID electionId,
        String electionTitle,
        List<JudgeItem> judges,
        Map<UUID, String> current // judgeCandidateId -> "OK"/"NO"（無ければnull）
) {
    public record JudgeItem(UUID candidateId, String name, String title) {
    }
}
