// backend/src/main/java/com/bteam/ovs/elections/service/CommitteeElectionAdminService.java
package com.bteam.ovs.elections.service;

import com.bteam.ovs.elections.controller.dto.ElectionDetailResponse;
import com.bteam.ovs.elections.entity.Election;
import com.bteam.ovs.elections.entity.ElectionStatus;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.elections.service.tally.ElectionTallyJobService;
import com.bteam.ovs.shared.errors.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class CommitteeElectionAdminService {

    private final ElectionRepository electionRepo;
    private final ElectionService electionService;
    private final ElectionTallyJobService tallyJobService;

    public CommitteeElectionAdminService(
            ElectionRepository electionRepo,
            ElectionService electionService,
            ElectionTallyJobService tallyJobService) {
        this.electionRepo = electionRepo;
        this.electionService = electionService;
        this.tallyJobService = tallyJobService;
    }

    @Transactional
    public ElectionDetailResponse markReady(UUID electionId) {
        Election e = requireElection(electionId);
        requireStatus(e, ElectionStatus.DRAFT);
        e.setStatus(ElectionStatus.READY);
        return electionService.toDetailResponse(e);
    }

    @Transactional
    public ElectionDetailResponse start(UUID electionId) {
        Election e = requireElection(electionId);
        requireStatus(e, ElectionStatus.READY);
        e.setStatus(ElectionStatus.OPEN);
        return electionService.toDetailResponse(e);
    }

    @Transactional
    public ElectionDetailResponse close(UUID electionId) {
        Election e = requireElection(electionId);
        requireStatus(e, ElectionStatus.OPEN);
        e.setStatus(ElectionStatus.CLOSED);
        return electionService.toDetailResponse(e);
    }

    @Transactional
    public ElectionDetailResponse tally(UUID electionId) {
        Election e = requireElection(electionId);

        // ✅ 二重実行・状態不正をUC向けに固定
        if (e.getStatus() == ElectionStatus.TALLYING) {
            throw new ApiException(HttpStatus.CONFLICT, "TALLY_IN_PROGRESS", "すでに集計中です");
        }
        if (e.getStatus() == ElectionStatus.TALLIED || e.getStatus() == ElectionStatus.PUBLISHED) {
            throw new ApiException(HttpStatus.CONFLICT, "ALREADY_TALLIED", "すでに集計済みです");
        }
        if (e.getStatus() != ElectionStatus.CLOSED) {
            throw new ApiException(HttpStatus.CONFLICT, "ELECTION_STATUS_INVALID", "締切後のみ集計できます");
        }

        e.setStatus(ElectionStatus.TALLYING);
        tallyJobService.enqueue(electionId);

        return electionService.toDetailResponse(e);
    }

    @Transactional
    public ElectionDetailResponse publish(UUID electionId) {
        Election e = requireElection(electionId);
        requireStatus(e, ElectionStatus.TALLIED);

        if (e.getTalliedAt() == null) {
            throw new ApiException(HttpStatus.CONFLICT, "ELECTION_NOT_TALLIED", "集計が完了していません");
        }

        if (e.getPublishedAt() == null)
            e.setPublishedAt(Instant.now());
        e.setStatus(ElectionStatus.PUBLISHED);

        return electionService.toDetailResponse(e);
    }

    @Transactional
    public ElectionDetailResponse unpublish(UUID electionId) {
        Election e = requireElection(electionId);
        requireStatus(e, ElectionStatus.PUBLISHED);

        e.setPublishedAt(null);
        e.setStatus(ElectionStatus.TALLIED);

        return electionService.toDetailResponse(e);
    }

    // setStatus を残すなら dev 専用にするのが安全（後述）
    @Transactional
    public void setStatus(UUID electionId, ElectionStatus status) {
        throw new ApiException(HttpStatus.NOT_IMPLEMENTED, "NOT_IMPLEMENTED", "dev専用にするならここ実装");
    }

    private Election requireElection(UUID electionId) {
        return electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));
    }

    private static void requireStatus(Election e, ElectionStatus expected) {
        if (e.getStatus() != expected) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "ELECTION_STATUS_INVALID",
                    "Expected status " + expected + " but was " + e.getStatus());
        }
    }
}
