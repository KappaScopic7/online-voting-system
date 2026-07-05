package com.bteam.ovs.elections.service;

import com.bteam.ovs.eligibility.service.EligibilityProfileResolver;
import com.bteam.ovs.candidates.service.CandidateService;
import com.bteam.ovs.elections.dto.response.ElectionListItem;
import com.bteam.ovs.elections.entity.BallotType;
import com.bteam.ovs.elections.entity.Election;
import com.bteam.ovs.elections.entity.ElectionStatus;
import com.bteam.ovs.elections.repository.ElectionEligibilityRuleRepository;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.shared.auth.AccountResolver;
import com.bteam.ovs.voting.entity.VoteAllocCast;
import com.bteam.ovs.voting.repository.JudgeReviewCastRepository;
import com.bteam.ovs.voting.repository.VoteAllocCastRepository;
import com.bteam.ovs.voting.repository.VoteCurrentRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class MyElectionsService {

    private final EligibilityProfileResolver resolver;
    private final ElectionEligibilityRuleRepository ruleRepo;
    private final ElectionRepository electionRepo;

    private final CandidateService candidateService;
    private final VoteCurrentRepository voteCurrentRepo;
    private final VoteAllocCastRepository voteAllocCastRepo;
    private final JudgeReviewCastRepository judgeReviewCastRepo;

    private final AccountResolver accountResolver;
    private final ElectionEligibilityService electionEligibilityService;

    @Transactional(readOnly = true)
    public List<ElectionListItem> listMyElections(UUID accountId) {

        var snap = resolver.resolve(accountId);
        if (snap.source() == com.bteam.ovs.eligibility.entity.EligibilitySnapshot.Source.NONE) {
            return List.of();
        }
        if (snap.cityCode() == null || snap.cityCode().isBlank()) {
            return List.of();
        }

        Integer age = calcAge(snap.birthDate(), LocalDate.now());
        var rules = ruleRepo.findByCityCode(snap.cityCode());

        Set<UUID> electionIds = new HashSet<>();
        for (var r : rules) {
            if (r.getElectionId() == null)
                continue;
            if (!passesMinAge(age, r.getMinAge()))
                continue;
            electionIds.add(r.getElectionId());
        }

        if (electionIds.isEmpty())
            return List.of();

        var elections = electionRepo.findAllById(electionIds);
        elections.sort(Comparator.comparing(Election::getStartsAt,
                Comparator.nullsLast(Comparator.naturalOrder())).reversed());

        if (elections.isEmpty())
            return List.of();

        var electionIdList = elections.stream().map(Election::getId).toList();

        Map<UUID, Long> candidateCountByElectionId = candidateService.countByElectionIds(electionIdList);

        Map<UUID, String> candidateNameById = candidateService.candidateNameMapByElectionIds(electionIdList);

        UUID citizenId = null;
        boolean identityLinked = false;

        var accOpt = accountResolver.findActiveAccount(accountId);
        if (accOpt.isPresent()) {
            citizenId = accOpt.get().getCitizenId();
            identityLinked = (citizenId != null);
        }

        Map<UUID, com.bteam.ovs.voting.entity.VoteCurrent> currentByElectionId = Map.of();
        if (identityLinked) {
            currentByElectionId = voteCurrentRepo.findByCitizenIdAndElectionIdIn(citizenId, electionIdList).stream()
                    .collect(Collectors.toMap(
                            v -> v.getElectionId(),
                            Function.identity(),
                            (a, b) -> a));
        }

        Set<UUID> allocCurrentElectionIds = Set.of();
        if (identityLinked) {
            allocCurrentElectionIds = voteAllocCastRepo.findByCitizenIdAndElectionIdIn(citizenId, electionIdList)
                    .stream()
                    .map(VoteAllocCast::getElectionId)
                    .collect(Collectors.toSet());
        }

        Set<UUID> jrCurrentElectionIds = Set.of();
        if (identityLinked) {
            jrCurrentElectionIds = judgeReviewCastRepo.findByCitizenIdAndElectionIdIn(citizenId, electionIdList)
                    .stream()
                    .map(c -> c.getElectionId())
                    .collect(Collectors.toSet());
        }

        final boolean finalIdentityLinked = identityLinked;
        final Map<UUID, com.bteam.ovs.voting.entity.VoteCurrent> finalCurrentByElectionId = currentByElectionId;
        final Set<UUID> finalAllocCurrentElectionIds = allocCurrentElectionIds;
        final Set<UUID> finalJrCurrentElectionIds = jrCurrentElectionIds;

        return elections.stream()
                .map(e -> {
                    String st = ElectionService.status(e);

                    boolean hasResult = (e.getStatus() == ElectionStatus.PUBLISHED);

                    long cnt = candidateCountByElectionId.getOrDefault(e.getId(), 0L);
                    int candidateCount = (cnt > Integer.MAX_VALUE) ? Integer.MAX_VALUE : (int) cnt;

                    boolean canCast = finalIdentityLinked
                            && e.getStatus() == ElectionStatus.OPEN
                            && electionEligibilityService.isEligible(accountId, e.getId());

                    ElectionListItem.CurrentVote currentVote = null;
                    if (finalIdentityLinked && e.getBallotType() == BallotType.SINGLE_CHOICE) {
                        var cur = finalCurrentByElectionId.get(e.getId());
                        if (cur != null) {
                            if ("NONE_SUPPORT".equals(cur.getType())) {
                                currentVote = new ElectionListItem.CurrentVote(
                                        null,
                                        "誰も支持しない",
                                        cur.getCastedAt());
                            } else {
                                var cid = cur.getCandidateId();
                                currentVote = new ElectionListItem.CurrentVote(
                                        cid,
                                        candidateNameById.get(cid),
                                        cur.getCastedAt());
                            }
                        }
                    }

                    boolean hasCurrent = false;
                    if (finalIdentityLinked) {
                        if (e.getBallotType() == BallotType.SINGLE_CHOICE) {
                            hasCurrent = (currentVote != null);
                        } else if (e.getBallotType() == BallotType.ALLOCATION) {
                            hasCurrent = finalAllocCurrentElectionIds.contains(e.getId());
                        } else if (e.getBallotType() == BallotType.JUDGE_REVIEW) {
                            hasCurrent = finalJrCurrentElectionIds.contains(e.getId());
                        }
                    }

                    return new ElectionListItem(
                            e.getId(),
                            e.getTitle(),
                            e.getStartsAt(),
                            e.getEndsAt(),
                            st,
                            hasResult,
                            candidateCount,
                            canCast,
                            currentVote,
                            e.getBallotType().name(),
                            hasCurrent);
                })
                .toList();
    }

    private Integer calcAge(LocalDate birthDate, LocalDate today) {
        if (birthDate == null)
            return null;
        try {
            return Period.between(birthDate, today).getYears();
        } catch (Exception e) {
            return null;
        }
    }

    private boolean passesMinAge(Integer age, Integer minAge) {
        if (minAge == null)
            return true;
        if (age == null)
            return false;
        return age >= minAge;
    }
}
