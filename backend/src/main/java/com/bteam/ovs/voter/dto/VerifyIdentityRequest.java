package com.bteam.ovs.voter.dto;

import jakarta.validation.constraints.NotBlank;

public record VerifyIdentityRequest(
        @NotBlank String cardId,
        @NotBlank String pin
) {}
