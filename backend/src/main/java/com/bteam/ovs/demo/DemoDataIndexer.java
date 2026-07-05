package com.bteam.ovs.demo;

import com.bteam.ovs.demo.json.*;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class DemoDataIndexer {

    public record Indexed(
            Map<UUID, CitizenJson> citizenMap,
            Map<String, PartyJson> partyMap,
            Map<String, CandidateJson> candidateMap,
            Map<String, ElectionJson> electionMap) {
    }

    public Indexed indexAll(
            List<CitizenJson> citizens,
            List<PartyJson> parties,
            List<CandidateJson> candidates,
            List<ElectionJson> elections) {
        var citizenMap = indexCitizens(citizens);
        var partyMap = indexParties(parties);
        var candidateMap = indexCandidates(candidates);
        var electionMap = indexElections(elections);
        return new Indexed(citizenMap, partyMap, candidateMap, electionMap);
    }

    public Map<UUID, CitizenJson> indexCitizens(List<CitizenJson> items) {
        var map = new LinkedHashMap<UUID, CitizenJson>();
        for (var x : items) {
            if (x.citizenId() == null) {
                throw new IllegalStateException("citizens.json: citizenId null");
            }
            if (map.putIfAbsent(x.citizenId(), x) != null) {
                throw new IllegalStateException("citizens.json: duplicate citizenId " + x.citizenId());
            }
        }
        return map;
    }

    public Map<String, PartyJson> indexParties(List<PartyJson> items) {
        var map = new LinkedHashMap<String, PartyJson>();
        for (var x : items) {
            mustNonBlank(x.partyKey(), "party.json: partyKey blank");
            if (map.putIfAbsent(x.partyKey(), x) != null) {
                throw new IllegalStateException("party.json: duplicate partyKey " + x.partyKey());
            }
        }
        return map;
    }

    public Map<String, CandidateJson> indexCandidates(List<CandidateJson> items) {
        var map = new LinkedHashMap<String, CandidateJson>();
        for (var x : items) {
            mustNonBlank(x.candidateKey(), "candidates.json: candidateKey blank");
            if (map.putIfAbsent(x.candidateKey(), x) != null) {
                throw new IllegalStateException("candidates.json: duplicate candidateKey " + x.candidateKey());
            }
        }
        return map;
    }

    public Map<String, ElectionJson> indexElections(List<ElectionJson> items) {
        var map = new LinkedHashMap<String, ElectionJson>();
        for (var x : items) {
            mustNonBlank(x.electionKey(), "elections.json: electionKey blank");
            if (map.putIfAbsent(x.electionKey(), x) != null) {
                throw new IllegalStateException("elections.json: duplicate electionKey " + x.electionKey());
            }
        }
        return map;
    }

    private void mustNonBlank(String v, String msg) {
        if (v == null || v.isBlank()) {
            throw new IllegalStateException(msg);
        }
    }
}
