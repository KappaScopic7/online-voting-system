package com.bteam.ovs.publicapi.announcement;

import com.bteam.ovs.announcement.controller.dto.SystemAnnouncementResponse;
import com.bteam.ovs.announcement.service.SystemAnnouncementService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/announcement")
public class PublicAnnouncementController {

    private final SystemAnnouncementService service;

    public PublicAnnouncementController(SystemAnnouncementService service) {
        this.service = service;
    }

    @GetMapping
    public SystemAnnouncementResponse getOrNull() {
        return service.getForPublicOrNull();
    }
}
