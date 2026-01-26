package com.bteam.ovs.elections.service;

import com.bteam.ovs.elections.controller.dto.ElectionResponse;
import com.bteam.ovs.elections.entity.Election;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.shared.errors.ApiException;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ElectionCommitteeService {

    private final ElectionRepository electionRepo;

    public ElectionCommitteeService(ElectionRepository electionRepo) {
        this.electionRepo = electionRepo;
    }

    /**
     * 選挙一覧取得（全件）
     */
    @Transactional(readOnly = true)
    public List<ElectionResponse> listElections() {
        return electionRepo.findAllByOrderByStartsAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * 選挙詳細取得（全件対象）
     */
    @Transactional(readOnly = true)
    public ElectionResponse getElection(UUID electionId) {
        Election e = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "ELECTION_NOT_FOUND",
                        "選挙が存在しません"));

        return toResponse(e);
    }

    private ElectionResponse toResponse(Election e) {
        return new ElectionResponse(
                e.getId(),
                e.getTitle(),
                e.getStartsAt(),
                e.getEndsAt());
    }
}
