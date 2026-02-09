package com.bteam.ovs.publicapi.announcement;

import com.bteam.ovs.announcement.controller.dto.SystemAnnouncementResponse;
import com.bteam.ovs.announcement.service.SystemAnnouncementService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/announcement")
public class PublicAnnouncementSingleController {

    private final SystemAnnouncementService service;

    public PublicAnnouncementSingleController(SystemAnnouncementService service) {
        this.service = service;
    }

    @GetMapping
    public SystemAnnouncementResponse getOrNull() {
        // enabled=false のときは null を返す設計（フロントが握りつぶして非表示にしてる）
        return service.getForPublicOrNull();
    }
}
