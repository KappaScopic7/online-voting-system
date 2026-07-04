package com.bteam.ovs.voting.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record JudgeReviewConfirmRequest(
        @NotBlank String electionId,
        @NotEmpty @Valid List<Item> choices) {
    public record Item(
            @NotBlank String judgeCandidateId,
            @NotBlank String choice // "OK" or "NO"
    ) {
    }
}
