// backend/src/main/java/com/bteam/ovs/master/controller/MasterController.java
package com.bteam.ovs.master.controller;

import com.bteam.ovs.master.controller.dto.CityItem;
import com.bteam.ovs.master.controller.dto.PrefItem;
import com.bteam.ovs.master.controller.dto.ZipAddressCandidate;
import com.bteam.ovs.master.service.MasterService;
import jakarta.validation.constraints.Pattern;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/master")
@Validated
public class MasterController {

    private final MasterService masterService;

    public MasterController(MasterService masterService) {
        this.masterService = masterService;
    }

    @GetMapping("/prefs")
    public List<PrefItem> prefs() {
        return masterService.listPrefs();
    }

    @GetMapping("/cities")
    public List<CityItem> cities(
            @RequestParam("prefCode") String prefCode,
            @RequestParam(value = "q", required = false) String q) {
        return masterService.listCities(prefCode, q);
    }

    @GetMapping("/address/by-zip")
    public List<ZipAddressCandidate> byZip(
            @RequestParam("zip") @Pattern(regexp = "^[0-9]{7}$", message = "zip must be 7 digits") String zip) {
        return masterService.lookupByZip(zip);
    }
}
