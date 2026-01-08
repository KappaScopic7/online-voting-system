package com.bteam.ovs.elections.web;

import com.bteam.ovs.elections.service.ElectionAdminService;
import com.bteam.ovs.elections.web.dto.ElectionCreateRequest;
import com.bteam.ovs.elections.web.dto.ElectionResponse;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/elections")
public class AdminElectionsController {

    private final ElectionAdminService adminService;

    public AdminElectionsController(ElectionAdminService adminService) {
        this.adminService = adminService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ElectionResponse create(@Valid @RequestBody ElectionCreateRequest req) {
        return adminService.create(req);
    }
}
