package com.bteam.ovs.identity.controller.dto;

import jakarta.validation.constraints.NotBlank;

public record IdentityLinkByNfcRequest(
        @NotBlank String payload,
        @NotBlank String pin) {
}
