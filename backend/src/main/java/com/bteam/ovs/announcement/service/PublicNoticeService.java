package com.bteam.ovs.announcement.service;

import com.bteam.ovs.announcement.dto.request.PublicNoticeUpsertRequest;
import com.bteam.ovs.announcement.dto.response.PublicNoticeResponse;
import com.bteam.ovs.announcement.entity.PublicNotice;
import com.bteam.ovs.announcement.repository.PublicNoticeRepository;
import com.bteam.ovs.shared.errors.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class PublicNoticeService {

    private final PublicNoticeRepository repo;

    @Transactional(readOnly = true)
    public List<PublicNoticeResponse> listPublic(int limit) {
        int l = Math.max(1, Math.min(limit, 50));
        var items = repo.findActiveForPublic(Instant.now(), PageRequest.of(0, l));
        return items.stream().map(PublicNoticeResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<PublicNoticeResponse> listForCommittee(int limit) {
        int l = Math.max(1, Math.min(limit, 200));
        var items = repo.findAllForCommittee(PageRequest.of(0, l));
        return items.stream().map(PublicNoticeResponse::from).toList();
    }

    @Transactional
    public PublicNoticeResponse create(PublicNoticeUpsertRequest req) {
        validate(req);
        var n = new PublicNotice();
        n.setTitle(req.title().trim());
        n.setBody(req.body().trim());
        n.setPinned(Boolean.TRUE.equals(req.pinned()));
        n.setPublishedAt(req.publishedAt());
        n.setExpiresAt(req.expiresAt());
        repo.save(n);
        return PublicNoticeResponse.from(n);
    }

    @Transactional
    public PublicNoticeResponse update(UUID id, PublicNoticeUpsertRequest req) {
        validate(req);
        var n = repo.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOTICE_NOT_FOUND", "通知が見つかりません"));
        n.setTitle(req.title().trim());
        n.setBody(req.body().trim());
        n.setPinned(Boolean.TRUE.equals(req.pinned()));
        n.setPublishedAt(req.publishedAt());
        n.setExpiresAt(req.expiresAt());
        repo.save(n);
        return PublicNoticeResponse.from(n);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repo.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "NOTICE_NOT_FOUND", "通知が見つかりません");
        }
        repo.deleteById(id);
    }

    private static void validate(PublicNoticeUpsertRequest req) {
        if (req.title() == null || req.title().trim().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_TITLE", "titleが空です");
        }
        if (req.body() == null || req.body().trim().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_BODY", "bodyが空です");
        }
        if (req.publishedAt() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PUBLISHED_AT", "publishedAtが不正です");
        }
        Instant exp = req.expiresAt();
        if (exp != null && !exp.isAfter(req.publishedAt())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_EXPIRES_AT", "expiresAtはpublishedAtより後である必要があります");
        }
    }
}
