package com.bteam.ovs.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record NfcLoginRequest(
        @NotBlank String payload,
        @NotBlank @Pattern(regexp = "^\\d{4}$", message = "pinは4桁の数字である必要があります") String pin,
        @NotBlank String electionId) {
}
