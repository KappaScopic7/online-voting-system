package com.bteam.ovs.elections.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "election")
@Getter
@Setter
@NoArgsConstructor
public class Election {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "starts_at", nullable = false, columnDefinition = "timestamptz")
    private Instant startsAt;

    @Column(name = "ends_at", nullable = false, columnDefinition = "timestamptz")
    private Instant endsAt;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
    }
}
