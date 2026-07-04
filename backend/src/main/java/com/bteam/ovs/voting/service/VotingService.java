package com.bteam.ovs.voting.service;

import com.bteam.ovs.candidates.repository.CandidateRepository;
import com.bteam.ovs.elections.entity.Election;
import com.bteam.ovs.elections.entity.ElectionStatus;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.elections.service.ElectionEligibilityService;
import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.shared.identity.CitizenIdResolver;
import com.bteam.ovs.shared.validation.UuidParsers;
import com.bteam.ovs.voting.dto.request.JudgeReviewConfirmRequest;
import com.bteam.ovs.voting.dto.request.VoteAllocConfirmRequest;
import com.bteam.ovs.voting.dto.response.JudgeReviewStartResponse;
import com.bteam.ovs.voting.dto.response.VoteHistoryItem;
import com.bteam.ovs.voting.dto.response.VoteStartResponse;
import com.bteam.ovs.voting.entity.JudgeReviewCast;
import com.bteam.ovs.voting.entity.JudgeReviewItem;
import com.bteam.ovs.voting.entity.VoteAllocCast;
import com.bteam.ovs.voting.entity.VoteAllocItem;
import com.bteam.ovs.voting.entity.VoteCast;
import com.bteam.ovs.voting.repository.JudgeReviewCastRepository;
import com.bteam.ovs.voting.repository.JudgeReviewItemRepository;
import com.bteam.ovs.voting.repository.VoteAllocCastRepository;
import com.bteam.ovs.voting.repository.VoteAllocItemRepository;
import com.bteam.ovs.voting.repository.VoteCastRepository;
import com.bteam.ovs.voting.repository.VoteCurrentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.bteam.ovs.elections.entity.BallotType;

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

    private final VoteAllocCastRepository voteAllocCastRepo;
    private final VoteAllocItemRepository voteAllocItemRepo;

    private final JudgeReviewCastRepository judgeReviewCastRepo;
    private final JudgeReviewItemRepository judgeReviewItemRepo;

    public VotingService(
            CitizenIdResolver citizenIdResolver,
            ElectionEligibilityService electionEligibilityService,
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            VoteCastRepository voteCastRepo,
            VoteCurrentRepository voteCurrentRepo,
            VoteAllocCastRepository voteAllocCastRepo,
            VoteAllocItemRepository voteAllocItemRepo,
            JudgeReviewCastRepository judgeReviewCastRepo,
            JudgeReviewItemRepository judgeReviewItemRepo) {
        this.citizenIdResolver = citizenIdResolver;
        this.electionEligibilityService = electionEligibilityService;
        this.electionRepo = electionRepo;
        this.candidateRepo = candidateRepo;
        this.voteCastRepo = voteCastRepo;
        this.voteCurrentRepo = voteCurrentRepo;
        this.voteAllocCastRepo = voteAllocCastRepo;
        this.voteAllocItemRepo = voteAllocItemRepo;
        this.judgeReviewCastRepo = judgeReviewCastRepo;
        this.judgeReviewItemRepo = judgeReviewItemRepo;
    }

    public VoteStartResponse start(UUID accountId, UUID electionId) {
        electionEligibilityService.requireEligible(accountId, electionId);
        citizenIdResolver.requireCitizenId(accountId);

        Election election = requireElection(electionId);

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
                type,
                candidateId, // targetId
                candidateName, // label
                null, // approve
                now);

    }

    public List<VoteHistoryItem> history(UUID accountId) {
        UUID citizenId = citizenIdResolver.requireCitizenId(accountId);

        var votes = voteCastRepo.findByCitizenIdOrderByCastedAtDesc(citizenId);
        var jrCasts = judgeReviewCastRepo.findByCitizenIdOrderByCastedAtDesc(citizenId);

        if (votes.isEmpty() && jrCasts.isEmpty())
            return List.of();

        // --- election ids ---
        Set<UUID> electionIds = new HashSet<>();
        for (var v : votes)
            electionIds.add(v.getElectionId());
        for (var c : jrCasts)
            electionIds.add(c.getElectionId());

        var elections = electionRepo.findAllById(electionIds).stream()
                .collect(Collectors.toMap(Election::getId, Function.identity()));

        // --- candidate ids (normal candidates + judge candidates) ---
        Set<UUID> candidateIds = new HashSet<>();
        for (var v : votes) {
            if (v.getCandidateId() != null)
                candidateIds.add(v.getCandidateId());
        }

        // judge review items bulk load
        Map<UUID, List<JudgeReviewItem>> jrItemsByCastId = Map.of();
        if (!jrCasts.isEmpty()) {
            var castIds = jrCasts.stream().map(JudgeReviewCast::getId).collect(Collectors.toSet());
            var items = judgeReviewItemRepo.findByCastIdIn(castIds);
            jrItemsByCastId = items.stream().collect(Collectors.groupingBy(JudgeReviewItem::getCastId));

            for (var it : items) {
                if (it.getJudgeCandidateId() != null)
                    candidateIds.add(it.getJudgeCandidateId());
            }
        }

        var candidates = candidateRepo.findAllById(candidateIds).stream()
                .collect(Collectors.toMap(c -> c.getId(), Function.identity()));

        List<VoteHistoryItem> out = new ArrayList<>();

        // --- normal votes -> VoteHistoryItem ---
        for (var v : votes) {
            var e = elections.get(v.getElectionId());
            String status = e != null ? resolveElectionStatus(e) : "UNKNOWN";
            String title = e != null ? e.getTitle() : "(unknown election)";

            if (v.getCandidateId() == null) {
                out.add(new VoteHistoryItem(
                        v.getId(),
                        v.getElectionId(),
                        title,
                        status,
                        "NONE_SUPPORT",
                        null,
                        "誰も支持しない",
                        null,
                        v.getCastedAt()));
            } else {
                var c = candidates.get(v.getCandidateId());
                out.add(new VoteHistoryItem(
                        v.getId(),
                        v.getElectionId(),
                        title,
                        status,
                        "CANDIDATE",
                        v.getCandidateId(),
                        c != null ? c.getName() : "(unknown candidate)",
                        null,
                        v.getCastedAt()));
            }
        }

        // --- judge review votes -> VoteHistoryItem (1 judge = 1 row) ---
        for (var cast : jrCasts) {
            var e = elections.get(cast.getElectionId());
            String status = e != null ? resolveElectionStatus(e) : "UNKNOWN";
            String title = e != null ? e.getTitle() : "(unknown election)";

            var items = jrItemsByCastId.getOrDefault(cast.getId(), List.of());
            for (var it : items) {
                var judge = candidates.get(it.getJudgeCandidateId());
                String judgeName = judge != null ? judge.getName() : "(unknown judge)";

                // OK/NO -> boolean
                Boolean approve = null;
                if (it.getChoice() != null) {
                    approve = (it.getChoice() == JudgeReviewItem.Choice.OK);
                }

                out.add(new VoteHistoryItem(
                        cast.getId(), // voteId的には castId を入れてOK（ユニークである必要だけ満たす）
                        cast.getElectionId(),
                        title,
                        status,
                        "JUDGE_REVIEW",
                        it.getJudgeCandidateId(),
                        judgeName,
                        approve,
                        cast.getCastedAt()));
            }
        }

        // castedAt desc
        out.sort((a, b) -> (b.castedAt() == null ? "" : b.castedAt().toString())
                .compareTo(a.castedAt() == null ? "" : a.castedAt().toString()));

        return out;
    }

    // ===== public vote token entry points =====

    public VoteStartResponse startByCitizen(UUID citizenId, UUID electionId) {
        electionEligibilityService.requireEligibleCitizen(citizenId, electionId);

        Election election = requireElection(electionId);

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
                "CANDIDATE",
                candidate.getId(), // targetId
                candidate.getName(), // label
                null, // approve
                now);
    }

    @Transactional
    public VoteHistoryItem confirmNoneSupportByCitizen(UUID citizenId, UUID electionId) {
        electionEligibilityService.requireEligibleCitizen(citizenId, electionId);

        Election election = requireElection(electionId);

        Instant now = Instant.now();
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
                "NONE_SUPPORT",
                null, // targetId
                "誰も支持しない", // label
                null, // approve
                now);
    }

    // ===== allocation confirm by citizen (このサービスに元々あったので維持) =====
    @Transactional
    public void confirmAllocByCitizen(UUID citizenId, UUID electionId, List<VoteAllocConfirmRequest.Item> items) {
        electionEligibilityService.requireEligibleCitizen(citizenId, electionId);

        Election election = requireElection(electionId);

        Instant now = Instant.now();
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
            case CLOSED, TALLYING, TALLIED, PUBLISHED, ARCHIVED -> "ENDED"; // ★TALLYING追加
        };
    }

    public JudgeReviewStartResponse startJudgeReviewByCitizen(UUID citizenId, UUID electionId) {
        electionEligibilityService.requireEligibleCitizen(citizenId, electionId);

        Election election = requireElection(electionId);
        requireOpenAndWithinPeriod(election, Instant.now());

        if (election.getBallotType() != BallotType.JUDGE_REVIEW) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_BALLOT_TYPE", "この選挙は国民審査ではありません");
        }

        var judgeEntities = candidateRepo.findByElectionId(electionId).stream()
                .sorted(Comparator.comparingInt(c -> c.getSortOrder()))
                .toList();

        if (judgeEntities.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "NO_JUDGES", "裁判官が登録されていません");
        }

        var judges = judgeEntities.stream()
                .map(c -> new JudgeReviewStartResponse.JudgeItem(c.getId(), c.getName(), c.getTitle()))
                .toList();

        Map<UUID, String> current = null;
        var castOpt = judgeReviewCastRepo.findByElectionIdAndCitizenId(electionId, citizenId);
        if (castOpt.isPresent()) {
            var items = judgeReviewItemRepo.findByCastId(castOpt.get().getId());
            current = items.stream().collect(Collectors.toMap(
                    JudgeReviewItem::getJudgeCandidateId,
                    it -> it.getChoice().name(),
                    (a, b) -> a));
        }

        return new JudgeReviewStartResponse(election.getId(), election.getTitle(), judges, current);
    }

    @Transactional
    public void confirmJudgeReviewByCitizen(
            UUID citizenId,
            UUID electionId,
            List<JudgeReviewConfirmRequest.Item> choices) {

        electionEligibilityService.requireEligibleCitizen(citizenId, electionId);

        Election election = requireElection(electionId);
        Instant now = Instant.now();
        requireOpenAndWithinPeriod(election, now);

        if (election.getBallotType() != BallotType.JUDGE_REVIEW) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_BALLOT_TYPE", "この選挙は国民審査ではありません");
        }
        if (choices == null || choices.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CHOICES", "choicesが空です");
        }

        var judgeCandidates = candidateRepo.findByElectionId(electionId);
        var judgeIdSet = judgeCandidates.stream().map(c -> c.getId()).collect(Collectors.toSet());
        if (judgeIdSet.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "NO_JUDGES", "裁判官が登録されていません");
        }

        // request 正規化（judgeCandidateId -> choice）
        Map<UUID, JudgeReviewItem.Choice> map = new HashMap<>();
        for (var it : choices) {
            if (it == null)
                continue;

            UUID judgeId = UuidParsers.parseOr400(it.judgeCandidateId(), "INVALID_JUDGE_ID", "judgeCandidateIdが不正です");
            if (!judgeIdSet.contains(judgeId)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_JUDGE", "対象外の裁判官が含まれています");
            }

            String ch = (it.choice() == null ? "" : it.choice().trim()).toUpperCase();
            JudgeReviewItem.Choice choiceEnum;
            try {
                choiceEnum = JudgeReviewItem.Choice.valueOf(ch);
            } catch (Exception e) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CHOICE", "choiceが不正です（OK/NO）");
            }

            map.put(judgeId, choiceEnum);
        }

        if (map.size() != judgeIdSet.size()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CHOICES_NOT_COMPLETE", "全裁判官分の選択が必要です");
        }

        // Cast は 1人1選挙
        var cast = judgeReviewCastRepo.findByElectionIdAndCitizenId(electionId, citizenId)
                .orElseGet(() -> {
                    var c = new JudgeReviewCast();
                    c.setElectionId(electionId);
                    c.setCitizenId(citizenId);
                    return c;
                });

        cast.setCastedAt(now);
        cast = judgeReviewCastRepo.save(cast);

        judgeReviewItemRepo.deleteByCastId(cast.getId());
        judgeReviewItemRepo.flush();

        for (var e : map.entrySet()) {
            var item = new JudgeReviewItem();
            item.setCastId(cast.getId());
            item.setJudgeCandidateId(e.getKey());
            item.setChoice(e.getValue());
            judgeReviewItemRepo.save(item);
        }
    }

    public JudgeReviewStartResponse startJudgeReview(UUID accountId, UUID electionId) {
        electionEligibilityService.requireEligible(accountId, electionId);
        UUID citizenId = citizenIdResolver.requireCitizenId(accountId);
        return startJudgeReviewByCitizen(citizenId, electionId);
    }

    @Transactional
    public void confirmJudgeReview(
            UUID accountId,
            UUID electionId,
            List<JudgeReviewConfirmRequest.Item> choices) {

        electionEligibilityService.requireEligible(accountId, electionId);
        UUID citizenId = citizenIdResolver.requireCitizenId(accountId);
        confirmJudgeReviewByCitizen(citizenId, electionId, choices);
    }

}
