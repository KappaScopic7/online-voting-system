package com.bteam.ovs.elections.service;

import com.bteam.ovs.elections.model.Election;
import com.bteam.ovs.elections.repo.ElectionRepository;
import com.bteam.ovs.elections.web.dto.ElectionCreateRequest;
import com.bteam.ovs.elections.web.dto.ElectionResponse;
import com.bteam.ovs.shared.errors.ApiException;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class ElectionAdminService {

    private final ElectionRepository electionRepo;

    public ElectionAdminService(ElectionRepository electionRepo) {
        this.electionRepo = electionRepo;
    }

    @Transactional
    public ElectionResponse create(ElectionCreateRequest req) {
        String title = req.title() == null ? null : req.title().trim();
        if (title == null || title.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_TITLE", "titleが不正です");
        }

        Instant startsAt = req.startsAt();
        Instant endsAt = req.endsAt();

        // 必須：期間妥当性
        if (!startsAt.isBefore(endsAt)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PERIOD", "startsAt は endsAt より前である必要があります");
        }

        // 任意：開始が過去でも許すかどうか（デモは許すことが多い）
        // もし「過去開始は禁止」にするなら：
        // if (startsAt.isBefore(Instant.now())) { ... }

        var e = new Election();
        e.setTitle(title);
        e.setStartsAt(startsAt);
        e.setEndsAt(endsAt);

        e = electionRepo.save(e);

        return new ElectionResponse(e.getId(), e.getTitle(), e.getStartsAt(), e.getEndsAt());
    }
}
