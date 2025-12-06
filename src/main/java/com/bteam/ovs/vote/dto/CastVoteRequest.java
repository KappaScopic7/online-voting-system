package com.bteam.ovs.vote.dto;

import jakarta.validation.constraints.NotNull;

public record CastVoteRequest(
        @NotNull Long candidateId
) {
}
