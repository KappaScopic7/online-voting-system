package com.bteam.ovs.auth.dto.request;

import jakarta.validation.constraints.NotBlank;

public record StaffLoginRequest(
        @NotBlank String loginId,
        @NotBlank String password) {
}
