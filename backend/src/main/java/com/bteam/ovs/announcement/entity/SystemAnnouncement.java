package com.bteam.ovs.announcement.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "system_announcement")
@Getter
@Setter
public class SystemAnnouncement {

    public enum Actor {
        ADMIN,
        COMMITTEE
    }

    @Id
    @Column(nullable = false)
    private UUID id;

    @Column(nullable = false)
    private boolean enabled;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Actor actor;

    @Column(nullable = false, length = 4000)
    private String message;

    @Column(nullable = false)
    private Instant updatedAt;

}
