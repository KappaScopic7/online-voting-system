package com.bteam.ovs.voting.controller.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;
import java.util.UUID;

public record AllocVoteConfirmRequest(
        @NotNull String electionId,
        @NotNull Integer pointsTotal,
        @NotEmpty List<Item> items) {
    public record Item(
            @NotNull String type, // "CANDIDATE" | "NONE_SUPPORT"
            UUID candidateId,
            @NotNull @Positive Integer points) {
    }
}
