package com.bteam.ovs.voting.api.dto;

import jakarta.validation.constraints.NotBlank;

public record VoteCreateRequest(
        @NotBlank String candidateId
) {}
