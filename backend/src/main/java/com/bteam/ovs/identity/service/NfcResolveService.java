package com.bteam.ovs.identity.service;

import com.bteam.ovs.citizen.repository.CitizenRepository;
import com.bteam.ovs.identity.dto.response.CitizenNfcResolveResponse;
import com.bteam.ovs.shared.errors.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.UUID;
import java.util.regex.Pattern;

@RequiredArgsConstructor
@Service
public class NfcResolveService {

    private static final Pattern UUID_PATTERN = Pattern.compile(
            "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");

    private final CitizenRepository citizenRepo;
    private final PasswordEncoder passwordEncoder;

    public CitizenNfcResolveResponse resolve(String payload, String pin) {
        UUID citizenId = extractCitizenId(payload);

        var c = citizenRepo.findById(citizenId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "CITIZEN_NOT_FOUND",
                        "Citizen not found: " + citizenId));

        String hash = c.getNfcPinHash();
        if (hash == null || hash.isBlank()) {
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED,
                    "PIN_NOT_SET",
                    "PIN is not set for this citizen");
        }
        if (pin == null || !pin.matches("^\\d{4}$")) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_PIN",
                    "pin is invalid");
        }
        if (!passwordEncoder.matches(pin, hash)) {
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED,
                    "INVALID_PIN",
                    "PIN is incorrect");
        }

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

    public UUID resolveCitizenId(String payload, String pin) {
        UUID citizenId = extractCitizenId(payload);

        var c = citizenRepo.findById(citizenId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "CITIZEN_NOT_FOUND",
                        "Citizen not found: " + citizenId));

        String hash = c.getNfcPinHash();
        if (hash == null || hash.isBlank()) {
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED,
                    "PIN_NOT_SET",
                    "PIN is not set for this citizen");
        }
        if (pin == null || !pin.matches("^\\d{4}$")) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_PIN",
                    "pin is invalid");
        }
        if (!passwordEncoder.matches(pin, hash)) {
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED,
                    "INVALID_PIN",
                    "PIN is incorrect");
        }

        return citizenId;
    }

}
