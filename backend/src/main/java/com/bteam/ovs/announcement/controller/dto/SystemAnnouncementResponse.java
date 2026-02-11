package com.bteam.ovs.announcement.controller.dto;

import com.bteam.ovs.announcement.entity.SystemAnnouncement;
import java.time.Instant;

public record SystemAnnouncementResponse(
        boolean enabled,
        String actor, // "ADMIN" | "COMMITTEE"
        String message,
        Instant updatedAt) {
    public static SystemAnnouncementResponse from(SystemAnnouncement a) {
        return new SystemAnnouncementResponse(
                a.isEnabled(),
                a.getActor().name(),
                a.getMessage(),
                a.getUpdatedAt());
    }
}
