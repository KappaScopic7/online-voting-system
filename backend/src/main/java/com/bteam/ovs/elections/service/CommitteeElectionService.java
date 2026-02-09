package com.bteam.ovs.elections.service;

import com.bteam.ovs.elections.controller.dto.ElectionDetailResponse;
import com.bteam.ovs.elections.entity.BallotType;
import com.bteam.ovs.elections.entity.Election;
import com.bteam.ovs.elections.entity.ElectionStatus;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.voting.service.AllocationVotingService;
import com.bteam.ovs.voting.service.VotingService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class CommitteeElectionService {

    private final ElectionRepository electionRepo;
    private final VotingService votingService;
    private final AllocationVotingService allocVotingService;
    private final ElectionService electionService;

    public CommitteeElectionService(
            ElectionRepository electionRepo,
            VotingService votingService,
            AllocationVotingService allocVotingService,
            ElectionService electionService) {
        this.electionRepo = electionRepo;
        this.votingService = votingService;
        this.allocVotingService = allocVotingService;
        this.electionService = electionService;
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
        requireStatus(e, ElectionStatus.CLOSED);

        if (e.getBallotType() == BallotType.ALLOCATION) {
            allocVotingService.tally(electionId);
        } else {
            votingService.tally(electionId);
        }

        e.setTalliedAt(Instant.now());
        e.setStatus(ElectionStatus.TALLIED);
        return electionService.toDetailResponse(e);
    }

    @Transactional
    public ElectionDetailResponse publish(UUID electionId) {
        Election e = requireElection(electionId);
        requireStatus(e, ElectionStatus.TALLIED);
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

    private Election requireElection(UUID electionId) {
        return electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "ELECTION_NOT_FOUND",
                        "Election not found"));
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
