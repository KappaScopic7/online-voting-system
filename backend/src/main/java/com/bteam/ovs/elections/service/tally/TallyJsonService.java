package com.bteam.ovs.elections.service.tally;

import com.bteam.ovs.elections.entity.BallotType;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.elections.service.ElectionService;
import com.bteam.ovs.shared.errors.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.UUID;

@Service
public class TallyJsonService {

    private final ElectionRepository electionRepo;
    private final ElectionService electionService;

    public TallyJsonService(ElectionRepository electionRepo, ElectionService electionService) {
        this.electionRepo = electionRepo;
        this.electionService = electionService;
    }

    public TallyBundle build(UUID electionId, Instant talliedAt) {
        var e = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        var rows = new ArrayList<TallyBundle.Row>();

        if (e.getBallotType() == BallotType.ALLOCATION) {
            var r = electionService.allocResultInternal(electionId);

            for (var it : r.results()) {
                rows.add(new TallyBundle.Row(
                        "CANDIDATE", // DTO上は候補/政党どちらも candidate枠に入ってる運用だった
                        it.candidateId().toString(),
                        it.candidateKey(),
                        it.name(),
                        it.points()));
            }

            return new TallyBundle(
                    e.getId().toString(),
                    e.getTitle(),
                    e.getBallotType().name(),
                    talliedAt,
                    r.totalPoints(),
                    r.noneSupportPoints(),
                    rows);
        }

        var r = electionService.resultInternal(electionId);

        for (var it : r.results()) {
            rows.add(new TallyBundle.Row(
                    "CANDIDATE",
                    it.candidateId().toString(),
                    it.candidateKey(),
                    it.candidateName(),
                    it.votes()));
        }

        return new TallyBundle(
                e.getId().toString(),
                e.getTitle(),
                e.getBallotType().name(),
                talliedAt,
                r.totalVotes(),
                null, // SINGLE_CHOICE は noneSupportVotes を今DTOに入れてないので必要なら拡張
                rows);
    }

}
