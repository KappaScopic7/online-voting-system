package com.bteam.ovs.identity.service;

import com.bteam.ovs.citizen.repository.CitizenRepository;
import com.bteam.ovs.identity.controller.dto.CitizenNfcResolveResponse;
import com.bteam.ovs.shared.errors.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class NfcResolveService {

    private static final Pattern UUID_PATTERN = Pattern.compile(
            "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");

    private final CitizenRepository citizenRepo;

    public NfcResolveService(CitizenRepository citizenRepo) {
        this.citizenRepo = citizenRepo;
    }

    /** NFC payload から citizenId を抽出して返す（投票トークン発行などで再利用） */
    public UUID resolveCitizenId(String payload) {
        return extractCitizenId(payload);
    }

    public CitizenNfcResolveResponse resolve(String payload) {
        UUID citizenId = resolveCitizenId(payload);

        var c = citizenRepo.findById(citizenId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "CITIZEN_NOT_FOUND",
                        "Citizen not found: " + citizenId));

        return new CitizenNfcResolveResponse(
                c.getCitizenId().toString(),
                c.getFamilyName(),
                c.getGivenName(),
                c.getBirthDate().toString(),
                c.getPrefCode(),
                c.getCityCode(),
                c.getAddressLine(),
                c.getGender().name());
    }

    private UUID extractCitizenId(String payload) {
        if (payload == null || payload.isBlank()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "NFC_PAYLOAD_EMPTY",
                    "payload is empty");
        }

        String trimmed = payload.trim();

        // payloadがUUID単体のケースも許容
        try {
            return UUID.fromString(trimmed);
        } catch (Exception ignore) {
        }

        var m = UUID_PATTERN.matcher(trimmed);
        if (!m.find()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "NFC_CITIZEN_ID_NOT_FOUND",
                    "citizenId(uuid) not found in payload");
        }

        return UUID.fromString(m.group());
    }
}
