package com.bteam.ovs.identity.controller;

import com.bteam.ovs.identity.controller.dto.CitizenNfcResolveResponse;
import com.bteam.ovs.identity.controller.dto.NfcResolveRequest;
import com.bteam.ovs.identity.service.NfcResolveService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/identity/nfc")
public class IdentityNfcController {

    private final NfcResolveService service;

    public IdentityNfcController(NfcResolveService service) {
        this.service = service;
    }

    @PostMapping(value = "/resolve", produces = "application/json; charset=UTF-8")
    public CitizenNfcResolveResponse resolve(@RequestBody @Valid NfcResolveRequest req) {
        return service.resolve(req.payload());
    }
}
