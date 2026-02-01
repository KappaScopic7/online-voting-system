package com.bteam.ovs.parties.service;

import com.bteam.ovs.candidates.controller.dto.CandidateDetailResponse;
import com.bteam.ovs.candidates.controller.dto.CandidateItem;
import com.bteam.ovs.parties.entity.Party;
import com.bteam.ovs.parties.repository.PartyRepository;
import com.bteam.ovs.shared.errors.ApiException;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class PartyLookupService {

    private final PartyRepository partyRepo;

    public PartyLookupService(PartyRepository partyRepo) {
        this.partyRepo = partyRepo;
    }

    public Optional<Party> findByPartyKey(String partyKey) {
        String key = blankToNull(partyKey);
        if (key == null)
            return Optional.empty();
        return partyRepo.findByPartyKey(key);
    }

    public Party requireByPartyKey(String partyKey) {
        String key = blankToNull(partyKey);
        if (key == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "PARTY_NOT_FOUND", "政党が見つかりません: null");
        }
        return partyRepo.findByPartyKey(key)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "PARTY_NOT_FOUND",
                        "政党が見つかりません: " + key));
    }

    public Map<String, Party> mapByCandidatePartyKeys(Collection<String> partyKeysOrNull) {
        if (partyKeysOrNull == null || partyKeysOrNull.isEmpty())
            return Map.of();

        var keys = partyKeysOrNull.stream()
                .map(this::blankToNull)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        if (keys.isEmpty())
            return Map.of();

        return partyRepo.findByPartyKeyIn(keys).stream()
                .collect(Collectors.toMap(
                        Party::getPartyKey,
                        Function.identity()));
    }

    public CandidateItem.PartyEmbed toCandidateItemEmbed(Party p) {
        if (p == null)
            return null;
        return new CandidateItem.PartyEmbed(
                p.getPartyKey(),
                p.getShortName(),
                p.getName(),
                p.getColor());
    }

    public CandidateDetailResponse.PartyEmbed toCandidateDetailEmbed(Party p) {
        if (p == null)
            return null;
        return new CandidateDetailResponse.PartyEmbed(
                p.getPartyKey(),
                p.getShortName(),
                p.getName(),
                p.getColor(),
                p.getDescription(),
                (p.getIdeologyTags() == null) ? List.of() : p.getIdeologyTags());
    }

    public String blankToNull(String v) {
        if (v == null)
            return null;
        var t = v.trim();
        return t.isEmpty() ? null : t;
    }
}
