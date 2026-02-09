package com.bteam.ovs.voting.controller.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record AllocVoteConfirmRequest(
        @NotNull String electionId,
        @NotNull Integer pointsTotal,
        @NotEmpty List<Item> items) {
    public record Item(
            @NotNull String type,
            @NotNull String targetId,
            @NotNull @Positive Integer points) {
    }
}
