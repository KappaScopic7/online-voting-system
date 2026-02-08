package com.bteam.ovs.publicapi.voting.dto;

import jakarta.validation.constraints.NotBlank;

public record VoteTokenIssueRequest(
        @NotBlank String electionId,
        @NotBlank String payload // NFC payload
) {
}
