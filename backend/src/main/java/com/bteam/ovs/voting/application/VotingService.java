package com.bteam.ovs.voting.application;

import com.bteam.ovs.auth.infra.jpa.PortalAccountJpaRepository;
import com.bteam.ovs.common.errors.ApiException;
import com.bteam.ovs.election.infra.jpa.CandidateJpaRepository;
import com.bteam.ovs.election.infra.jpa.ElectionJpaRepository;
import com.bteam.ovs.voting.api.dto.VoteStartResponse;
import com.bteam.ovs.voting.infra.jpa.VoteEntity;
import com.bteam.ovs.voting.infra.jpa.VoteJpaRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class VotingService {

    private final PortalAccountJpaRepository portalRepo;
    private final ElectionJpaRepository electionRepo;
    private final CandidateJpaRepository candidateRepo;
    private final VoteJpaRepository voteRepo;

    public VotingService(
            PortalAccountJpaRepository portalRepo,
            ElectionJpaRepository electionRepo,
            CandidateJpaRepository candidateRepo,
            VoteJpaRepository voteRepo
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

    public void confirm(String voterEmail, UUID electionId, UUID candidateId) {
        var acc = portalRepo.findByEmail(voterEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        if (acc.getCitizenId() == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "IDENTITY_NOT_LINKED", "本人認証が完了していません");
        }

        // 候補がその選挙の候補かチェック（重要）
        if (!candidateRepo.existsByIdAndElectionId(candidateId, electionId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CANDIDATE", "候補が不正です");
        }

        // 二重投票チェック（先に見る）
        if (voteRepo.findByElectionIdAndCitizenId(electionId, acc.getCitizenId()).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "ALREADY_VOTED", "既に投票済みです");
        }

        var v = new VoteEntity();
        v.setElectionId(electionId);
        v.setCitizenId(acc.getCitizenId());
        v.setCandidateId(candidateId);
        v.setCastedAt(Instant.now());

        try {
            voteRepo.save(v);
        } catch (DataIntegrityViolationException ex) {
            // 競合でユニーク制約に当たった場合
            throw new ApiException(HttpStatus.CONFLICT, "ALREADY_VOTED", "既に投票済みです");
        }
    }
}
