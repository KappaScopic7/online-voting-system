package com.bteam.ovs.voting.service;

import com.bteam.ovs.auth.repo.UserAccountRepository;
import com.bteam.ovs.elections.repo.CandidateRepository;
import com.bteam.ovs.elections.repo.ElectionRepository;
import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.voting.model.VoteCast;
import com.bteam.ovs.voting.model.VoteCurrent;
import com.bteam.ovs.voting.repo.VoteCastRepository;
import com.bteam.ovs.voting.repo.VoteCurrentRepository;
import com.bteam.ovs.voting.web.dto.VoteHistoryItem;
import com.bteam.ovs.voting.web.dto.VoteStartResponse;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class VotingService {

    private final UserAccountRepository userRepo;
    private final ElectionRepository electionRepo;
    private final CandidateRepository candidateRepo;
    private final VoteCastRepository voteCastRepo;
    private final VoteCurrentRepository voteCurrentRepo;

    public VotingService(
            UserAccountRepository userRepo,
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            VoteCastRepository voteCastRepo,
            VoteCurrentRepository voteCurrentRepo
    ) {
        this.userRepo = userRepo;
        this.electionRepo = electionRepo;
        this.candidateRepo = candidateRepo;
        this.voteCastRepo = voteCastRepo;
        this.voteCurrentRepo = voteCurrentRepo;
    }

    public VoteStartResponse start(UUID accountId, UUID electionId) {
        var acc = userRepo.findById(accountId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        if (acc.getCitizenId() == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "IDENTITY_NONE", "本人認証が完了していません");
        }

        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        var candidates = candidateRepo.findByElectionId(electionId).stream()
                .map(c -> new VoteStartResponse.CandidateItem(c.getId(), c.getName()))
                .toList();

        return new VoteStartResponse(election.getId(), election.getTitle(), candidates);
    }

    @Transactional
    public VoteHistoryItem confirm(UUID accountId, UUID electionId, UUID candidateId) {
        var acc = userRepo.findById(accountId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        if (acc.getCitizenId() == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "IDENTITY_NONE", "本人認証が完了していません");
        }

        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        var now = Instant.now();
        boolean withinPeriod = !now.isBefore(election.getStartsAt()) && now.isBefore(election.getEndsAt());
        if (!withinPeriod) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ELECTION_NOT_ONGOING", "投票可能期間外です");
        }

        if (!candidateRepo.existsByIdAndElectionId(candidateId, electionId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CANDIDATE", "候補が不正です");
        }

        var candidate = candidateRepo.findById(candidateId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CANDIDATE", "候補が不正です"));

        UUID citizenId = acc.getCitizenId();

        // ===== 1) 履歴：追記 =====
        var cast = new VoteCast();
        cast.setElectionId(electionId);
        cast.setCitizenId(citizenId);
        cast.setCandidateId(candidateId);
        cast.setCastedAt(now);
        voteCastRepo.save(cast);

        // ===== 2) 最新：upsert =====
        var current = voteCurrentRepo.findByElectionIdAndCitizenId(electionId, citizenId)
                .orElseGet(() -> {
                    var v = new VoteCurrent();
                    v.setElectionId(electionId);
                    v.setCitizenId(citizenId);
                    return v;
                });

        current.setCandidateId(candidateId);
        current.setCastedAt(now);

        try {
            voteCurrentRepo.save(current);
        } catch (DataIntegrityViolationException ex) {
            // 同時リクエスト等で insert がPK衝突する可能性があるため、取り直して update
            var retry = voteCurrentRepo.findByElectionIdAndCitizenId(electionId, citizenId)
                    .orElseThrow(() -> ex);

            retry.setCandidateId(candidateId);
            retry.setCastedAt(now);
            voteCurrentRepo.save(retry);
        }

        return new VoteHistoryItem(
                cast.getId(),
                election.getId(),
                election.getTitle(),
                candidate.getId(),
                candidate.getName(),
                now
        );
    }

    public List<VoteHistoryItem> history(UUID accountId) {
        var acc = userRepo.findById(accountId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        if (acc.getCitizenId() == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "IDENTITY_NOT_LINKED", "本人認証が完了していません");
        }

        var votes = voteCastRepo.findByCitizenIdOrderByCastedAtDesc(acc.getCitizenId());
        if (votes.isEmpty()) return List.of();

        var electionIds = votes.stream().map(VoteCast::getElectionId).collect(Collectors.toSet());
        var candidateIds = votes.stream().map(VoteCast::getCandidateId).collect(Collectors.toSet());

        var elections = electionRepo.findAllById(electionIds).stream()
                .collect(Collectors.toMap(e -> e.getId(), Function.identity()));

        var candidates = candidateRepo.findAllById(candidateIds).stream()
                .collect(Collectors.toMap(c -> c.getId(), Function.identity()));

        return votes.stream()
                .map(v -> new VoteHistoryItem(
                        v.getId(),
                        v.getElectionId(),
                        elections.containsKey(v.getElectionId()) ? elections.get(v.getElectionId()).getTitle() : "(unknown election)",
                        v.getCandidateId(),
                        candidates.containsKey(v.getCandidateId()) ? candidates.get(v.getCandidateId()).getName() : "(unknown candidate)",
                        v.getCastedAt()
                ))
                .toList();
    }
}
