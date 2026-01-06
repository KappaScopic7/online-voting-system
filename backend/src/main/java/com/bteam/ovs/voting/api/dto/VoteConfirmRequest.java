package com.bteam.ovs.voting.api.dto;

import jakarta.validation.constraints.NotBlank;

public record VoteConfirmRequest(
        @NotBlank String electionId,
        @NotBlank String candidateId
) {}
