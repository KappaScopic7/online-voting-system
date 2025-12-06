package com.bteam.ovs.vote.service;

import com.bteam.ovs.election.domain.Candidate;
import com.bteam.ovs.election.domain.Election;
import com.bteam.ovs.election.domain.ElectionStatus;
import com.bteam.ovs.election.repository.CandidateRepository;
import com.bteam.ovs.election.repository.ElectionRepository;
import com.bteam.ovs.vote.domain.Vote;
import com.bteam.ovs.vote.domain.VoteStatus;
import com.bteam.ovs.vote.dto.MyVoteResponse;
import com.bteam.ovs.vote.dto.CastVoteRequest;
import com.bteam.ovs.vote.dto.ElectionResultItemResponse;
import com.bteam.ovs.vote.repository.VoteRepository;
import com.bteam.ovs.voter.domain.VoterAccount;
import com.bteam.ovs.voter.repository.VoterAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

import static org.springframework.http.HttpStatus.*;

@Service
@RequiredArgsConstructor
public class VoteService {

    private final VoterAccountRepository voterAccountRepository;
    private final ElectionRepository electionRepository;
    private final CandidateRepository candidateRepository;
    private final VoteRepository voteRepository;

    private VoterAccount getCurrentVoter() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "認証情報が見つかりません。");
        }

        String email = auth.getName();

        return voterAccountRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "アカウントが見つかりません。"));
    }

    @Transactional(readOnly = true)
        public MyVoteResponse getMyVote(Long electionId) {
            VoterAccount voter = getCurrentVoter();
            Election election = electionRepository.findById(electionId)
                    .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "選挙が見つかりません。"));

            // 自分の選挙区チェック
            if (!hasAccessToElection(voter, election)) {
                throw new ResponseStatusException(FORBIDDEN, "この選挙にはアクセスできません。");
            }

            return voteRepository
                    .findTopByVoterAccountAndElectionAndStatusOrderByVotedAtDesc(
                            voter, election, VoteStatus.ACTIVE
                    )
                    .map(v -> new MyVoteResponse(
                            v.getCandidate().getId(),
                            v.getCandidate().getName(),
                            v.getCandidate().getPartyName()
                    ))
                    .orElseThrow(() ->
                            new ResponseStatusException(NOT_FOUND, "まだ投票はありません。")   // ★ 404 を返す
                    );
        }

    @Transactional
    public void castVote(Long electionId, CastVoteRequest request) {
        VoterAccount voter = getCurrentVoter();
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "選挙が見つかりません。"));

        // 選挙区チェック
        if (!hasAccessToElection(voter, election)) {
            throw new ResponseStatusException(FORBIDDEN, "この選挙にはアクセスできません。");
        }

        // 状態チェック（OPENのみ投票可）
        if (election.getStatus() != ElectionStatus.OPEN) {
            throw new ResponseStatusException(BAD_REQUEST, "投票受付期間外です。");
        }

        // 開始・終了日時チェック
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(election.getStartsAt()) || now.isAfter(election.getEndsAt())) {
            throw new ResponseStatusException(BAD_REQUEST, "投票受付期間外です。");
        }

        Candidate candidate = candidateRepository.findById(request.candidateId())
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "候補者が見つかりません。"));

        if (!candidate.getElection().getId().equals(election.getId())) {
            throw new ResponseStatusException(BAD_REQUEST, "この選挙に属さない候補者です。");
        }

        // 既存のACTIVE票をCANCELEDに
        List<Vote> existing = voteRepository.findByVoterAccountAndElectionAndStatus(
                voter, election, VoteStatus.ACTIVE
        );
        for (Vote v : existing) {
            v.setStatus(VoteStatus.CANCELED);
        }
        voteRepository.saveAll(existing);

        // 新しい票を作成
        Vote vote = Vote.builder()
                .election(election)
                .voterAccount(voter)
                .candidate(candidate)
                .status(VoteStatus.ACTIVE)
                .votedAt(LocalDateTime.now())
                .build();

        voteRepository.save(vote);
    }

    @Transactional(readOnly = true)
    public List<ElectionResultItemResponse> getElectionResult(Long electionId) {
        VoterAccount voter = getCurrentVoter();
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "選挙が見つかりません。"));

        // 自分の選挙区チェック
        if (!hasAccessToElection(voter, election)) {
            throw new ResponseStatusException(FORBIDDEN, "この選挙にはアクセスできません。");
        }

        // 投票期間終了後のみ閲覧可（必要に応じて status も見る）
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(election.getEndsAt())) {
            throw new ResponseStatusException(FORBIDDEN, "投票期間終了後に結果を閲覧できます。");
        }

        List<Candidate> candidates = candidateRepository.findByElectionOrderByDisplayOrderAsc(election);

        return candidates.stream()
                .map(c -> {
                    long count = voteRepository.countByElectionAndCandidateAndStatus(
                            election, c, VoteStatus.ACTIVE);
                    return new ElectionResultItemResponse(
                            c.getId(),
                            c.getName(),
                            c.getPartyName(),
                            count
                    );
                })
                .toList();
    }

    private boolean hasAccessToElection(VoterAccount voter, Election election) {
        return voter.getCitizen() != null
                && voter.getCitizen().getDistrict() != null
                && election.getDistrict() != null
                && voter.getCitizen().getDistrict().getId().equals(election.getDistrict().getId());
    }
}
