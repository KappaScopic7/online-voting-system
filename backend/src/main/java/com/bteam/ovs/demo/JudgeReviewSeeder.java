package com.bteam.ovs.demo;

import com.bteam.ovs.demo.json.JudgeReviewVoteJson;
import com.bteam.ovs.voting.entity.JudgeReviewCast;
import com.bteam.ovs.voting.entity.JudgeReviewItem;
import com.bteam.ovs.voting.repository.JudgeReviewCastRepository;
import com.bteam.ovs.voting.repository.JudgeReviewItemRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class JudgeReviewSeeder {

    public void seed(
            JudgeReviewCastRepository judgeReviewCastRepo,
            JudgeReviewItemRepository judgeReviewItemRepo,
            List<JudgeReviewVoteJson> votes,
            Map<String, DemoDataInitializer.ElectionCreated> createdElections) {

        Instant now = Instant.now();

        for (var vj : votes) {
            var ce = createdElections.get(vj.electionKey());
            if (ce == null)
                throw new IllegalStateException("judgeReviewVotes: unknown electionKey=" + vj.electionKey());

            Instant castedAt = now.plusSeconds(vj.castedAtOffsetSec());

            var cast = judgeReviewCastRepo
                    .findByElectionIdAndCitizenId(ce.electionId(), vj.citizenId())
                    .orElseGet(() -> {
                        var c = new JudgeReviewCast();
                        c.setElectionId(ce.electionId());
                        c.setCitizenId(vj.citizenId());
                        return c;
                    });

            cast.setCastedAt(castedAt);
            cast = judgeReviewCastRepo.save(cast);

            judgeReviewItemRepo.deleteByCastId(cast.getId());

            for (var itemJson : vj.items()) {
                int idx = itemJson.judgeIndex();
                if (idx < 0 || idx >= ce.candidateIds().size()) {
                    throw new IllegalStateException(
                            "judgeReviewVotes: judgeIndex out of range electionKey=" + vj.electionKey()
                                    + " idx=" + idx);
                }

                UUID judgeCandidateId = ce.candidateIds().get(idx);

                var it = new JudgeReviewItem();
                it.setCastId(cast.getId());
                it.setJudgeCandidateId(judgeCandidateId);

                JudgeReviewItem.Choice choice;
                try {
                    choice = JudgeReviewItem.Choice.valueOf(itemJson.choice());
                } catch (Exception e) {
                    throw new IllegalStateException("judgeReviewVotes: invalid choice=" + itemJson.choice(), e);
                }
                it.setChoice(choice);

                judgeReviewItemRepo.save(it);
            }
        }
    }
}
