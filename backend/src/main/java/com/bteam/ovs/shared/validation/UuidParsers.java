// backend/src/main/java/com/bteam/ovs/shared/validation/UuidParsers.java
package com.bteam.ovs.shared.validation;

import com.bteam.ovs.shared.errors.ApiException;
import org.springframework.http.HttpStatus;

import java.util.UUID;

public final class UuidParsers {
    private UuidParsers() {
    }

    public static UUID parseOr400(String value, String code, String message) {
        try {
            return UUID.fromString(value);
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, code, message);
        }
    }
}
