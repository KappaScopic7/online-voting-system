package com.bteam.ovs.voting.controller.dto;

import jakarta.validation.constraints.NotBlank;

public record VoteConfirmRequest(
        @NotBlank String electionId,
        @NotBlank String candidateId
) {}
