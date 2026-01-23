package com.bteam.ovs.voting.controller.dto;

import jakarta.validation.constraints.NotBlank;

public record VoteCreateRequest(
        @NotBlank String candidateId
) {}
