package com.bteam.ovs.announcement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SystemAnnouncementUpdateRequest(
        @NotNull Boolean enabled,
        @NotBlank String actor, // "ADMIN" | "COMMITTEE"
        @NotBlank String message) {
}
