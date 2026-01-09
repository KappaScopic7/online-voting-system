package com.bteam.ovs.elections.service;

import com.bteam.ovs.elections.model.Candidate;
import com.bteam.ovs.elections.model.Election;
import com.bteam.ovs.elections.repo.CandidateRepository;
import com.bteam.ovs.elections.repo.ElectionRepository;
import com.bteam.ovs.elections.web.dto.CandidateCreateRequest;
import com.bteam.ovs.elections.web.dto.CandidateResponse;
import com.bteam.ovs.elections.web.dto.ElectionCreateRequest;
import com.bteam.ovs.elections.web.dto.ElectionResponse;
import com.bteam.ovs.shared.errors.ApiException;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

@Service
public class ElectionAdminService {

    private final ElectionRepository electionRepo;
    private final CandidateRepository candidateRepo;

    public ElectionAdminService(ElectionRepository electionRepo, CandidateRepository candidateRepo) {
        this.electionRepo = electionRepo;
        this.candidateRepo = candidateRepo;
    }

    // ======================
    // Election create
    // ======================
    @Transactional
    public ElectionResponse create(ElectionCreateRequest req) {
        String title = normalize(req.title());
        if (title == null || title.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_TITLE", "titleが不正です");
        }

        Instant startsAt = req.startsAt();
        Instant endsAt = req.endsAt();
        if (startsAt == null || endsAt == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PERIOD", "startsAt/endsAt が不正です");
        }

        if (!startsAt.isBefore(endsAt)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_PERIOD",
                    "startsAt は endsAt より前である必要があります"
            );
        }

        var e = new Election();
        e.setTitle(title);
        e.setStartsAt(startsAt);
        e.setEndsAt(endsAt);

        e = electionRepo.save(e);
        return new ElectionResponse(e.getId(), e.getTitle(), e.getStartsAt(), e.getEndsAt());
    }

    // ======================
    // Candidate add (single)
    // ======================
    @Transactional
    public CandidateResponse addCandidate(UUID electionId, CandidateCreateRequest req) {
        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        String name = normalize(req.name());
        if (name == null || name.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CANDIDATE_NAME", "nameが不正です");
        }

        // ここで「開始後は追加禁止」等のルールを入れたければ入れる
        // if (!Instant.now().isBefore(election.getStartsAt())) {
        //     throw new ApiException(HttpStatus.FORBIDDEN, "ELECTION_ALREADY_STARTED", "選挙開始後は候補を追加できません");
        // }

        var c = new Candidate();
        c.setElectionId(election.getId()); // ★ null防止
        c.setName(name);

        try {
            c = candidateRepo.save(c);
        } catch (DataIntegrityViolationException ex) {
            // DBに (election_id, name) UNIQUE がある前提
            throw new ApiException(HttpStatus.CONFLICT, "CANDIDATE_ALREADY_EXISTS", "同名の候補が既に存在します");
        }

        return new CandidateResponse(c.getId(), c.getElectionId(), c.getName());
    }

    // ======================
    // Candidate add (bulk)
    // ======================
    @Transactional
    public List<CandidateResponse> addCandidatesBulk(UUID electionId, List<CandidateCreateRequest> reqs) {
        if (reqs == null || reqs.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "EMPTY_CANDIDATES", "候補が指定されていません");
        }

        // 先に存在チェック（1回）
        if (!electionRepo.existsById(electionId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません");
        }

        // 同一リクエスト内の重複も弾く（DBの409より先に400で落とす）
        var seen = new HashSet<String>();
        for (var r : reqs) {
            String name = normalize(r == null ? null : r.name());
            if (name == null || name.isBlank()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CANDIDATE_NAME", "nameが不正です");
            }
            if (!seen.add(name)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "DUPLICATE_CANDIDATE_NAME", "候補名が重複しています: " + name);
            }
        }

        return reqs.stream()
                .map(r -> addCandidate(electionId, r))
                .toList();
    }

    private String normalize(String s) {
        return s == null ? null : s.trim();
    }
}
