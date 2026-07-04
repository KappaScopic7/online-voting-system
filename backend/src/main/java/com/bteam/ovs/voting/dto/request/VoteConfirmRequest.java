package com.bteam.ovs.voting.dto.request;

import jakarta.validation.constraints.NotBlank;

public record VoteConfirmRequest(
        @NotBlank String electionId,
        @NotBlank String type, // "CANDIDATE" | "NONE_SUPPORT"
        String candidateId // type=CANDIDATE のとき必須
) {
}
