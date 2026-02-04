
package com.bteam.ovs.demo.json;

import java.time.LocalDate;
import java.util.UUID;

public record CitizenJson(UUID citizenId, String familyName, String givenName, LocalDate birthDate,
        String prefCode, String cityCode, String addressLine, String gender) {
}
