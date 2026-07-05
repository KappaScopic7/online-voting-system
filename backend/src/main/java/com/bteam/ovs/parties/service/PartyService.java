package com.bteam.ovs.parties.service;

import com.bteam.ovs.candidates.repository.CandidateRepository;
import com.bteam.ovs.parties.dto.response.PartyCandidateItem;
import com.bteam.ovs.parties.dto.response.PartyDetailResponse;
import com.bteam.ovs.parties.dto.response.PartyListItem;
import com.bteam.ovs.parties.entity.Party;
import com.bteam.ovs.parties.repository.PartyRepository;
import com.bteam.ovs.shared.errors.ApiException;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@RequiredArgsConstructor
@Service
public class PartyService {

    private final PartyRepository partyRepo;
    private final CandidateRepository candidateRepo;

    public List<PartyListItem> list() {
        return partyRepo.findAll().stream()
                .sorted(Comparator.comparing(Party::getPartyKey))
                .map(p -> new PartyListItem(
                        p.getId(),
                        p.getPartyKey(),
                        p.getName(),
                        p.getShortName(),
                        p.getColor(),
                        p.getDescription(),
                        (p.getIdeologyTags() == null) ? List.of() : p.getIdeologyTags()))
                .toList();
    }

    public PartyDetailResponse getByKey(String partyKey) {
        Party p = partyRepo.findByPartyKey(partyKey)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "PARTY_NOT_FOUND",
                        "政党が存在しません"));

        return new PartyDetailResponse(
                p.getId(),
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
