package com.bteam.ovs.announcement.controller;

import com.bteam.ovs.announcement.dto.request.PublicNoticeUpsertRequest;
import com.bteam.ovs.announcement.dto.response.PublicNoticeResponse;
import com.bteam.ovs.announcement.service.PublicNoticeService;
import com.bteam.ovs.shared.errors.ApiException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/committee/notices")
public class CommitteePublicNoticeController {

    private final PublicNoticeService service;

    @GetMapping
    @PreAuthorize("hasAuthority('KIND_STAFF')")
    public List<PublicNoticeResponse> list(
            @RequestParam(name = "limit", required = false, defaultValue = "200") int limit) {
        return service.listForCommittee(limit);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('KIND_STAFF')")
    public PublicNoticeResponse create(@Valid @RequestBody PublicNoticeUpsertRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('KIND_STAFF')")
    public PublicNoticeResponse update(
            @PathVariable("id") String id,
            @Valid @RequestBody PublicNoticeUpsertRequest req) {
        return service.update(parseUuidOr400(id, "id"), req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('KIND_STAFF')")
    public void delete(@PathVariable("id") String id) {
        service.delete(parseUuidOr400(id, "id"));
    }

    private static UUID parseUuidOr400(String raw, String field) {
        try {
            return UUID.fromString(raw);
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_UUID", field + "が不正です");
        }
    }
}
