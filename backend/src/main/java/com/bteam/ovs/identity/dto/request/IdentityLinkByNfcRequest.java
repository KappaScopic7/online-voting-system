package com.bteam.ovs.identity.dto.request;

import jakarta.validation.constraints.NotBlank;

public record IdentityLinkByNfcRequest(
        @NotBlank String payload,
        @NotBlank String pin) {
}
