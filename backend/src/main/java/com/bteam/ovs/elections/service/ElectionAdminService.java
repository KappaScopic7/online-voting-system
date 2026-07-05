package com.bteam.ovs.elections.service;

import com.bteam.ovs.candidates.dto.request.CandidateCreateRequest;
import com.bteam.ovs.candidates.dto.response.CandidateResponse;
import com.bteam.ovs.candidates.entity.Candidate;
import com.bteam.ovs.candidates.repository.CandidateRepository;
import com.bteam.ovs.elections.dto.request.ElectionCreateRequest;
import com.bteam.ovs.elections.dto.request.ElectionUpdateRequest;
import com.bteam.ovs.elections.dto.response.ElectionResponse;
import com.bteam.ovs.elections.entity.Election;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.shared.errors.ApiException;

import lombok.AllArgsConstructor;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bteam.ovs.elections.entity.ElectionStatus;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

@AllArgsConstructor
@Service
public class ElectionAdminService {

    private final ElectionRepository electionRepo;
    private final CandidateRepository candidateRepo;

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
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PERIOD", "startsAt は endsAt より前である必要があります");
        }

        var e = new Election();
        e.setTitle(title);
        e.setStartsAt(startsAt);
        e.setEndsAt(endsAt);

        e = electionRepo.save(e);
        return new ElectionResponse(e.getId(), e.getTitle(), e.getStartsAt(), e.getEndsAt());
    }

    @Transactional(readOnly = true)
    public List<ElectionResponse> list() {
        return electionRepo.findAllByOrderByStartsAtDesc().stream()
                .map(e -> new ElectionResponse(e.getId(), e.getTitle(), e.getStartsAt(), e.getEndsAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public ElectionResponse detail(UUID electionId) {
        var e = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));
        return new ElectionResponse(e.getId(), e.getTitle(), e.getStartsAt(), e.getEndsAt());
    }

    @Transactional
    public ElectionResponse update(UUID electionId, ElectionUpdateRequest req) {
        var e = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        // ✅ Adminは「作成中(DRAFT)のみ編集可」にして責務分離
        if (e.getStatus() != null && e.getStatus() != ElectionStatus.DRAFT) {
            throw new ApiException(HttpStatus.CONFLICT, "ELECTION_NOT_EDITABLE", "DRAFTの間のみ編集できます");
        }

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
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PERIOD", "startsAt は endsAt より前である必要があります");
        }

        e.setTitle(title);
        e.setStartsAt(startsAt);
        e.setEndsAt(endsAt);

        e = electionRepo.save(e);
        return new ElectionResponse(e.getId(), e.getTitle(), e.getStartsAt(), e.getEndsAt());
    }

    @Transactional
    public void delete(UUID electionId) {
        var e = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        // ✅ DRAFTのみ削除可
        if (e.getStatus() != null && e.getStatus() != ElectionStatus.DRAFT) {
            throw new ApiException(HttpStatus.CONFLICT, "ELECTION_NOT_DELETABLE", "DRAFTの間のみ削除できます");
        }

        electionRepo.delete(e);
    }

    @Transactional
    public CandidateResponse addCandidate(UUID electionId, CandidateCreateRequest req) {
        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        String name = normalize(req.name());
        if (name == null || name.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CANDIDATE_NAME", "nameが不正です");
        }

        if (!Instant.now().isBefore(election.getStartsAt())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ELECTION_ALREADY_STARTED", "選挙開始後は候補を追加できません");
        }

        var c = new Candidate();
        c.setElectionId(election.getId());
        c.setName(name);

        try {
            c = candidateRepo.save(c);
        } catch (DataIntegrityViolationException ex) {
            throw new ApiException(HttpStatus.CONFLICT, "CANDIDATE_ALREADY_EXISTS", "同名の候補が既に存在します");
        }

        return new CandidateResponse(c.getId(), c.getElectionId(), c.getName());
    }

    @Transactional
    public List<CandidateResponse> addCandidatesBulk(UUID electionId, List<CandidateCreateRequest> reqs) {
        if (reqs == null || reqs.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "EMPTY_CANDIDATES", "候補が指定されていません");
        }

        if (!electionRepo.existsById(electionId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません");
        }

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

        return reqs.stream().map(r -> addCandidate(electionId, r)).toList();
    }

    private String normalize(String s) {
        return s == null ? null : s.trim();
    }
}
