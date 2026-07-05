package com.bteam.ovs.elections.service.tally;

import com.bteam.ovs.elections.entity.Election;
import com.bteam.ovs.elections.entity.ElectionStatus;
import com.bteam.ovs.elections.repository.ElectionRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;

@Service
public class ElectionStatusScheduler {

    private final ElectionRepository electionRepo;
    private final ElectionTallyJobService tallyJobService;

    public ElectionStatusScheduler(ElectionRepository electionRepo, ElectionTallyJobService tallyJobService) {
        this.electionRepo = electionRepo;
        this.tallyJobService = tallyJobService;
    }

    @Scheduled(fixedDelayString = "${app.tally.tickMillis:30000}")
    @Transactional
    public void tick() {
        Instant now = Instant.now();

        List<Election> ready = electionRepo.findReadyToOpen(now);
        for (Election e : ready) {
            e.setStatus(ElectionStatus.OPEN);
            System.out.println("[scheduler] OPEN electionId=" + e.getId());
        }

        List<Election> openToClose = electionRepo.findOpenToClose(now);
        for (Election e : openToClose) {
            e.setStatus(ElectionStatus.CLOSED);
            System.out.println("[scheduler] CLOSED electionId=" + e.getId());

            tallyJobService.enqueue(e.getId());
        }
    }
}
