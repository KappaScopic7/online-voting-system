package com.bteam.ovs.voting.dto.request;

import jakarta.validation.constraints.NotBlank;

public record VoteCreateRequest(
        @NotBlank String candidateId) {
}
