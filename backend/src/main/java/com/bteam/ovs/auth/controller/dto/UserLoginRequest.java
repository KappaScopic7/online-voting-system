package com.bteam.ovs.auth.controller.dto;

import jakarta.validation.constraints.NotBlank;

public record UserLoginRequest(
        @NotBlank String email,
        @NotBlank String password
) {}
