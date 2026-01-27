// backend/src/main/java/com/bteam/ovs/elections/service/PartyService.java
package com.bteam.ovs.elections.service;

import com.bteam.ovs.elections.controller.dto.PartyCandidateItem;
import com.bteam.ovs.elections.controller.dto.PartyDetailResponse;
import com.bteam.ovs.elections.controller.dto.PartyListItem;
import com.bteam.ovs.elections.entity.Party;
import com.bteam.ovs.elections.repository.CandidateRepository;
import com.bteam.ovs.elections.repository.PartyRepository;
import com.bteam.ovs.shared.errors.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class PartyService {

    private final PartyRepository partyRepo;
    private final CandidateRepository candidateRepo;

    public PartyService(PartyRepository partyRepo, CandidateRepository candidateRepo) {
        this.partyRepo = partyRepo;
        this.candidateRepo = candidateRepo;
    }

    public List<PartyListItem> list() {
        // partyKey の昇順で安定表示（DB依存にしない）
        return partyRepo.findAll().stream()
                .sorted(Comparator.comparing(Party::getPartyKey))
                .map(p -> new PartyListItem(
                        p.getPartyKey(),
                        p.getName(),
                        p.getShortName(),
                        p.getColor()))
                .toList();
    }

    public PartyDetailResponse getByKey(String partyKey) {
        Party p = partyRepo.findByPartyKey(partyKey)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "PARTY_NOT_FOUND",
                        "政党が存在しません"));

        return new PartyDetailResponse(
                p.getPartyKey(),
                p.getName(),
                p.getShortName(),
                p.getColor(),
                p.getDescription(),
                (p.getIdeologyTags() == null) ? List.of() : p.getIdeologyTags());
    }

    public List<PartyCandidateItem> candidatesByPartyKey(String partyKey) {
        if (!partyRepo.existsByPartyKey(partyKey)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "PARTY_NOT_FOUND", "政党が存在しません");
        }

        return candidateRepo.findByPartyKeyOrderByElectionIdAscSortOrderAsc(partyKey).stream()
                .map(c -> new PartyCandidateItem(
                        c.getId(),
                        c.getElectionId(),
                        c.getCandidateKey(),
                        c.getName(),
                        c.getAge(),
                        c.getTitle(),
                        c.getImageUrl()))
                .toList();
    }
}
