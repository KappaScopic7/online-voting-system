package com.bteam.ovs.demo;

import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@Profile("demo")
@RestController
@RequestMapping("/api/demo")
public class DemoResetController {

    private final DemoDataService demoDataService;

    public DemoResetController(DemoDataService demoDataService) {
        this.demoDataService = demoDataService;
    }

    public record ResetRequest(String confirm) {}

    @PostMapping("/reset")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reset(@RequestBody ResetRequest req) {
        if (req == null || !"RESET".equals(req.confirm())) {
            throw new IllegalArgumentException("confirm must be RESET");
        }
        demoDataService.resetAndSeed();
    }
}
