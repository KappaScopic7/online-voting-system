package com.bteam.ovs.auth.web.dto;

import jakarta.validation.constraints.NotBlank;

public record CommitteeLoginRequest(
        @NotBlank String loginId,
        @NotBlank String password
) {}
