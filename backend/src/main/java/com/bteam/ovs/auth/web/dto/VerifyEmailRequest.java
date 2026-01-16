package com.bteam.ovs.auth.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record VerifyEmailRequest(
        @Email @NotBlank String email,
        @NotBlank String code
) {}
