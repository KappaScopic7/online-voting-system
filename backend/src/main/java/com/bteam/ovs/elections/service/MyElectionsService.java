package com.bteam.ovs.elections.service;

import com.bteam.ovs.eligibility.service.EligibilityProfileResolver;
import com.bteam.ovs.candidates.service.CandidateService;
import com.bteam.ovs.elections.controller.dto.MyElectionItem;
import com.bteam.ovs.elections.entity.Election;
import com.bteam.ovs.elections.repository.ElectionEligibilityRuleRepository;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.shared.auth.AccountResolver;
import com.bteam.ovs.voting.repository.VoteCurrentRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class MyElectionsService {

    private final EligibilityProfileResolver resolver;
    private final ElectionEligibilityRuleRepository ruleRepo;
    private final ElectionRepository electionRepo;

    // 追加依存（ElectionService と同じ）
    private final CandidateService candidateService;
    private final VoteCurrentRepository voteCurrentRepo;
    private final AccountResolver accountResolver;
    private final ElectionEligibilityService electionEligibilityService;

    public MyElectionsService(
            EligibilityProfileResolver resolver,
            ElectionEligibilityRuleRepository ruleRepo,
            ElectionRepository electionRepo,
            CandidateService candidateService,
            VoteCurrentRepository voteCurrentRepo,
            AccountResolver accountResolver,
            ElectionEligibilityService electionEligibilityService) {
        this.resolver = resolver;
        this.ruleRepo = ruleRepo;
        this.electionRepo = electionRepo;
        this.candidateService = candidateService;
        this.voteCurrentRepo = voteCurrentRepo;
        this.accountResolver = accountResolver;
        this.electionEligibilityService = electionEligibilityService;
    }

    @Transactional(readOnly = true)
    public List<MyElectionItem> listMyElections(UUID accountId) {

        // ===== Eligibility 判定 =====
        var snap = resolver.resolve(accountId);

        if (snap.source() == com.bteam.ovs.eligibility.service.entity.EligibilitySnapshot.Source.NONE) {
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

        // ===== Election 取得 =====
        var elections = electionRepo.findAllById(electionIds);
        elections.sort(Comparator.comparing(Election::getStartsAt,
                Comparator.nullsLast(Comparator.naturalOrder())));

        Instant now = Instant.now();

        var electionIdList = elections.stream().map(Election::getId).toList();

        // currentVote 表示用
        Map<UUID, String> candidateNameById = candidateService.candidateNameMapByElectionIds(electionIdList);

        // accountId は My 前提なので「未ログイン扱いに落とす」より、普通に active を探す
        UUID citizenId = null;
        boolean identityLinked = false;

        var accOpt = accountResolver.findActiveAccount(accountId);
        if (accOpt.isPresent()) {
            citizenId = accOpt.get().getCitizenId();
            identityLinked = (citizenId != null);
        }

        Map<UUID, com.bteam.ovs.voting.entity.VoteCurrent> currentByElectionId = Map.of();
        if (identityLinked) {
            currentByElectionId = voteCurrentRepo.findByCitizenIdAndElectionIdIn(citizenId, electionIdList)
                    .stream()
                    .collect(Collectors.toMap(
                            v -> v.getElectionId(),
                            Function.identity(),
                            (a, b) -> a));
        }

        final boolean finalIdentityLinked = identityLinked;
        final Map<UUID, com.bteam.ovs.voting.entity.VoteCurrent> finalCurrentByElectionId = currentByElectionId;

        return elections.stream()
                .map(e -> {
                    String st = ElectionService.status(now, e.getStartsAt(), e.getEndsAt());
                    boolean hasResult = "ENDED".equals(st);

                    boolean canCast = finalIdentityLinked
                            && "ONGOING".equals(st)
                            && electionEligibilityService.isEligible(accountId, e.getId());

                    MyElectionItem.CurrentVote currentVote = null;
                    if (finalIdentityLinked) {
                        var cur = finalCurrentByElectionId.get(e.getId());
                        if (cur != null) {
                            var cid = cur.getCandidateId();
                            currentVote = new MyElectionItem.CurrentVote(
                                    cid,
                                    candidateNameById.get(cid),
                                    cur.getCastedAt());
                        }
                    }

                    return new MyElectionItem(
                            e.getId(),
                            e.getTitle(),
                            e.getStartsAt(),
                            e.getEndsAt(),
                            st,
                            hasResult,
                            canCast,
                            currentVote);
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
