package com.bteam.ovs.announcement.dto.response;

import com.bteam.ovs.announcement.entity.PublicNotice;

import java.time.Instant;
import java.util.UUID;

public record PublicNoticeResponse(
        UUID id,
        String title,
        String body,
        boolean pinned,
        Instant publishedAt,
        Instant expiresAt,
        Instant updatedAt) {
    public static PublicNoticeResponse from(PublicNotice n) {
        return new PublicNoticeResponse(
                n.getId(),
                n.getTitle(),
                n.getBody(),
                n.isPinned(),
                n.getPublishedAt(),
                n.getExpiresAt(),
                n.getUpdatedAt());
    }
}
