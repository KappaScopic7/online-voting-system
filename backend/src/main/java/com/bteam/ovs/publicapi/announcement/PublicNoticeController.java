package com.bteam.ovs.publicapi.announcement;

import com.bteam.ovs.announcement.controller.dto.PublicNoticeResponse;
import com.bteam.ovs.announcement.service.PublicNoticeService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/notices")
public class PublicNoticeController {

    private final PublicNoticeService service;

    public PublicNoticeController(PublicNoticeService service) {
        this.service = service;
    }

    @GetMapping
    public List<PublicNoticeResponse> list(
            @RequestParam(name = "limit", required = false, defaultValue = "5") int limit) {
        return service.listPublic(limit);
    }
}
