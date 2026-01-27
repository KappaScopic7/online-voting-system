// backend/src/main/java/com/bteam/ovs/elections/controller/ElectionCandidatesController.java
package com.bteam.ovs.elections.controller;

import com.bteam.ovs.elections.controller.dto.CandidateDetailResponse;
import com.bteam.ovs.elections.controller.dto.CandidateItem;
import com.bteam.ovs.elections.repository.CandidateRepository;
import com.bteam.ovs.elections.repository.PartyRepository;
import com.bteam.ovs.shared.errors.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController @RequestMapping("/api/elections/{electionId}/candidates")
public class ElectionCandidatesController {

    private final CandidateRepository candidateRepo;
    private final PartyRepository partyRepo;

    public ElectionCandidatesController(CandidateRepository candidateRepo, PartyRepository partyRepo) {
        this.candidateRepo = candidateRepo;
        this.partyRepo = partyRepo;
    }

    @GetMapping
    public List<CandidateItem> list(@PathVariable UUID electionId) {
        var candidates = candidateRepo.findByElectionId(electionId);

        // sortOrder で安定ソート（DB側でORDER BYしてないので）
        candidates.sort(Comparator.comparingInt(c -> c.getSortOrder()));

        var partyMap = loadPartiesByKeys(
                candidates.stream()
                        .map(c -> blankToNull(c.getPartyKey()))
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet()));

        return candidates.stream()
                .map(c -> {
                    var p = (c.getPartyKey() == null) ? null : partyMap.get(c.getPartyKey());
                    CandidateItem.PartyEmbed embed = (p == null) ? null
                            : new CandidateItem.PartyEmbed(
                                    p.getPartyKey(),
                                    p.getShortName(),
                                    p.getName(),
                                    p.getColor());

                    return new CandidateItem(
                            c.getId(),
                            c.getCandidateKey(),
                            c.getName(),
                            c.getAge(),
                            c.getTitle(),
                            c.getSortOrder(),
                            embed);
                })
                .toList();
    }

    @GetMapping("/{candidateId}")
    public CandidateDetailResponse get(
            @PathVariable UUID electionId,
            @PathVariable UUID candidateId) {
        // electionId も一致してるかチェック
        var c = candidateRepo.findById(candidateId)
                .filter(x -> x.getElectionId().equals(electionId))
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "CANDIDATE_NOT_FOUND",
                        "候補者が見つかりません"));

        CandidateDetailResponse.PartyEmbed partyEmbed = null;

        String partyKey = blankToNull(c.getPartyKey());
        if (partyKey != null) {
            var p = partyRepo.findByPartyKey(partyKey)
                    .orElseThrow(() -> new ApiException(
                            HttpStatus.NOT_FOUND,
                            "PARTY_NOT_FOUND",
                            "政党が見つかりません: " + partyKey));

            partyEmbed = new CandidateDetailResponse.PartyEmbed(
                    p.getPartyKey(),
                    p.getShortName(),
                    p.getName(),
                    p.getColor(),
                    p.getDescription(),
                    p.getIdeologyTags());
        }

        return new CandidateDetailResponse(
                c.getId(),
                c.getElectionId(),
                c.getCandidateKey(),
                c.getName(),
                c.getAge(),
                c.getTitle(),
                c.getBio(),
                c.getPolicies() == null ? List.of() : c.getPolicies(),
                c.getWebsiteUrl(),
                c.getImageUrl(),
                partyEmbed);
    }

    // -------------------------
    // helpers
    // -------------------------
    private Map<String, com.bteam.ovs.elections.entity.Party> loadPartiesByKeys(Set<String> keys) {
        if (keys.isEmpty())
            return Map.of();

        // findAll + filter（レコード少ない想定なのでOK）
        // ※大量になったら PartyRepository に findByPartyKeyIn を生やす
        var all = partyRepo.findAll();
        return all.stream()
                .filter(p -> keys.contains(p.getPartyKey()))
                .collect(Collectors.toMap(
                        com.bteam.ovs.elections.entity.Party::getPartyKey,
                        Function.identity()));
    }

    private String blankToNull(String v) {
        if (v == null)
            return null;
        var t = v.trim();
        return t.isEmpty() ? null : t;
    }
}
