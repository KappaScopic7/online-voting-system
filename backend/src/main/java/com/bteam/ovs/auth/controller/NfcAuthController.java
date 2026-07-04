package com.bteam.ovs.auth.controller;

import com.bteam.ovs.auth.dto.request.NfcExchangeRequest;
import com.bteam.ovs.auth.dto.request.NfcLinkExchangeRequest;
import com.bteam.ovs.auth.dto.request.NfcLinkLoginRequest;
import com.bteam.ovs.auth.dto.request.NfcLoginRequest;
import com.bteam.ovs.auth.dto.response.NfcLinkExchangeResponse;
import com.bteam.ovs.auth.dto.response.NfcLinkLoginResponse;
import com.bteam.ovs.auth.dto.response.NfcLoginResponse;
import com.bteam.ovs.auth.dto.response.TokenResponse;
import com.bteam.ovs.auth.service.NfcAuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/nfc")
public class NfcAuthController {

    private final NfcAuthService service;

    public NfcAuthController(NfcAuthService service) {
        this.service = service;
    }

    @PostMapping(value = "/login", produces = "application/json; charset=UTF-8")
    public NfcLoginResponse login(@RequestBody @Valid NfcLoginRequest req) {
        return service.login(req);
    }

    @PostMapping(value = "/exchange", produces = "application/json; charset=UTF-8")
    public TokenResponse exchange(@RequestBody @Valid NfcExchangeRequest req) {
        return service.exchange(req);
    }

    @PostMapping(value = "/link/login", produces = "application/json; charset=UTF-8")
    public NfcLinkLoginResponse linkLogin(@RequestBody @Valid NfcLinkLoginRequest req) {
        return service.linkLogin(req);
    }

    @PostMapping(value = "/link/exchange", produces = "application/json; charset=UTF-8")
    public NfcLinkExchangeResponse linkExchange(@RequestBody @Valid NfcLinkExchangeRequest req) {
        return service.linkExchange(req);
    }
}
