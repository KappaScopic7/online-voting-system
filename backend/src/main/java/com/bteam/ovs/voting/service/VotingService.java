package com.bteam.ovs.voting.service;

import com.bteam.ovs.candidates.repository.CandidateRepository;
import com.bteam.ovs.elections.entity.Election;
import com.bteam.ovs.elections.entity.ElectionStatus;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.elections.service.ElectionEligibilityService;
import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.shared.identity.CitizenIdResolver;
import com.bteam.ovs.shared.validation.UuidParsers;
import com.bteam.ovs.voting.controller.dto.VoteAllocConfirmRequest;
import com.bteam.ovs.voting.controller.dto.VoteHistoryItem;
import com.bteam.ovs.voting.controller.dto.VoteStartResponse;
import com.bteam.ovs.voting.entity.VoteAllocCast;
import com.bteam.ovs.voting.entity.VoteAllocItem;
import com.bteam.ovs.voting.entity.VoteCast;
import com.bteam.ovs.voting.repository.VoteAllocCastRepository;
import com.bteam.ovs.voting.repository.VoteAllocItemRepository;
import com.bteam.ovs.voting.repository.VoteCastRepository;
import com.bteam.ovs.voting.repository.VoteCurrentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
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

    // alloc系（このクラスに同居してる実装があるのでそのまま維持）
    private final VoteAllocCastRepository voteAllocCastRepo;
    private final VoteAllocItemRepository voteAllocItemRepo;

    public VotingService(
            CitizenIdResolver citizenIdResolver,
            ElectionEligibilityService electionEligibilityService,
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            VoteCastRepository voteCastRepo,
            VoteCurrentRepository voteCurrentRepo,
            VoteAllocCastRepository voteAllocCastRepo,
            VoteAllocItemRepository voteAllocItemRepo) {
        this.citizenIdResolver = citizenIdResolver;
        this.electionEligibilityService = electionEligibilityService;
        this.electionRepo = electionRepo;
        this.candidateRepo = candidateRepo;
        this.voteCastRepo = voteCastRepo;
        this.voteCurrentRepo = voteCurrentRepo;
        this.voteAllocCastRepo = voteAllocCastRepo;
        this.voteAllocItemRepo = voteAllocItemRepo;
    }

    public VoteStartResponse start(UUID accountId, UUID electionId) {
        electionEligibilityService.requireEligible(accountId, electionId);
        citizenIdResolver.requireCitizenId(accountId);

        Election election = requireElection(electionId);

        // ★追加：選管運用（OPEN + 期間内）でないと開始不可
        requireOpenAndWithinPeriod(election, Instant.now());

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

        Election election = requireElection(electionId);

        Instant now = Instant.now();
        // ★変更：選管運用（OPEN + 期間内）
        requireOpenAndWithinPeriod(election, now);

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
                resolveElectionStatus(election),
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
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        var elections = electionRepo.findAllById(electionIds).stream()
                .collect(Collectors.toMap(Election::getId, Function.identity()));

        var candidates = candidateRepo.findAllById(candidateIds).stream()
                .collect(Collectors.toMap(c -> c.getId(), Function.identity()));

        return votes.stream()
                .map(v -> {
                    var e = elections.get(v.getElectionId());

                    String status = "UNKNOWN";
                    String title = "(unknown election)";
                    if (e != null) {
                        status = resolveElectionStatus(e);
                        title = e.getTitle();
                    }

                    UUID cid = v.getCandidateId();
                    if (cid == null) {
                        return new VoteHistoryItem(
                                v.getId(),
                                v.getElectionId(),
                                title,
                                status,
                                null,
                                "誰も支持しない",
                                v.getCastedAt());
                    }

                    var c = candidates.get(cid);
                    return new VoteHistoryItem(
                            v.getId(),
                            v.getElectionId(),
                            title,
                            status,
                            cid,
                            c != null ? c.getName() : "(unknown candidate)",
                            v.getCastedAt());
                })
                .toList();
    }

    // ===== public vote token entry points =====

    public VoteStartResponse startByCitizen(UUID citizenId, UUID electionId) {
        electionEligibilityService.requireEligibleCitizen(citizenId, electionId);

        Election election = requireElection(electionId);

        // ★追加：選管運用（OPEN + 期間内）でないと開始不可
        requireOpenAndWithinPeriod(election, Instant.now());

        var candidates = candidateRepo.findByElectionId(electionId).stream()
                .map(c -> new VoteStartResponse.CandidateItem(c.getId(), c.getName()))
                .toList();

        return new VoteStartResponse(election.getId(), election.getTitle(), candidates);
    }

    @Transactional
    public VoteHistoryItem confirmByCitizen(UUID citizenId, UUID electionId, UUID candidateId) {
        electionEligibilityService.requireEligibleCitizen(citizenId, electionId);

        Election election = requireElection(electionId);

        Instant now = Instant.now();
        // ★変更：選管運用（OPEN + 期間内）
        requireOpenAndWithinPeriod(election, now);

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
                resolveElectionStatus(election),
                candidate.getId(),
                candidate.getName(),
                now);
    }

    @Transactional
    public VoteHistoryItem confirmNoneSupportByCitizen(UUID citizenId, UUID electionId) {
        electionEligibilityService.requireEligibleCitizen(citizenId, electionId);

        Election election = requireElection(electionId);

        Instant now = Instant.now();
        // ★変更：選管運用（OPEN + 期間内）
        requireOpenAndWithinPeriod(election, now);

        // 履歴
        var cast = new VoteCast();
        cast.setElectionId(electionId);
        cast.setCitizenId(citizenId);
        cast.setType("NONE_SUPPORT");
        cast.setCandidateId(null);
        cast.setCastedAt(now);
        voteCastRepo.save(cast);

        // 現在票（UPSERT）
        voteCurrentRepo.upsertCurrent(electionId, citizenId, "NONE_SUPPORT", null, now);

        return new VoteHistoryItem(
                cast.getId(),
                election.getId(),
                election.getTitle(),
                resolveElectionStatus(election),
                null,
                "誰も支持しない",
                now);
    }

    // ===== allocation confirm by citizen (このサービスに元々あったので維持) =====

    @Transactional
    public void confirmAllocByCitizen(UUID citizenId, UUID electionId, List<VoteAllocConfirmRequest.Item> items) {
        electionEligibilityService.requireEligibleCitizen(citizenId, electionId);

        Election election = requireElection(electionId);

        Instant now = Instant.now();
        // ★変更：選管運用（OPEN + 期間内）
        requireOpenAndWithinPeriod(election, now);

        if (items == null || items.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ALLOC_ITEMS", "itemsが空です");
        }

        int total = 0;
        int noneSupportPts = 0;

        // candidateId -> points（重複は合算）
        Map<UUID, Integer> candPts = new HashMap<>();

        for (var it : items) {
            if (it == null)
                continue;

            Integer ptsObj = it.points();
            int pts = (ptsObj == null ? 0 : ptsObj);

            if (pts <= 0 || pts > 100) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_POINTS", "pointsが不正です");
            }
            total += pts;

            String t = it.targetType();
            if ("NONE_SUPPORT".equals(t)) {
                noneSupportPts += pts;
                continue;
            }
            if (!"CANDIDATE".equals(t)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_TARGET_TYPE", "targetTypeが不正です");
            }

            if (it.candidateId() == null || it.candidateId().isBlank()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CANDIDATE_ID", "candidateIdが不正です");
            }

            UUID cid = UuidParsers.parseOr400(it.candidateId(), "INVALID_CANDIDATE_ID", "candidateIdが不正です");

            if (!candidateRepo.existsByIdAndElectionId(cid, electionId)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CANDIDATE", "候補が不正です");
            }

            candPts.merge(cid, pts, Integer::sum);
        }

        // 合計100（VoteAllocCast.pointsTotal と一致させる）
        if (total != 100) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_TOTAL_POINTS", "points合計は100である必要があります");
        }

        // Cast を 1人1選挙で維持（現在票）
        VoteAllocCast cast = voteAllocCastRepo.findByElectionIdAndCitizenId(electionId, citizenId)
                .orElseGet(() -> {
                    var c = new VoteAllocCast();
                    c.setElectionId(electionId);
                    c.setCitizenId(citizenId);
                    return c;
                });

        cast.setCastedAt(now);
        cast.setPointsTotal(100);
        cast = voteAllocCastRepo.save(cast);

        // items差し替え
        voteAllocItemRepo.deleteByCastId(cast.getId());

        if (noneSupportPts > 0) {
            var ni = new VoteAllocItem();
            ni.setCastId(cast.getId());
            ni.setTargetType(VoteAllocItem.TargetType.NONE_SUPPORT);
            ni.setCandidateId(null);
            ni.setPoints(noneSupportPts);
            voteAllocItemRepo.save(ni);
        }

        for (var e : candPts.entrySet()) {
            var vi = new VoteAllocItem();
            vi.setCastId(cast.getId());
            vi.setTargetType(VoteAllocItem.TargetType.CANDIDATE);
            vi.setCandidateId(e.getKey());
            vi.setPoints(e.getValue());
            voteAllocItemRepo.save(vi);
        }
    }

    // ★ committee の tally ボタンから呼ばれる。今は no-op でOK（結果は ElectionService が都度集計）
    @Transactional
    public void tally(UUID electionId) {
        // no-op
    }

    // ===== helpers =====

    private Election requireElection(UUID electionId) {
        return electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "ELECTION_NOT_FOUND",
                        "選挙が存在しません"));
    }

    private void requireOpenAndWithinPeriod(Election election, Instant now) {
        if (election.getStatus() != ElectionStatus.OPEN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ELECTION_NOT_OPEN", "現在この選挙は投票できません");
        }
        boolean withinPeriod = !now.isBefore(election.getStartsAt()) && now.isBefore(election.getEndsAt());
        if (!withinPeriod) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ELECTION_NOT_ONGOING", "投票可能期間外です");
        }
    }

    private String resolveElectionStatus(Election election) {
        ElectionStatus s = election.getStatus();
        if (s == null)
            return "UNKNOWN";
        return switch (s) {
            case DRAFT, READY -> "UPCOMING";
            case OPEN -> "ONGOING";
            case CLOSED, TALLIED, PUBLISHED, ARCHIVED -> "ENDED";
        };
    }
}
