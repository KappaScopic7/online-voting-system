package com.bteam.ovs.auth.controller.dto;

import jakarta.validation.constraints.NotBlank;

public record StaffLoginRequest(
        @NotBlank String loginId,
        @NotBlank String password
) {}
