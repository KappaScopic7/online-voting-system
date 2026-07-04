package com.bteam.ovs.identity.dto.request;

import jakarta.validation.constraints.NotBlank;

public record IdentityLinkRequest(
        @NotBlank String citizenId, String pin) {
}
