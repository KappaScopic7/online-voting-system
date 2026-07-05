package com.bteam.ovs.demo;

import com.bteam.ovs.demo.json.AllocVoteJson;
import com.bteam.ovs.voting.entity.VoteAllocCast;
import com.bteam.ovs.voting.entity.VoteAllocCurrent;
import com.bteam.ovs.voting.entity.VoteAllocItem;
import com.bteam.ovs.voting.repository.VoteAllocCastRepository;
import com.bteam.ovs.voting.repository.VoteAllocCurrentRepository;
import com.bteam.ovs.voting.repository.VoteAllocItemRepository;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class AllocVoteSeeder {

    private record AllocKey(UUID electionId, UUID citizenId) {
    }

    private record LatestAlloc(UUID castId, Instant castedAt) {
    }

    public void seedFromCastsOnly(
            VoteAllocCastRepository castRepo,
            VoteAllocCurrentRepository currentRepo,
            VoteAllocItemRepository itemRepo,
            List<AllocVoteJson> casts,
            Map<String, DemoDataInitializer.ElectionCreated> created) {

        if (casts == null || casts.isEmpty())
            return;

        var now = Instant.now();
        Map<AllocKey, LatestAlloc> latest = new HashMap<>();

        for (var vj : casts) {
            var ce = created.get(vj.electionKey());
            if (ce == null) {
                throw new IllegalStateException("allocVoteCasts.json: unknown electionKey=" + vj.electionKey());
            }

            Instant castedAt = now.plusSeconds(vj.castedAtOffsetSec());

            var cast = new VoteAllocCast();
            cast.setElectionId(ce.electionId());
            cast.setCitizenId(vj.citizenId());
            cast.setPointsTotal(100);
            cast.setCastedAt(castedAt);
            cast = castRepo.save(cast);

            saveItems(itemRepo, ce, cast.getId(), vj);

            var key = new AllocKey(ce.electionId(), vj.citizenId());
            var prev = latest.get(key);
            if (prev == null || castedAt.isAfter(prev.castedAt())) {
                latest.put(key, new LatestAlloc(cast.getId(), castedAt));
            }
        }

        for (var e : latest.entrySet()) {
            var key = e.getKey();
            var lat = e.getValue();

            var cur = currentRepo.findByElectionIdAndCitizenId(key.electionId(), key.citizenId())
                    .orElseGet(VoteAllocCurrent::new);

            cur.setElectionId(key.electionId());
            cur.setCitizenId(key.citizenId());
            cur.setCastId(lat.castId());
            cur.setCastedAt(lat.castedAt());
            currentRepo.save(cur);
        }
    }

    private void saveItems(
            VoteAllocItemRepository itemRepo,
            DemoDataInitializer.ElectionCreated ce,
            UUID castId,
            AllocVoteJson vj) {

        for (var it : vj.items()) {
            var item = new VoteAllocItem();
            item.setCastId(castId);
            item.setPoints(it.points());

            if ("CANDIDATE".equals(it.type())) {
                UUID candidateId = ce.candidateIds().get(it.candidateIndex());
                item.setTargetType(VoteAllocItem.TargetType.CANDIDATE);
                item.setCandidateId(candidateId);
            } else if ("NONE_SUPPORT".equals(it.type())) {
                item.setTargetType(VoteAllocItem.TargetType.NONE_SUPPORT);
                item.setCandidateId(null);
            } else {
                throw new IllegalStateException("allocVoteCasts.json: unknown item.type=" + it.type());
            }

            itemRepo.save(item);
        }
    }
}
