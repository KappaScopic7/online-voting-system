package com.bteam.ovs.auth.web.dto;

import jakarta.validation.constraints.NotBlank;

public record VoterLoginRequest(
        @NotBlank String email,
        @NotBlank String password
) {}
