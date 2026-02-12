// backend/src/main/java/com/bteam/ovs/elections/service/CommitteeElectionAdminService.java
package com.bteam.ovs.elections.service;

import com.bteam.ovs.elections.entity.Election;
import com.bteam.ovs.elections.entity.ElectionStatus;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.shared.errors.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class CommitteeElectionAdminService {

    private final ElectionRepository electionRepo;

    public CommitteeElectionAdminService(ElectionRepository electionRepo) {
        this.electionRepo = electionRepo;
    }

    @Transactional
    public void setStatus(UUID electionId, ElectionStatus status) {
        Election e = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        if (status == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATUS", "statusが不正です");
        }

        e.setStatus(status);

        Instant now = Instant.now();
        switch (status) {
            case TALLIED -> {
                if (e.getTalliedAt() == null)
                    e.setTalliedAt(now);
            }
            case PUBLISHED -> {
                if (e.getPublishedAt() == null)
                    e.setPublishedAt(now);
            }
            case CLOSED -> {
                /* closedAtとか持ってないなら何もしない */ }
            default -> {
                /* そのまま */ }
        }
    }
}
