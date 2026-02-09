package com.bteam.ovs.elections.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "election", uniqueConstraints = {
        @UniqueConstraint(name = "uq_election_election_key", columnNames = "election_key")
})
@Getter
@Setter
public class Election {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "election_key", nullable = false, length = 120)
    private String electionKey;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(nullable = false, length = 2000)
    private String summary;

    @Enumerated(EnumType.STRING)
    @Column(name = "election_type", nullable = false, length = 30)
    private ElectionType electionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "ballot_type", nullable = false, length = 30)
    private BallotType ballotType;

    @Column(name = "district_pref_code", nullable = false, length = 10)
    private String districtPrefCode;

    @Column(name = "district_city_code", nullable = false, length = 10)
    private String districtCityCode;

    @Column(name = "district_label", nullable = false, length = 200)
    private String districtLabel;

    @Column(name = "starts_at", nullable = false)
    private Instant startsAt;

    @Column(name = "ends_at", nullable = false)
    private Instant endsAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ElectionStatus status = ElectionStatus.DRAFT;

    @Column(name = "tallied_at")
    private Instant talliedAt;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "allocation_target", nullable = false, length = 30)
    private AllocationTarget allocationTarget = AllocationTarget.CANDIDATE;

}
