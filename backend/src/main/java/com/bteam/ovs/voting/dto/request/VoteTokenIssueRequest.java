package com.bteam.ovs.voting.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VoteTokenIssueRequest(
        @NotBlank String electionId,
        @NotBlank String payload,

        // 追加
        @NotBlank @Pattern(regexp = "^\\d{4}$", message = "pinは4桁の数字である必要があります") String pin) {
}
