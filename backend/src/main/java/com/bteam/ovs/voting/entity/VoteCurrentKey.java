package com.bteam.ovs.voting.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class VoteCurrentKey implements Serializable {

    private UUID electionId;
    private UUID citizenId;

    public VoteCurrentKey() {}

    public VoteCurrentKey(UUID electionId, UUID citizenId) {
        this.electionId = electionId;
        this.citizenId = citizenId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof VoteCurrentKey that)) return false;
        return Objects.equals(electionId, that.electionId)
            && Objects.equals(citizenId, that.citizenId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(electionId, citizenId);
    }
}
