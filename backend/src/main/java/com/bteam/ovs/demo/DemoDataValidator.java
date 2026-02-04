package com.bteam.ovs.demo;

import com.bteam.ovs.auth.entity.Role;
import com.bteam.ovs.demo.json.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class DemoDataValidator {

    public void validateAll(
            Map<UUID, CitizenJson> citizenMap,
            Map<String, PartyJson> partyMap,
            Map<String, CandidateJson> candidateMap,
            Map<String, ElectionJson> electionMap,
            List<RuleJson> rules,
            List<VoteJson> votes,
            List<UserJson> users,
            List<CommitteeJson> committee,
            List<AllocVoteJson> allocVoteCasts) {
        validateUsers(users, citizenMap);
        validateCandidates(candidateMap, partyMap);
        validateElections(electionMap, candidateMap);
        validateRules(rules, electionMap);
        validateVotes(votes, electionMap, citizenMap);
        validateCommitteeAccounts(committee);
        validateAllocVoteCasts(allocVoteCasts, electionMap, citizenMap);
    }

    // -------------------------------------------------
    // users
    // -------------------------------------------------
    private void validateUsers(List<UserJson> users, Map<UUID, CitizenJson> citizenMap) {
        for (var u : users) {
            if (u.citizenId() != null && !citizenMap.containsKey(u.citizenId())) {
                throw new IllegalStateException(
                        "userAccounts.json: email=" + u.email() + " unknown citizenId=" + u.citizenId());
            }
        }
    }

    // -------------------------------------------------
    // candidates
    // -------------------------------------------------
    private void validateCandidates(Map<String, CandidateJson> candidateMap, Map<String, PartyJson> partyMap) {
        for (var c : candidateMap.values()) {
            if (c.partyKey() != null && !c.partyKey().isBlank()) {
                if (!partyMap.containsKey(c.partyKey())) {
                    throw new IllegalStateException(
                            "candidates.json: candidateKey=" + c.candidateKey()
                                    + " unknown partyKey=" + c.partyKey());
                }
            }
            mustNonBlank(c.name(), "candidates.json: name blank candidateKey=" + c.candidateKey());
            mustNonBlank(c.title(), "candidates.json: title blank candidateKey=" + c.candidateKey());
            mustNonBlank(c.bio(), "candidates.json: bio blank candidateKey=" + c.candidateKey());
        }
    }

    // -------------------------------------------------
    // elections
    // -------------------------------------------------
    private void validateElections(Map<String, ElectionJson> electionMap, Map<String, CandidateJson> candidateMap) {
        for (var e : electionMap.values()) {
            if (e.candidates() == null || e.candidates().isEmpty()) {
                throw new IllegalStateException("elections.json: electionKey=" + e.electionKey() + " no candidates");
            }
            for (var ck : e.candidates()) {
                if (!candidateMap.containsKey(ck)) {
                    throw new IllegalStateException(
                            "elections.json: electionKey=" + e.electionKey() + " unknown candidateKey=" + ck);
                }
            }
        }
    }

    // -------------------------------------------------
    // rules
    // -------------------------------------------------
    private void validateRules(List<RuleJson> rules, Map<String, ElectionJson> electionMap) {
        for (var r : rules) {
            mustNonBlank(r.electionKey(), "electionRules.json: electionKey blank");
            if (!electionMap.containsKey(r.electionKey())) {
                throw new IllegalStateException("electionRules.json: unknown electionKey=" + r.electionKey());
            }
            mustNonBlank(r.cityCode(), "electionRules.json: cityCode blank electionKey=" + r.electionKey());
            if (r.minAge() != null && r.minAge() < 0) {
                throw new IllegalStateException("electionRules.json: minAge < 0 electionKey=" + r.electionKey());
            }
        }
    }

    // -------------------------------------------------
    // votes (normal ballot)
    // -------------------------------------------------
    private void validateVotes(
            List<VoteJson> votes,
            Map<String, ElectionJson> electionMap,
            Map<UUID, CitizenJson> citizenMap) {
        for (var v : votes) {
            mustNonBlank(v.electionKey(), "votes.json: electionKey blank");
            if (!electionMap.containsKey(v.electionKey())) {
                throw new IllegalStateException("votes.json: unknown electionKey=" + v.electionKey());
            }
            if (!citizenMap.containsKey(v.citizenId())) {
                throw new IllegalStateException("votes.json: unknown citizenId=" + v.citizenId());
            }
            int size = electionMap.get(v.electionKey()).candidates().size();
            if (v.candidateIndex() < 0 || v.candidateIndex() >= size) {
                throw new IllegalStateException(
                        "votes.json: candidateIndex out of range electionKey="
                                + v.electionKey() + " index=" + v.candidateIndex() + " size=" + size);
            }
        }
    }

    // -------------------------------------------------
    // committee accounts
    // -------------------------------------------------
    private void validateCommitteeAccounts(List<CommitteeJson> committee) {
        for (var c : committee) {
            mustNonBlank(c.loginId(), "committeeAccounts.json: loginId blank");
            mustNonBlank(c.password(), "committeeAccounts.json: password blank");

            if (c.role() != Role.COMMITTEE) {
                throw new IllegalStateException(
                        "committeeAccounts.json: role must be COMMITTEE loginId=" + c.loginId());
            }
            if (c.assignedPrefCode() == null || c.assignedPrefCode().isBlank()) {
                throw new IllegalStateException(
                        "committeeAccounts.json: assignedPrefCode blank loginId=" + c.loginId());
            }
        }
    }

    // -------------------------------------------------
    // allocVoteCasts (alloc ballot casts-only)
    // -------------------------------------------------
    private void validateAllocVoteCasts(
            List<AllocVoteJson> allocVoteCasts,
            Map<String, ElectionJson> electionMap,
            Map<UUID, CitizenJson> citizenMap) {
        if (allocVoteCasts == null)
            return;

        for (var av : allocVoteCasts) {
            mustNonBlank(av.electionKey(), "allocVoteCasts.json: electionKey blank");
            if (!electionMap.containsKey(av.electionKey())) {
                throw new IllegalStateException("allocVoteCasts.json: unknown electionKey=" + av.electionKey());
            }
            if (!citizenMap.containsKey(av.citizenId())) {
                throw new IllegalStateException("allocVoteCasts.json: unknown citizenId=" + av.citizenId());
            }
            if (av.items() == null || av.items().isEmpty()) {
                throw new IllegalStateException("allocVoteCasts.json: items empty electionKey=" + av.electionKey());
            }

            int size = electionMap.get(av.electionKey()).candidates().size();
            int sum = 0;

            for (var it : av.items()) {
                mustNonBlank(it.type(), "allocVoteCasts.json: item.type blank electionKey=" + av.electionKey());
                if (it.points() == null || it.points() < 0 || it.points() > 100) {
                    throw new IllegalStateException(
                            "allocVoteCasts.json: invalid points electionKey=" + av.electionKey()
                                    + " points=" + it.points());
                }
                sum += it.points();

                if ("CANDIDATE".equals(it.type())) {
                    if (it.candidateIndex() == null) {
                        throw new IllegalStateException(
                                "allocVoteCasts.json: candidateIndex required electionKey=" + av.electionKey());
                    }
                    if (it.candidateIndex() < 0 || it.candidateIndex() >= size) {
                        throw new IllegalStateException(
                                "allocVoteCasts.json: candidateIndex out of range electionKey="
                                        + av.electionKey() + " index=" + it.candidateIndex() + " size=" + size);
                    }
                } else if ("NONE_SUPPORT".equals(it.type())) {
                    // ok
                } else {
                    throw new IllegalStateException(
                            "allocVoteCasts.json: unknown item.type=" + it.type()
                                    + " electionKey=" + av.electionKey());
                }
            }

            if (sum != 100) {
                throw new IllegalStateException(
                        "allocVoteCasts.json: sum(points) must be 100 electionKey="
                                + av.electionKey() + " sum=" + sum);
            }
        }
    }

    private void mustNonBlank(String v, String msg) {
        if (v == null || v.isBlank())
            throw new IllegalStateException(msg);
    }
}
