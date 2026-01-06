package com.bteam.ovs.voting.service;

import com.bteam.ovs.auth.repo.PortalAccountRepository;
import com.bteam.ovs.elections.repo.CandidateRepository;
import com.bteam.ovs.elections.repo.ElectionRepository;
import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.voting.model.Vote;
import com.bteam.ovs.voting.repo.VoteRepository;
import com.bteam.ovs.voting.web.dto.VoteHistoryItem;
import com.bteam.ovs.voting.web.dto.VoteStartResponse;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.List;
import java.util.UUID;

import java.time.Instant;

@Service
public class VotingService {

    private final PortalAccountRepository portalRepo;
    private final ElectionRepository electionRepo;
    private final CandidateRepository candidateRepo;
    private final VoteRepository voteRepo;

    public VotingService(
            PortalAccountRepository portalRepo,
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            VoteRepository voteRepo
    ) {
        this.portalRepo = portalRepo;
        this.electionRepo = electionRepo;
        this.candidateRepo = candidateRepo;
        this.voteRepo = voteRepo;
    }

    public VoteStartResponse start(String voterEmail, UUID electionId) {
        var acc = portalRepo.findByEmail(voterEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        if (acc.getCitizenId() == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "IDENTITY_NOT_LINKED", "本人認証が完了していません");
        }

        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        var candidates = candidateRepo.findByElectionId(electionId).stream()
                .map(c -> new VoteStartResponse.CandidateItem(c.getId(), c.getName()))
                .toList();

        return new VoteStartResponse(election.getId(), election.getTitle(), candidates);
    }

    public VoteHistoryItem confirm(String voterEmail, UUID electionId, UUID candidateId) {
        var acc = portalRepo.findByEmail(voterEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        if (acc.getCitizenId() == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "IDENTITY_NOT_LINKED", "本人認証が完了していません");
        }

        // 選挙存在
        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        // 候補がその選挙の候補かチェック（重要）
        if (!candidateRepo.existsByIdAndElectionId(candidateId, electionId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CANDIDATE", "候補が不正です");
        }

        // 候補情報（完了画面用に名前が必要）
        var candidate = candidateRepo.findById(candidateId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CANDIDATE", "候補が不正です"));

        // 二重投票チェック
        if (voteRepo.findByElectionIdAndCitizenId(electionId, acc.getCitizenId()).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "ALREADY_VOTED", "既に投票済みです");
        }

        var v = new Vote();
        v.setElectionId(electionId);
        v.setCitizenId(acc.getCitizenId());
        v.setCandidateId(candidateId);
        v.setCastedAt(Instant.now());

        try {
            var saved = voteRepo.save(v);

            return new VoteHistoryItem(
                    saved.getId(),
                    election.getId(),
                    election.getTitle(),
                    candidate.getId(),
                    candidate.getName(),
                    saved.getCastedAt()
            );

        } catch (DataIntegrityViolationException ex) {
            throw new ApiException(HttpStatus.CONFLICT, "ALREADY_VOTED", "既に投票済みです");
        }
    }

    public List<VoteHistoryItem> history(String voterEmail) {
        var acc = portalRepo.findByEmail(voterEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        if (acc.getCitizenId() == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "IDENTITY_NOT_LINKED", "本人認証が完了していません");
        }

        var votes = voteRepo.findByCitizenIdOrderByCastedAtDesc(acc.getCitizenId());
        if (votes.isEmpty()) return List.of();

        // N+1回避：IDをまとめて引く
        var electionIds = votes.stream().map(Vote::getElectionId).collect(Collectors.toSet());
        var candidateIds = votes.stream().map(Vote::getCandidateId).collect(Collectors.toSet());

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
