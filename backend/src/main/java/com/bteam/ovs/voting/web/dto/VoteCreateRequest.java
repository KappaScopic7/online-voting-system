package com.bteam.ovs.voting.web.dto;

import jakarta.validation.constraints.NotBlank;

public record VoteCreateRequest(
        @NotBlank String candidateId
) {}
