package com.bteam.ovs.voting.service;

import com.bteam.ovs.candidates.repository.CandidateRepository;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.elections.service.ElectionEligibilityService;
import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.shared.identity.CitizenIdResolver;
import com.bteam.ovs.voting.controller.dto.VoteHistoryItem;
import com.bteam.ovs.voting.controller.dto.VoteStartResponse;
import com.bteam.ovs.voting.entity.VoteCast;
// import com.bteam.ovs.voting.entity.VoteCurrent;
import com.bteam.ovs.voting.repository.VoteCastRepository;
import com.bteam.ovs.voting.repository.VoteCurrentRepository;

// import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class VotingService {

    private final CitizenIdResolver citizenIdResolver;
    private final ElectionEligibilityService electionEligibilityService;
    private final ElectionRepository electionRepo;
    private final CandidateRepository candidateRepo;
    private final VoteCastRepository voteCastRepo;
    private final VoteCurrentRepository voteCurrentRepo;

    public VotingService(
            CitizenIdResolver citizenIdResolver,
            ElectionEligibilityService electionEligibilityService,
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            VoteCastRepository voteCastRepo,
            VoteCurrentRepository voteCurrentRepo) {
        this.citizenIdResolver = citizenIdResolver;
        this.electionEligibilityService = electionEligibilityService;
        this.electionRepo = electionRepo;
        this.candidateRepo = candidateRepo;
        this.voteCastRepo = voteCastRepo;
        this.voteCurrentRepo = voteCurrentRepo;
    }

    public VoteStartResponse start(UUID accountId, UUID electionId) {
        electionEligibilityService.requireEligible(accountId, electionId);

        citizenIdResolver.requireCitizenId(accountId);

        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND",
                        "選挙が存在しません"));

        var candidates = candidateRepo.findByElectionId(electionId).stream()
                .map(c -> new VoteStartResponse.CandidateItem(c.getId(), c.getName()))
                .toList();

        return new VoteStartResponse(election.getId(), election.getTitle(), candidates);
    }

    @Transactional
    public VoteHistoryItem confirmCandidate(UUID accountId, UUID electionId, UUID candidateId) {
        return confirmInternal(accountId, electionId, "CANDIDATE", candidateId);
    }

    @Transactional
    public VoteHistoryItem confirmNoneSupport(UUID accountId, UUID electionId) {
        return confirmInternal(accountId, electionId, "NONE_SUPPORT", null);
    }

    private VoteHistoryItem confirmInternal(UUID accountId, UUID electionId, String type, UUID candidateIdOrNull) {
        electionEligibilityService.requireEligible(accountId, electionId);
        UUID citizenId = citizenIdResolver.requireCitizenId(accountId);

        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        var now = Instant.now();
        boolean withinPeriod = !now.isBefore(election.getStartsAt()) && now.isBefore(election.getEndsAt());
        if (!withinPeriod)
            throw new ApiException(HttpStatus.FORBIDDEN, "ELECTION_NOT_ONGOING", "投票可能期間外です");

        String candidateName;
        UUID candidateId;

        if ("CANDIDATE".equals(type)) {
            if (candidateIdOrNull == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CANDIDATE", "候補が不正です");
            }
            if (!candidateRepo.existsByIdAndElectionId(candidateIdOrNull, electionId)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CANDIDATE", "候補が不正です");
            }
            var candidate = candidateRepo.findById(candidateIdOrNull)
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CANDIDATE", "候補が不正です"));
            candidateId = candidate.getId();
            candidateName = candidate.getName();
        } else if ("NONE_SUPPORT".equals(type)) {
            candidateId = null;
            candidateName = "誰も支持しない";
        } else {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_VOTE_TYPE", "typeが不正です");
        }

        // 履歴
        var cast = new VoteCast();
        cast.setElectionId(electionId);
        cast.setCitizenId(citizenId);
        cast.setCandidateId(candidateId);
        cast.setType(type);
        cast.setCastedAt(now);
        voteCastRepo.save(cast);

        // 現在票（UPSERT）
        voteCurrentRepo.upsertCurrent(electionId, citizenId, type, candidateId, now);

        return new VoteHistoryItem(
                cast.getId(),
                election.getId(),
                election.getTitle(),
                resolveElectionStatus(now, election.getStartsAt(), election.getEndsAt()),
                candidateId,
                candidateName,
                now);
    }

    public List<VoteHistoryItem> history(UUID accountId) {
        UUID citizenId = citizenIdResolver.requireCitizenId(accountId);

        var votes = voteCastRepo.findByCitizenIdOrderByCastedAtDesc(citizenId);
        if (votes.isEmpty())
            return List.of();

        var electionIds = votes.stream().map(VoteCast::getElectionId).collect(Collectors.toSet());
        var candidateIds = votes.stream()
                .map(VoteCast::getCandidateId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());

        var elections = electionRepo.findAllById(electionIds).stream()
                .collect(Collectors.toMap(e -> e.getId(), Function.identity()));

        var candidates = candidateRepo.findAllById(candidateIds).stream()
                .collect(Collectors.toMap(c -> c.getId(), Function.identity()));

        return votes.stream()
                .map(v -> {
                    var e = elections.get(v.getElectionId());

                    String status = "UNKNOWN";
                    if (e != null) {
                        status = resolveElectionStatus(Instant.now(), e.getStartsAt(), e.getEndsAt());
                    }

                    UUID cid = v.getCandidateId();
                    if (cid == null) {
                        return new VoteHistoryItem(
                                v.getId(),
                                v.getElectionId(),
                                e != null ? e.getTitle() : "(unknown election)",
                                status,
                                null,
                                "誰も支持しない",
                                v.getCastedAt());
                    }

                    var c = candidates.get(cid);
                    return new VoteHistoryItem(
                            v.getId(),
                            v.getElectionId(),
                            e != null ? e.getTitle() : "(unknown election)",
                            status,
                            cid,
                            c != null ? c.getName() : "(unknown candidate)",
                            v.getCastedAt());
                })
                .toList();

    }

    private String resolveElectionStatus(Instant now, Instant startsAt, Instant endsAt) {
        if (now.isBefore(startsAt)) {
            return "UPCOMING";
        }
        if (!now.isBefore(endsAt)) {
            return "ENDED";
        }
        return "ONGOING";
    }

    public VoteStartResponse startByCitizen(UUID citizenId, UUID electionId) {
        // 公開投票でも投票権チェック（年齢など）
        electionEligibilityService.requireEligibleCitizen(citizenId, electionId);

        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND",
                        "選挙が存在しません"));

        var candidates = candidateRepo.findByElectionId(electionId).stream()
                .map(c -> new VoteStartResponse.CandidateItem(c.getId(), c.getName()))
                .toList();

        return new VoteStartResponse(election.getId(), election.getTitle(), candidates);
    }

    @Transactional
    public VoteHistoryItem confirmByCitizen(UUID citizenId, UUID electionId, UUID candidateId) {
        electionEligibilityService.requireEligibleCitizen(citizenId, electionId);

        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        var now = Instant.now();
        boolean withinPeriod = !now.isBefore(election.getStartsAt()) && now.isBefore(election.getEndsAt());
        if (!withinPeriod) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ELECTION_NOT_ONGOING", "投票可能期間外です");
        }

        if (!candidateRepo.existsByIdAndElectionId(candidateId, electionId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CANDIDATE", "候補が不正です");
        }
        var candidate = candidateRepo.findById(candidateId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CANDIDATE", "候補が不正です"));

        // 履歴
        var cast = new VoteCast();
        cast.setElectionId(electionId);
        cast.setCitizenId(citizenId);
        cast.setType("CANDIDATE");
        cast.setCandidateId(candidateId);
        cast.setCastedAt(now);
        voteCastRepo.save(cast);

        // 現在票（UPSERT）
        voteCurrentRepo.upsertCurrent(electionId, citizenId, "CANDIDATE", candidateId, now);

        return new VoteHistoryItem(
                cast.getId(),
                election.getId(),
                election.getTitle(),
                resolveElectionStatus(now, election.getStartsAt(), election.getEndsAt()),
                candidate.getId(),
                candidate.getName(),
                now);
    }

}
