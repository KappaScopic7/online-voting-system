// backend/src/main/java/com/bteam/ovs/shared/identity/CitizenIdResolver.java
package com.bteam.ovs.shared.identity;

import com.bteam.ovs.shared.auth.AccountResolver;
import com.bteam.ovs.shared.errors.ApiException;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.UUID;

@RequiredArgsConstructor
@Component
public class CitizenIdResolver {

    private final AccountResolver accountResolver;

    public UUID requireCitizenId(UUID accountId) {
        var acc = accountResolver.requireActiveAccount(accountId);

        UUID citizenId = acc.getCitizenId();
        if (citizenId == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "IDENTITY_NOT_LINKED", "本人認証が必要です");
        }
        return citizenId;
    }

    // 公開API用：未ログイン/無効/ロックは null、本人認証なしも null
    public UUID optionalCitizenId(UUID accountIdOrNull) {
        return accountResolver.findActiveAccount(accountIdOrNull)
                .map(a -> a.getCitizenId())
                .orElse(null);
    }
}
