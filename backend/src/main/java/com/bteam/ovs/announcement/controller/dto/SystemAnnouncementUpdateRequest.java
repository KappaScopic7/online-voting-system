package com.bteam.ovs.announcement.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SystemAnnouncementUpdateRequest(
        @NotNull Boolean enabled,
        @NotBlank String actor, // "ADMIN" | "COMMITTEE"
        @NotBlank String message) {
}
