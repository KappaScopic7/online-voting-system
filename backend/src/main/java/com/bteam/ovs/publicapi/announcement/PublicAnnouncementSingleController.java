package com.bteam.ovs.publicapi.announcement;

import com.bteam.ovs.announcement.dto.response.SystemAnnouncementResponse;
import com.bteam.ovs.announcement.service.SystemAnnouncementService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/public/announcement")
public class PublicAnnouncementSingleController {

    private final SystemAnnouncementService service;

    @GetMapping
    public SystemAnnouncementResponse getOrNull() {
        // enabled=false のときは null を返す設計（フロントが握りつぶして非表示にしてる）
        return service.getForPublicOrNull();
    }
}
