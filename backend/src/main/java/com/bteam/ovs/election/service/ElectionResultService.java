package com.bteam.ovs.election.service;

import com.bteam.ovs.election.domain.Election;
import com.bteam.ovs.election.domain.ElectionStatus;
import com.bteam.ovs.election.dto.ElectionResultItem;
import com.bteam.ovs.election.repository.ElectionRepository;
import com.bteam.ovs.vote.domain.VoteStatus;
import com.bteam.ovs.vote.repository.VoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ElectionResultService {

    private final ElectionRepository electionRepository;
    private final VoteRepository voteRepository;

    public List<ElectionResultItem> getResult(Long electionId) {
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "選挙が見つかりません。"));

        if (election.getStatus() != ElectionStatus.CLOSED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "この選挙はまだ集計結果を公開できません。"
            );
        }

        return voteRepository.aggregateElectionResult(electionId, VoteStatus.ACTIVE);
    }
}
