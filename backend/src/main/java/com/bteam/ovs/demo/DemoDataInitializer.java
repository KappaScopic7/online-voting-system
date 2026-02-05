package com.bteam.ovs.demo;

import com.bteam.ovs.auth.entity.Role;
import com.bteam.ovs.auth.entity.StaffAccount;
import com.bteam.ovs.auth.entity.UserAccount;
import com.bteam.ovs.auth.repository.StaffAccountRepository;
import com.bteam.ovs.auth.repository.UserAccountRepository;
import com.bteam.ovs.candidates.entity.Candidate;
import com.bteam.ovs.candidates.repository.CandidateRepository;
import com.bteam.ovs.citizen.entity.Citizen;
import com.bteam.ovs.citizen.entity.Gender;
import com.bteam.ovs.citizen.repository.CitizenRepository;
import com.bteam.ovs.elections.entity.*;
import com.bteam.ovs.elections.repository.*;
import com.bteam.ovs.parties.entity.Party;
import com.bteam.ovs.parties.repository.PartyRepository;
import com.bteam.ovs.voting.entity.VoteCast;
import com.bteam.ovs.voting.entity.VoteCurrent;
import com.bteam.ovs.voting.repository.VoteCastRepository;
import com.bteam.ovs.voting.repository.VoteCurrentRepository;
import com.bteam.ovs.voting.repository.VoteAllocCastRepository;
import com.bteam.ovs.voting.repository.VoteAllocCurrentRepository;
import com.bteam.ovs.voting.repository.VoteAllocItemRepository;
import com.bteam.ovs.demo.json.*;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.CommandLineRunner;
// import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.*;

@Profile({ "dev", "prodlike" })
@Configuration
public class DemoDataInitializer {

    private static final String DEMO_ADMIN_LOGIN_ID = "admin";
    private static final String DEMO_ADMIN_PASSWORD = "Passw0rd!!";

    @Bean
    CommandLineRunner demoInit(DemoDataService demoDataService) {
        return args -> demoDataService.resetAndSeed();
    }

    void init(
            UserAccountRepository userRepo,
            StaffAccountRepository staffRepo,

            PartyRepository partyRepo,
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            ElectionEligibilityRuleRepository ruleRepo,

            VoteCastRepository voteCastRepo,
            VoteCurrentRepository voteCurrentRepo,

            VoteAllocCastRepository voteAllocCastRepo,
            VoteAllocCurrentRepository voteAllocCurrentRepo,
            VoteAllocItemRepository voteAllocItemRepo,

            CitizenRepository citizenRepo,
            PasswordEncoder passwordEncoder,
            ObjectMapper om) {
        seedAdmin(staffRepo, passwordEncoder);

        var loader = new DemoJsonLoader(om);

        List<CitizenJson> citizens = loader.loadList("citizens.json", new TypeReference<>() {
        });
        List<PartyJson> parties = loader.loadList("party.json", new TypeReference<>() {
        });
        List<CandidateJson> candidates = loader.loadList("candidates.json", new TypeReference<>() {
        });
        List<ElectionJson> elections = loader.loadList("elections.json", new TypeReference<>() {
        });
        List<RuleJson> rules = loader.loadList("electionRules.json", new TypeReference<>() {
        });
        List<VoteJson> voteCasts = loader.loadList("voteCasts.json", new TypeReference<>() {
        });
        List<UserJson> users = loader.loadList("userAccounts.json", new TypeReference<>() {
        });
        List<CommitteeJson> committee = loader.loadList("committeeAccounts.json", new TypeReference<>() {
        });
        List<AllocVoteJson> allocVoteCasts = loader.loadList("allocVoteCasts.json", new TypeReference<>() {
        });

        var indexed = new DemoDataIndexer().indexAll(citizens, parties, candidates, elections);

        new DemoDataValidator().validateAll(
                indexed.citizenMap(),
                indexed.partyMap(),
                indexed.candidateMap(),
                indexed.electionMap(),
                rules, voteCasts, users, committee, allocVoteCasts);

        Map<String, ElectionCreated> createdElections = seedElectionsAndCandidates(electionRepo, candidateRepo,
                elections, indexed.candidateMap());

        // ===== seed =====
        seedCitizens(citizenRepo, citizens);
        seedUsers(userRepo, passwordEncoder, users);
        seedParties(partyRepo, parties);
        seedRules(ruleRepo, rules, createdElections);
        seedVotes(voteCastRepo, voteCurrentRepo, voteCasts, createdElections);

        // ★ alloc: casts + items を入れて、最新から current 生成
        new AllocVoteSeeder().seedFromCastsOnly(
                voteAllocCastRepo, voteAllocCurrentRepo, voteAllocItemRepo,
                allocVoteCasts, createdElections);

        seedCommittee(staffRepo, passwordEncoder, committee);
    }

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

    public void mustNonBlank(String v, String msg) {
        if (v == null || v.isBlank())
            throw new IllegalStateException(msg);
    }

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

    public record ElectionCreated(UUID electionId, List<UUID> candidateIds) {
    }

    private Map<String, ElectionCreated> seedElectionsAndCandidates(
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            List<ElectionJson> elections,
            Map<String, CandidateJson> candidateMap) {
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

    private void seedRules(
            ElectionEligibilityRuleRepository ruleRepo,
            List<RuleJson> rules,
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

    private void seedVotes(
            VoteCastRepository voteCastRepo,
            VoteCurrentRepository voteCurrentRepo,
            List<VoteJson> votes,
            Map<String, ElectionCreated> created) {
        var now = Instant.now();

        for (var vj : votes) {
            var ce = created.get(vj.electionKey());
            if (ce == null)
                throw new IllegalStateException("votes.json: unknown electionKey=" + vj.electionKey());

            UUID candidateId = ce.candidateIds().get(vj.candidateIndex());
            Instant castedAt = now.plusSeconds(vj.castedAtOffsetSec());

            // cast: 履歴
            var cast = new VoteCast();
            cast.setElectionId(ce.electionId());
            cast.setCitizenId(vj.citizenId());
            cast.setCandidateId(candidateId);
            cast.setCastedAt(castedAt);
            voteCastRepo.save(cast);

            // current: upsert
            var cur = voteCurrentRepo.findByElectionIdAndCitizenId(ce.electionId(), vj.citizenId())
                    .orElseGet(VoteCurrent::new);
            cur.setElectionId(ce.electionId());
            cur.setCitizenId(vj.citizenId());
            cur.setCandidateId(candidateId);
            cur.setCastedAt(castedAt);
            voteCurrentRepo.save(cur);
        }
    }
}
