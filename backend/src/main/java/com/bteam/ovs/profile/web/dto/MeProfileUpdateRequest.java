package com.bteam.ovs.profile.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record MeProfileUpdateRequest(
        @NotBlank
        @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "birthDateはyyyy-MM-dd形式で入力してください")
        String birthDate,

        @NotBlank
        String prefCode,

        @NotBlank
        String cityCode
) {}
