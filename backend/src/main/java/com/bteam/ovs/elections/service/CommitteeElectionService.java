// backend/src/main/java/com/bteam/ovs/elections/service/CommitteeElectionService.java
package com.bteam.ovs.elections.service;

import com.bteam.ovs.elections.dto.response.CommitteeElectionListItem;
import com.bteam.ovs.elections.dto.response.ElectionDetailResponse;
import com.bteam.ovs.elections.entity.Election;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.shared.errors.ApiException;

import lombok.AllArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@AllArgsConstructor
@Service
public class CommitteeElectionService {

    private final ElectionRepository electionRepo;
    private final ElectionService electionService;

    @Transactional(readOnly = true)
    public List<CommitteeElectionListItem> list() {
        return electionRepo.findAllByOrderByStartsAtDesc().stream()
                .map(e -> new CommitteeElectionListItem(
                        e.getId(),
                        e.getElectionKey(),
                        e.getTitle(),
                        e.getSummary(),
                        e.getElectionType(),
                        e.getBallotType(),
                        e.getAllocationTarget(),
                        e.getDistrictPrefCode(),
                        e.getDistrictCityCode(),
                        e.getDistrictLabel(),
                        e.getStartsAt(),
                        e.getEndsAt(),
                        e.getStatus(),
                        e.getTalliedAt(),
                        e.getPublishedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public ElectionDetailResponse detail(UUID electionId) {
        Election e = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "Election not found"));
        return electionService.toDetailResponse(e);
    }
}
