// backend/src/main/java/com/bteam/ovs/elections/entity/Election.java
package com.bteam.ovs.elections.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "election", uniqueConstraints = {
        @UniqueConstraint(name = "uq_election_election_key", columnNames = "election_key")
})
public class Election {
    @Id @GeneratedValue
    private UUID id;

    @Column(name = "election_key", nullable = false, length = 120)
    private String electionKey;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(nullable = false, length = 2000)
    private String summary;

    @Enumerated(EnumType.STRING) @Column(name = "election_type", nullable = false, length = 30)
    private ElectionType electionType;

    @Enumerated(EnumType.STRING) @Column(name = "ballot_type", nullable = false, length = 30)
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

    // getters/setters
    public UUID getId() {
        return id;
    }

    public String getElectionKey() {
        return electionKey;
    }

    public void setElectionKey(String electionKey) {
        this.electionKey = electionKey;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public ElectionType getElectionType() {
        return electionType;
    }

    public void setElectionType(ElectionType electionType) {
        this.electionType = electionType;
    }

    public BallotType getBallotType() {
        return ballotType;
    }

    public void setBallotType(BallotType ballotType) {
        this.ballotType = ballotType;
    }

    public String getDistrictPrefCode() {
        return districtPrefCode;
    }

    public void setDistrictPrefCode(String districtPrefCode) {
        this.districtPrefCode = districtPrefCode;
    }

    public String getDistrictCityCode() {
        return districtCityCode;
    }

    public void setDistrictCityCode(String districtCityCode) {
        this.districtCityCode = districtCityCode;
    }

    public String getDistrictLabel() {
        return districtLabel;
    }

    public void setDistrictLabel(String districtLabel) {
        this.districtLabel = districtLabel;
    }

    public Instant getStartsAt() {
        return startsAt;
    }

    public void setStartsAt(Instant startsAt) {
        this.startsAt = startsAt;
    }

    public Instant getEndsAt() {
        return endsAt;
    }

    public void setEndsAt(Instant endsAt) {
        this.endsAt = endsAt;
    }
}
