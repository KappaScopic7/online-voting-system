package com.bteam.ovs.identity.api.dto;

import jakarta.validation.constraints.NotBlank;

public record IdentityLinkRequest(
        @NotBlank String citizenId
) {}
