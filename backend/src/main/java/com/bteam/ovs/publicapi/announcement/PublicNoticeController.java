package com.bteam.ovs.publicapi.announcement;

import com.bteam.ovs.announcement.dto.response.PublicNoticeResponse;
import com.bteam.ovs.announcement.service.PublicNoticeService;

import lombok.AllArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api/public/notices")
public class PublicNoticeController {

    private final PublicNoticeService service;

    @GetMapping
    public List<PublicNoticeResponse> list(
            @RequestParam(name = "limit", required = false, defaultValue = "5") int limit) {
        return service.listPublic(limit);
    }
}
