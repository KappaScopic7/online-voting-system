package com.bteam.ovs.identity.web.dto;

import jakarta.validation.constraints.NotBlank;

public record IdentityLinkRequest(
        @NotBlank String citizenId
) {}
