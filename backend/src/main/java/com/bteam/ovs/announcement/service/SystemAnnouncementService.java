package com.bteam.ovs.announcement.service;

import com.bteam.ovs.announcement.dto.request.SystemAnnouncementUpdateRequest;
import com.bteam.ovs.announcement.dto.response.SystemAnnouncementResponse;
import com.bteam.ovs.announcement.entity.SystemAnnouncement;
import com.bteam.ovs.announcement.repository.SystemAnnouncementRepository;
import com.bteam.ovs.shared.errors.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class SystemAnnouncementService {

    private static final UUID SINGLETON_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private final SystemAnnouncementRepository repo;

    @Transactional(readOnly = true)
    public SystemAnnouncementResponse getForCommittee() {
        var a = ensureExists();
        return SystemAnnouncementResponse.from(a);
    }

    @Transactional(readOnly = true)
    public SystemAnnouncementResponse getForPublicOrNull() {
        var a = ensureExists();
        if (!a.isEnabled())
            return null;
        return SystemAnnouncementResponse.from(a);
    }

    @Transactional
    public SystemAnnouncementResponse update(SystemAnnouncementUpdateRequest req) {
        var a = ensureExists();

        SystemAnnouncement.Actor actor;
        try {
            actor = SystemAnnouncement.Actor.valueOf(req.actor().trim());
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ACTOR", "actorが不正です");
        }

        String msg = req.message().trim();
        if (msg.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_MESSAGE", "messageが空です");
        }

        a.setEnabled(Boolean.TRUE.equals(req.enabled()));
        a.setActor(actor);
        a.setMessage(msg);
        a.setUpdatedAt(Instant.now());

        repo.save(a);
        return SystemAnnouncementResponse.from(a);
    }

    @Transactional
    protected SystemAnnouncement ensureExists() {
        return repo.findById(SINGLETON_ID).orElseGet(() -> {
            var a = new SystemAnnouncement();
            a.setId(SINGLETON_ID);
            a.setEnabled(false);
            a.setActor(SystemAnnouncement.Actor.COMMITTEE);
            a.setMessage("（お知らせ未設定）");
            a.setUpdatedAt(Instant.now());
            return repo.save(a);
        });
    }
}
