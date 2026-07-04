package com.bteam.ovs.announcement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record PublicNoticeUpsertRequest(
        @NotBlank String title,
        @NotBlank String body,
        @NotNull Boolean pinned,
        @NotNull Instant publishedAt,
        Instant expiresAt) {
}
