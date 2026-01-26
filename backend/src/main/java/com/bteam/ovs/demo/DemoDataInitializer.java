package com.bteam.ovs.demo;

import com.bteam.ovs.auth.entity.Role;
import com.bteam.ovs.auth.entity.StaffAccount;
import com.bteam.ovs.auth.entity.UserAccount;
import com.bteam.ovs.auth.repository.StaffAccountRepository;
import com.bteam.ovs.auth.repository.UserAccountRepository;
import com.bteam.ovs.citizen.entity.Citizen;
import com.bteam.ovs.citizen.repository.CitizenRepository;
import com.bteam.ovs.elections.entity.Candidate;
import com.bteam.ovs.elections.entity.Election;
import com.bteam.ovs.elections.entity.ElectionEligibilityRule;
import com.bteam.ovs.elections.repository.CandidateRepository;
import com.bteam.ovs.elections.repository.ElectionEligibilityRuleRepository;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.voting.entity.VoteCast;
import com.bteam.ovs.voting.entity.VoteCurrent;
import com.bteam.ovs.voting.repository.VoteCastRepository;
import com.bteam.ovs.voting.repository.VoteCurrentRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.io.InputStream;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Profile("demo")
@Configuration
public class DemoDataInitializer {

    private static final String DEMO_ELECTION_PREFIX = "デモ選挙";

    private static final String DEMO_ADMIN_LOGIN_ID = "admin";
    private static final String DEMO_ADMIN_PASSWORD = "Passw0rd!!";

    private static final String DEMO_COMMITTEE_LOGIN_ID = "committee";
    private static final String DEMO_COMMITTEE_PASSWORD = "Passw0rd!!";

    @Bean
    CommandLineRunner demoInit(DemoDataService demoDataService) {
        return args -> demoDataService.resetAndSeed();
    }

    void init(
            UserAccountRepository userRepo,
            StaffAccountRepository staffRepo,
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            VoteCastRepository voteCastRepo,
            VoteCurrentRepository voteCurrentRepo,
            CitizenRepository citizenRepo,
            ElectionEligibilityRuleRepository ruleRepo,
            PasswordEncoder passwordEncoder,
            ObjectMapper om
    ) {
        seedAdmin(staffRepo, passwordEncoder);
        seedCommittee(staffRepo, passwordEncoder);

        // ===== JSON load =====
        List<CitizenJson> citizens = readJson(om, "citizens.json", new TypeReference<>() {});
        List<UserJson> users = readJson(om, "users.json", new TypeReference<>() {});
        List<ElectionJson> elections = readJson(om, "elections.json", new TypeReference<>() {});
        List<RuleJson> rules = readJson(om, "rules.json", new TypeReference<>() {});
        List<VoteJson> votes = readJson(om, "votes.json", new TypeReference<>() {});

        // ===== seed citizen/user =====
        seedCitizensFromJson(citizenRepo, citizens);
        seedUsersFromJson(userRepo, passwordEncoder, users);

        // ===== seed elections/rules/votes =====
        seedElectionsRulesVotesFromJson(
                electionRepo, candidateRepo, ruleRepo,
                voteCastRepo, voteCurrentRepo,
                elections, rules, votes
        );
    }

    // -------------------------
    // JSON DTOs
    // -------------------------
    record CitizenJson(UUID citizenId, LocalDate birthDate, String prefCode, String cityCode) {}
    record UserJson(
            String email,
            String password,
            Role role,
            boolean emailVerified,
            boolean enabled,
            boolean locked,
            UUID citizenId
    ) {}
    record ElectionJson(
            String key,
            String title,
            long startsAtOffsetSec,
            long endsAtOffsetSec,
            List<String> candidates
    ) {}
    record RuleJson(String electionKey, String cityCode, Integer minAge) {}
    record VoteJson(String electionKey, UUID citizenId, int candidateIndex, long castedAtOffsetSec) {}

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
        if (staffRepo.existsByLoginId(DEMO_ADMIN_LOGIN_ID)) return;

        var admin = new StaffAccount();
        admin.setLoginId(DEMO_ADMIN_LOGIN_ID);
        admin.setPasswordHash(passwordEncoder.encode(DEMO_ADMIN_PASSWORD));
        admin.setRole(Role.ADMIN);
        admin.setEnabled(true);
        admin.setLocked(false);
        staffRepo.save(admin);
    }

    private void seedCommittee(StaffAccountRepository staffRepo, PasswordEncoder passwordEncoder) {
        if (staffRepo.existsByLoginId(DEMO_COMMITTEE_LOGIN_ID)) return;

        var committee = new StaffAccount();
        committee.setLoginId(DEMO_COMMITTEE_LOGIN_ID);
        committee.setPasswordHash(passwordEncoder.encode(DEMO_COMMITTEE_PASSWORD));
        committee.setRole(Role.COMMITTEE);
        committee.setEnabled(true);
        committee.setLocked(false);
        staffRepo.save(committee);
    }

    // -------------------------
    // seed citizen/user from JSON
    // -------------------------
    private void seedCitizensFromJson(CitizenRepository citizenRepo, List<CitizenJson> items) {
        for (var j : items) {
            var citizen = citizenRepo.findById(j.citizenId()).orElseGet(Citizen::new);
            citizen.setCitizenId(j.citizenId());
            citizen.setBirthDate(j.birthDate());
            citizen.setPrefCode(j.prefCode());
            citizen.setCityCode(j.cityCode());
            citizenRepo.save(citizen);
        }
    }

    private void seedUsersFromJson(UserAccountRepository userRepo, PasswordEncoder passwordEncoder, List<UserJson> items) {
        for (var j : items) {
            var acc = userRepo.findByEmail(j.email()).orElseGet(UserAccount::new);

            acc.setEmail(j.email());
            acc.setRole(j.role());
            acc.setEmailVerified(j.emailVerified());
            acc.setEnabled(j.enabled());
            acc.setLocked(j.locked());

            // citizenId は null を許す（未本人認証を作れる）
            acc.setCitizenId(j.citizenId());

            // 毎回上書きでもいいが、変更しない方が扱いやすいなら条件付きにしてもOK
            acc.setPasswordHash(passwordEncoder.encode(j.password()));

            userRepo.save(acc);
        }
    }

    // -------------------------
    // seed elections/rules/votes from JSON
    // -------------------------
    private void seedElectionsRulesVotesFromJson(
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            ElectionEligibilityRuleRepository ruleRepo,
            VoteCastRepository voteCastRepo,
            VoteCurrentRepository voteCurrentRepo,
            List<ElectionJson> elections,
            List<RuleJson> rules,
            List<VoteJson> votes
    ) {
        // 既存の票は掃除
        voteCurrentRepo.deleteAll();
        voteCastRepo.deleteAll();

        // 既存デモ選挙を掃除（prefix）
        electionRepo.deleteByTitleStartingWith(DEMO_ELECTION_PREFIX);

        // ルールも掃除（簡易）
        ruleRepo.deleteAll();

        var now = Instant.now();
        String today = LocalDate.now().toString();

        // key -> (electionId, candidateIds)
        Map<String, CreatedElection> created = new HashMap<>();

        for (var ej : elections) {
            var election = new Election();
            election.setTitle(DEMO_ELECTION_PREFIX + " " + ej.title() + " " + today);
            election.setStartsAt(now.plusSeconds(ej.startsAtOffsetSec()));
            election.setEndsAt(now.plusSeconds(ej.endsAtOffsetSec()));
            electionRepo.save(election);

            List<UUID> candidateIds = new ArrayList<>();
            for (String name : ej.candidates()) {
                var c = new Candidate();
                c.setElectionId(election.getId());
                c.setName(name);
                c = candidateRepo.save(c);
                candidateIds.add(c.getId());
            }

            created.put(ej.key(), new CreatedElection(election.getId(), candidateIds));
        }

        // rules
        for (var rj : rules) {
            var ce = require(created, rj.electionKey(), "rules.json");
            var r = new ElectionEligibilityRule();
            r.setElectionId(ce.electionId());
            r.setCityCode(rj.cityCode());
            r.setMinAge(rj.minAge() == null ? 18 : rj.minAge());
            ruleRepo.save(r);
        }

        // votes
        for (var vj : votes) {
            var ce = require(created, vj.electionKey(), "votes.json");
            if (vj.candidateIndex() < 0 || vj.candidateIndex() >= ce.candidateIds().size()) {
                throw new IllegalStateException("candidateIndex out of range: " + vj.electionKey());
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

    private record CreatedElection(UUID electionId, List<UUID> candidateIds) {}

    private CreatedElection require(Map<String, CreatedElection> map, String key, String file) {
        var v = map.get(key);
        if (v == null) throw new IllegalStateException("Unknown electionKey in " + file + ": " + key);
        return v;
    }
}
