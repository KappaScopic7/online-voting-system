package com.bteam.ovs.profile.controller.dto;

import jakarta.validation.constraints.Pattern;

public record MeProfileUpdateRequest(
        @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "birthDateはyyyy-MM-dd形式で入力してください") String birthDate, // optional

        String prefCode, // optional
        String cityCode // optional
) {
}
