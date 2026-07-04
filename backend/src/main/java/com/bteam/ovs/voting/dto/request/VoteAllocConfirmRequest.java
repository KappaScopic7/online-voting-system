package com.bteam.ovs.voting.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record VoteAllocConfirmRequest(
        @NotBlank String electionId,
        @NotEmpty @Valid List<Item> items) {
    public record Item(
            @NotNull String targetType, // "CANDIDATE" | "NONE_SUPPORT"
            String candidateId, // CANDIDATE のとき必須
            @NotNull Integer points // 1..100
    ) {
    }
}
