package com.bteam.ovs.demo;

import com.bteam.ovs.auth.entity.Role;
import com.bteam.ovs.auth.entity.StaffAccount;
import com.bteam.ovs.auth.entity.UserAccount;
import com.bteam.ovs.auth.repository.StaffAccountRepository;
import com.bteam.ovs.auth.repository.UserAccountRepository;
import com.bteam.ovs.citizen.entity.Citizen;
import com.bteam.ovs.citizen.entity.Gender;
import com.bteam.ovs.citizen.repository.CitizenRepository;
// import com.bteam.ovs.demo.DemoDataInitializer.CandidateJson;
// import com.bteam.ovs.demo.DemoDataInitializer.CitizenJson;
// import com.bteam.ovs.demo.DemoDataInitializer.ElectionJson;
// import com.bteam.ovs.demo.DemoDataInitializer.PartyJson;
// import com.bteam.ovs.demo.DemoDataInitializer.RuleJson;
// import com.bteam.ovs.demo.DemoDataInitializer.UserJson;
// import com.bteam.ovs.demo.DemoDataInitializer.VoteJson;
import com.bteam.ovs.elections.entity.*;
import com.bteam.ovs.elections.repository.*;
import com.bteam.ovs.voting.entity.VoteCast;
import com.bteam.ovs.voting.entity.VoteCurrent;
import com.bteam.ovs.voting.repository.VoteCastRepository;
import com.bteam.ovs.voting.repository.VoteCurrentRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.io.InputStream;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Profile("demo") @Configuration
public class DemoDataInitializer {

    private static final String DEMO_ADMIN_LOGIN_ID = "admin";
    private static final String DEMO_ADMIN_PASSWORD = "Passw0rd!!";

    @Bean
    CommandLineRunner demoInit(DemoDataService demoDataService) {
        return args -> demoDataService.resetAndSeed();
    }

    void init(UserAccountRepository userRepo, StaffAccountRepository staffRepo,

            PartyRepository partyRepo, ElectionRepository electionRepo, CandidateRepository candidateRepo,
            ElectionEligibilityRuleRepository ruleRepo,

            VoteCastRepository voteCastRepo, VoteCurrentRepository voteCurrentRepo,

            CitizenRepository citizenRepo, PasswordEncoder passwordEncoder, ObjectMapper om) {
        seedAdmin(staffRepo, passwordEncoder);

        // ===== JSON load =====
        List<CitizenJson> citizens = readJson(om, "citizens.json", new TypeReference<>() {
        });
        List<UserJson> users = readJson(om, "userAccounts.json", new TypeReference<>() {
        });
        List<PartyJson> parties = readJson(om, "party.json", new TypeReference<>() {
        });
        List<CandidateJson> candidates = readJson(om, "candidates.json", new TypeReference<>() {
        });
        List<ElectionJson> elections = readJson(om, "elections.json", new TypeReference<>() {
        });
        List<RuleJson> rules = readJson(om, "electionRules.json", new TypeReference<>() {
        });
        List<VoteJson> votes = readJson(om, "voteCurrents.json", new TypeReference<>() {
        });
        List<CommitteeJson> committee = readJson(om, "committeeAccounts.json", new TypeReference<>() {
        });

        // ===== index + validate =====
        var citizenMap = indexCitizens(citizens);
        var partyMap = indexParties(parties);
        var candidateMap = indexCandidates(candidates);
        var electionMap = indexElections(elections);

        validateAll(citizenMap, partyMap, candidateMap, electionMap, rules, votes, users, committee);

        // // ===== DB reset (全部作り直し) =====
        // voteCurrentRepo.deleteAll();
        // voteCastRepo.deleteAll();
        // ruleRepo.deleteAll();
        // candidateRepo.deleteAll();
        // electionRepo.deleteAll();
        // partyRepo.deleteAll();
        // userRepo.deleteAll();
        // citizenRepo.deleteAll();

        // ===== seed =====
        seedCitizens(citizenRepo, citizens);
        seedUsers(userRepo, passwordEncoder, users);
        seedParties(partyRepo, parties);

        Map<String, ElectionCreated> createdElections = seedElectionsAndCandidates(electionRepo, candidateRepo,
                elections, candidateMap);

        seedRules(ruleRepo, rules, createdElections);
        seedVotes(voteCastRepo, voteCurrentRepo, votes, createdElections);
        seedCommittee(staffRepo, passwordEncoder, committee);
    }

    // -------------------------
                    // JSON DTOs
                    // -------------------------
                    record CitizenJson(UUID citizenId, String familyName, String givenName, LocalDate birthDate, String prefCode,
                            String cityCode, String addressLine, String gender) {
                    }

                    record UserJson(String email, String password, Role role, boolean emailVerified, boolean enabled, boolean locked,
                            UUID citizenId) {
                    }

                    record PartyJson(String partyKey, String name, String shortName, List<String> ideologyTags, String description,
                            String color) {
                    }

                    record CandidateJson(String candidateKey, String name, Integer age, String partyKey, String title, String bio,
            List<String> policies, String websiteUrl, String imageUrl) {
    }

    record DistrictJson(String prefCode, String cityCode, String label) {
    }

    record ElectionJson(String electionKey, String title, String summary, String electionType, DistrictJson district,
            String ballotType, long startsAtOffsetSec, long endsAtOffsetSec, List<String> candidates) {
    }

    record RuleJson(String electionKey, String cityCode, Integer minAge) {
    }

    record VoteJson(String electionKey, UUID citizenId, int candidateIndex, long castedAtOffsetSec) {
    }

    record CommitteeJson(String loginId, String password, Role role, String assignedPrefCode, String assignedCityCode,
            boolean enabled, boolean locked) {
    }

    private <T> T readJson(ObjectMapper om, String classpathFile, TypeReference<T> type) {
        try (InputStream in = new ClassPathResource(classpathFile).getInputStream()) {
            return om.readValue(in, type);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to read " + classpathFile, e);
        }
    }

    // -------------------------
    // seed staff
    // -------------------------
    private void seedAdmin(StaffAccountRepository staffRepo, PasswordEncoder passwordEncoder) {
        if (staffRepo.existsByLoginId(DEMO_ADMIN_LOGIN_ID))
            return;
        var admin = new StaffAccount();
        admin.setLoginId(DEMO_ADMIN_LOGIN_ID);
        admin.setPasswordHash(passwordEncoder.encode(DEMO_ADMIN_PASSWORD));
        admin.setRole(Role.ADMIN);
        admin.setEnabled(true);
        admin.setLocked(false);
        staffRepo.save(admin);
    }

    private void seedCommittee(StaffAccountRepository staffRepo, PasswordEncoder passwordEncoder,
            List<CommitteeJson> items) {
        for (var j : items) {
            if (staffRepo.existsByLoginId(j.loginId()))
                continue;

            var c = new StaffAccount();
            c.setLoginId(j.loginId());
            c.setRole(j.role());
            c.setAssignedPrefCode(j.assignedPrefCode());
            c.setAssignedCityCode(j.assignedCityCode());
            c.setEnabled(j.enabled());
            c.setLocked(j.locked());
            c.setPasswordHash(passwordEncoder.encode(j.password()));
            staffRepo.save(c);
        }
    }

    // -------------------------
    // index
    // -------------------------
    private Map<UUID, CitizenJson> indexCitizens(List<CitizenJson> items) {
        var map = new LinkedHashMap<UUID, CitizenJson>();
        for (var x : items) {
            if (x.citizenId() == null)
                throw new IllegalStateException("citizens.json: citizenId null");
            if (map.putIfAbsent(x.citizenId(), x) != null) {
                throw new IllegalStateException("citizens.json: duplicate citizenId " + x.citizenId());
            }
        }
        return map;
    }

    private Map<String, PartyJson> indexParties(List<PartyJson> items) {
        var map = new LinkedHashMap<String, PartyJson>();
        for (var x : items) {
            mustNonBlank(x.partyKey(), "party.json: partyKey blank");
            if (map.putIfAbsent(x.partyKey(), x) != null) {
                throw new IllegalStateException("party.json: duplicate partyKey " + x.partyKey());
            }
        }
        return map;
    }

    private Map<String, CandidateJson> indexCandidates(List<CandidateJson> items) {
        var map = new LinkedHashMap<String, CandidateJson>();
        for (var x : items) {
            mustNonBlank(x.candidateKey(), "candidates.json: candidateKey blank");
            if (map.putIfAbsent(x.candidateKey(), x) != null) {
                throw new IllegalStateException("candidates.json: duplicate candidateKey " + x.candidateKey());
            }
        }
        return map;
    }

    private Map<String, ElectionJson> indexElections(List<ElectionJson> items) {
        var map = new LinkedHashMap<String, ElectionJson>();
        for (var x : items) {
            mustNonBlank(x.electionKey(), "elections.json: electionKey blank");
            if (map.putIfAbsent(x.electionKey(), x) != null) {
                throw new IllegalStateException("elections.json: duplicate electionKey " + x.electionKey());
            }
        }
        return map;
    }

    // -------------------------
    // validation
    // -------------------------
    private void validateAll(Map<UUID, CitizenJson> citizenMap, Map<String, PartyJson> partyMap,
            Map<String, CandidateJson> candidateMap, Map<String, ElectionJson> electionMap, List<RuleJson> rules,
            List<VoteJson> votes, List<UserJson> users, List<CommitteeJson> committiee) {
        // users: citizenId があるなら citizens に存在する
        for (var u : users) {
            if (u.citizenId() != null && !citizenMap.containsKey(u.citizenId())) {
                throw new IllegalStateException(
                        "userAccounts.json: email=" + u.email() + " unknown citizenId=" + u.citizenId());
            }
        }

        // candidate: partyKey があるなら party に存在
        for (var c : candidateMap.values()) {
            if (c.partyKey() != null && !c.partyKey().isBlank()) {
                if (!partyMap.containsKey(c.partyKey())) {
                    throw new IllegalStateException(
                            "candidates.json: candidateKey=" + c.candidateKey() + " unknown partyKey=" + c.partyKey());
                }
            }
            mustNonBlank(c.name(), "candidates.json: name blank candidateKey=" + c.candidateKey());
            mustNonBlank(c.title(), "candidates.json: title blank candidateKey=" + c.candidateKey());
            mustNonBlank(c.bio(), "candidates.json: bio blank candidateKey=" + c.candidateKey());
        }

        // election: candidates は必ず candidateKey として存在
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

        // rules: electionKey は存在
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

        // votes: electionKey/citizenId/index
        for (var v : votes) {
            mustNonBlank(v.electionKey(), "voteCurrents.json: electionKey blank");
            if (!electionMap.containsKey(v.electionKey())) {
                throw new IllegalStateException("voteCurrents.json: unknown electionKey=" + v.electionKey());
            }
            if (!citizenMap.containsKey(v.citizenId())) {
                throw new IllegalStateException("voteCurrents.json: unknown citizenId=" + v.citizenId());
            }
            int size = electionMap.get(v.electionKey()).candidates().size();
            if (v.candidateIndex() < 0 || v.candidateIndex() >= size) {
                throw new IllegalStateException("voteCurrents.json: candidateIndex out of range electionKey="
                        + v.electionKey() + " index=" + v.candidateIndex() + " size=" + size);
            }
        }

        // committeeAccounts.json
        for (var c : committiee) {
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

    private void mustNonBlank(String v, String msg) {
        if (v == null || v.isBlank())
            throw new IllegalStateException(msg);
    }

    // -------------------------
    // seed
    // -------------------------

    private Gender parseGender(String s) {
        if (s == null)
            throw new IllegalStateException("citizens.json: gender null");
        try {
            return Gender.valueOf(s);
        } catch (Exception e) {
            throw new IllegalStateException("citizens.json: invalid gender=" + s, e);
        }
    }

    private void seedCitizens(CitizenRepository citizenRepo, List<CitizenJson> items) {
        for (var j : items) {
            var citizen = citizenRepo.findById(j.citizenId()).orElseGet(Citizen::new);
            citizen.setCitizenId(j.citizenId());
            citizen.setFamilyName(j.familyName());
            citizen.setGivenName(j.givenName());
            citizen.setBirthDate(j.birthDate());
            citizen.setPrefCode(j.prefCode());
            citizen.setCityCode(j.cityCode());
            citizen.setAddressLine(j.addressLine());
            citizen.setGender(parseGender(j.gender()));
            citizenRepo.save(citizen);
        }
    }

    private void seedUsers(UserAccountRepository userRepo, PasswordEncoder passwordEncoder, List<UserJson> items) {
        for (var j : items) {
            var u = new UserAccount();
            u.setEmail(j.email());
            u.setRole(j.role());
            u.setEmailVerified(j.emailVerified());
            u.setEnabled(j.enabled());
            u.setLocked(j.locked());
            u.setCitizenId(j.citizenId());
            u.setPasswordHash(passwordEncoder.encode(j.password()));
            userRepo.save(u);
        }
    }

    private void seedParties(PartyRepository partyRepo, List<PartyJson> items) {
        for (var j : items) {
            var p = new Party();
            p.setPartyKey(j.partyKey());
            p.setName(j.name());
            p.setShortName(j.shortName());
            p.setColor(j.color());
            p.setDescription(j.description());
            p.setIdeologyTags(j.ideologyTags() == null ? List.of() : j.ideologyTags());
            partyRepo.save(p);
        }
    }

    private record ElectionCreated(UUID electionId, List<UUID> candidateIds) {
    }

    private Map<String, ElectionCreated> seedElectionsAndCandidates(ElectionRepository electionRepo,
            CandidateRepository candidateRepo, List<ElectionJson> elections, Map<String, CandidateJson> candidateMap) {
        var now = Instant.now();
        Map<String, ElectionCreated> created = new HashMap<>();

        for (var ej : elections) {
            var e = new Election();
            e.setElectionKey(ej.electionKey());
            e.setTitle(ej.title());
            e.setSummary(ej.summary());
            e.setElectionType(ElectionType.valueOf(ej.electionType()));
            e.setBallotType(BallotType.valueOf(ej.ballotType()));
            e.setDistrictPrefCode(ej.district().prefCode());
            e.setDistrictCityCode(ej.district().cityCode());
            e.setDistrictLabel(ej.district().label());
            e.setStartsAt(now.plusSeconds(ej.startsAtOffsetSec()));
            e.setEndsAt(now.plusSeconds(ej.endsAtOffsetSec()));
            electionRepo.save(e);

            List<UUID> candidateIds = new ArrayList<>();
            for (int i = 0; i < ej.candidates().size(); i++) {
                String candidateKey = ej.candidates().get(i);
                CandidateJson cj = candidateMap.get(candidateKey);

                var c = new Candidate();
                c.setElectionId(e.getId());
                c.setCandidateKey(candidateKey);
                c.setName(cj.name());
                c.setAge(cj.age());
                c.setPartyKey((cj.partyKey() == null || cj.partyKey().isBlank()) ? null : cj.partyKey());
                c.setTitle(cj.title());
                c.setBio(cj.bio());
                c.setPolicies(cj.policies() == null ? List.of() : cj.policies());
                c.setWebsiteUrl(cj.websiteUrl());
                c.setImageUrl(cj.imageUrl());
                c.setSortOrder(i);
                c = candidateRepo.save(c);
                candidateIds.add(c.getId());
            }

            created.put(ej.electionKey(), new ElectionCreated(e.getId(), candidateIds));
        }

        return created;
    }

    private void seedRules(ElectionEligibilityRuleRepository ruleRepo, List<RuleJson> rules,
            Map<String, ElectionCreated> created) {
        for (var rj : rules) {
            var ce = created.get(rj.electionKey());
            if (ce == null)
                throw new IllegalStateException("electionRules.json: unknown electionKey=" + rj.electionKey());

            var r = new ElectionEligibilityRule();
            r.setElectionId(ce.electionId());
            r.setCityCode(rj.cityCode());
            r.setMinAge(rj.minAge() == null ? 18 : rj.minAge());
            ruleRepo.save(r);
        }
    }

    private void seedVotes(VoteCastRepository voteCastRepo, VoteCurrentRepository voteCurrentRepo, List<VoteJson> votes,
            Map<String, ElectionCreated> created) {
        var now = Instant.now();

        for (var vj : votes) {
            var ce = created.get(vj.electionKey());
            if (ce == null)
                throw new IllegalStateException("voteCurrents.json: unknown electionKey=" + vj.electionKey());

            if (vj.candidateIndex() < 0 || vj.candidateIndex() >= ce.candidateIds().size()) {
                throw new IllegalStateException(
                        "voteCurrents.json: candidateIndex out of range electionKey=" + vj.electionKey());
            }

            UUID candidateId = ce.candidateIds().get(vj.candidateIndex());
            Instant castedAt = now.plusSeconds(vj.castedAtOffsetSec());

            var cast = new VoteCast();
            cast.setElectionId(ce.electionId());
            cast.setCitizenId(vj.citizenId());
            cast.setCandidateId(candidateId);
            cast.setCastedAt(castedAt);
            voteCastRepo.save(cast);

            var cur = new VoteCurrent();
            cur.setElectionId(ce.electionId());
            cur.setCitizenId(vj.citizenId());
            cur.setCandidateId(candidateId);
            cur.setCastedAt(castedAt);
            voteCurrentRepo.save(cur);
        }
    }
}
