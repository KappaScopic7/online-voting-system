// backend/src/main/java/com/bteam/ovs/candidates/service/CandidateService.java
package com.bteam.ovs.candidates.service;

import com.bteam.ovs.candidates.dto.response.CandidateDetailResponse;
import com.bteam.ovs.candidates.dto.response.CandidateListItem;
import com.bteam.ovs.candidates.entity.Candidate;
import com.bteam.ovs.candidates.repository.CandidateRepository;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.parties.service.PartyLookupService;
import com.bteam.ovs.shared.errors.ApiException;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class CandidateService {

    private final ElectionRepository electionRepo;
    private final CandidateRepository candidateRepo;
    private final PartyLookupService partyLookupService;

    public CandidateService(
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            PartyLookupService partyLookupService) {
        this.electionRepo = electionRepo;
        this.candidateRepo = candidateRepo;
        this.partyLookupService = partyLookupService;
    }

    public ElectionCandidatesBundle bundleByElection(UUID electionId) {
        requireElectionExists(electionId);

        var candidateEntities = candidateRepo.findByElectionId(electionId);
        candidateEntities.sort(Comparator.comparingInt(c -> c.getSortOrder()));

        Map<UUID, String> candidateNameById = candidateEntities.stream()
                .collect(Collectors.toMap(
                        Candidate::getId,
                        Candidate::getName,
                        (a, b) -> a));

        var partyKeys = candidateEntities.stream()
                .map(c -> partyLookupService.blankToNull(c.getPartyKey()))
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        var partyMap = partyLookupService.mapByCandidatePartyKeys(partyKeys);

        var items = candidateEntities.stream()
                .map(c -> {
                    String partyKey = partyLookupService.blankToNull(c.getPartyKey());
                    var party = (partyKey == null) ? null : partyMap.get(partyKey);
                    return toCandidateListItem(c, party);
                })
                .toList();

        return new ElectionCandidatesBundle(items, candidateNameById);
    }

    /** /api/elections/{electionId}/candidates 用 */
    public List<CandidateListItem> listByElection(UUID electionId) {
        return bundleByElection(electionId).items();
    }

    /** /api/candidates 用（electionId or partyKey で絞る） */
    public List<CandidateListItem> listAll(UUID electionIdOrNull, String partyKeyOrNull) {

        List<com.bteam.ovs.candidates.entity.Candidate> candidateEntities;

        if (electionIdOrNull != null) {
            requireElectionExists(electionIdOrNull);
            candidateEntities = candidateRepo.findByElectionId(electionIdOrNull);
            candidateEntities.sort(Comparator.comparingInt(c -> c.getSortOrder()));

        } else if (partyKeyOrNull != null && !partyKeyOrNull.isBlank()) {
            candidateEntities = candidateRepo.findByPartyKeyOrderByElectionIdAscSortOrderAsc(partyKeyOrNull.trim());

        } else {
            candidateEntities = candidateRepo.findAllByOrderByElectionIdAscSortOrderAsc();
        }

        var partyMap = partyLookupService.mapByCandidatePartyKeys(
                candidateEntities.stream().map(c -> c.getPartyKey()).toList());

        return candidateEntities.stream()
                .map(c -> toCandidateListItem(
                        c,
                        partyMap.get(partyLookupService.blankToNull(c.getPartyKey()))))
                .toList();
    }

    /** /api/elections/{electionId}/candidates/{candidateId} 用 */
    public CandidateDetailResponse detail(UUID electionId, UUID candidateId) {
        requireElectionExists(electionId);

        var c = candidateRepo.findByIdAndElectionId(candidateId, electionId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "CANDIDATE_NOT_FOUND",
                        "候補者が存在しません"));

        return toCandidateDetailResponse(c);
    }

    /** /api/candidates/{candidateId} 用 */
    public CandidateDetailResponse detailByCandidateId(UUID candidateId) {
        var c = candidateRepo.findById(candidateId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "CANDIDATE_NOT_FOUND",
                        "候補者が存在しません"));

        return toCandidateDetailResponse(c);
    }

    /** Election一覧向け：候補者数 */
    public Map<UUID, Long> countByElectionIds(List<UUID> electionIds) {
        if (electionIds == null || electionIds.isEmpty())
            return Map.of();

        return candidateRepo.countByElectionIdIn(electionIds).stream()
                .collect(Collectors.toMap(
                        CandidateRepository.ElectionCandidateCount::getElectionId,
                        CandidateRepository.ElectionCandidateCount::getCnt));
    }

    /** Election一覧向け：candidateId->name */
    public Map<UUID, String> candidateNameMapByElectionIds(List<UUID> electionIds) {
        if (electionIds == null || electionIds.isEmpty())
            return Map.of();

        return candidateRepo.findByElectionIdIn(electionIds).stream()
                .collect(Collectors.toMap(
                        c -> c.getId(),
                        c -> c.getName(),
                        (a, b) -> a));
    }

    /** 結果表示用：candidateId,candidateKey,name */
    public List<CandidateSummary> summariesByElection(UUID electionId) {
        requireElectionExists(electionId);
        return candidateRepo.findByElectionId(electionId).stream()
                .map(c -> new CandidateSummary(c.getId(), c.getCandidateKey(), c.getName()))
                .toList();
    }

    private void requireElectionExists(UUID electionId) {
        if (!electionRepo.existsById(electionId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません");
        }
    }

    private CandidateListItem toCandidateListItem(
            com.bteam.ovs.candidates.entity.Candidate c,
            com.bteam.ovs.parties.entity.Party pOrNull) {
        CandidateListItem.PartyEmbed party = (pOrNull == null)
                ? null
                : partyLookupService.toCandidateListItemEmbed(pOrNull);

        return new CandidateListItem(
                c.getId(),
                c.getElectionId(),
                c.getCandidateKey(),
                c.getName(),
                c.getAge(),
                c.getTitle(),
                c.getSortOrder(),
                party);
    }

    private CandidateDetailResponse toCandidateDetailResponse(com.bteam.ovs.candidates.entity.Candidate c) {
        CandidateDetailResponse.PartyEmbed party = null;

        String partyKey = partyLookupService.blankToNull(c.getPartyKey());
        if (partyKey != null) {
            var p = partyLookupService.requireByPartyKey(partyKey);
            party = partyLookupService.toCandidateDetailEmbed(p);
        }

        return new CandidateDetailResponse(
                c.getId(),
                c.getElectionId(),
                c.getCandidateKey(),
                c.getName(),
                c.getAge(),
                c.getTitle(),
                c.getBio(),
                (c.getPolicies() == null) ? List.of() : c.getPolicies(),
                c.getWebsiteUrl(),
                c.getImageUrl(),
                party);
    }

    public record ElectionCandidatesBundle(
            List<CandidateListItem> items,
            Map<UUID, String> candidateNameById) {
    }

    public record CandidateSummary(
            UUID candidateId,
            String candidateKey,
            String name) {
    }

}
