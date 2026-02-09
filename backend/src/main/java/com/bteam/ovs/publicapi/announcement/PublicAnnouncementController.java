package com.bteam.ovs.publicapi.announcement;

import com.bteam.ovs.announcement.controller.dto.SystemAnnouncementResponse;
import com.bteam.ovs.announcement.service.SystemAnnouncementService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PublicAnnouncementController {

    private final SystemAnnouncementService service;

    public PublicAnnouncementController(SystemAnnouncementService service) {
        this.service = service;
    }

    // PublicHomePage 用
    @GetMapping("/api/public/announcement")
    public SystemAnnouncementResponse get() {
        return service.getForPublicOrNull();
    }
}
