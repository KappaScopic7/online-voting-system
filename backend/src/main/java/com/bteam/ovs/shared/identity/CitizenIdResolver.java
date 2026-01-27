// backend/src/main/java/com/bteam/ovs/shared/identity/CitizenIdResolver.java
package com.bteam.ovs.shared.identity;

import com.bteam.ovs.shared.auth.AccountResolver;
import com.bteam.ovs.shared.errors.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class CitizenIdResolver {

    private final AccountResolver accountResolver;

    public CitizenIdResolver(AccountResolver accountResolver) {
        this.accountResolver = accountResolver;
    }

    public UUID requireCitizenId(UUID accountId) {
        var acc = accountResolver.requireActiveAccount(accountId);

        UUID citizenId = acc.getCitizenId();
        if (citizenId == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "IDENTITY_NOT_LINKED", "本人認証が必要です");
        }
        return citizenId;
    }

    public UUID optionalCitizenId(UUID accountIdOrNull) {
        var accOpt = accountResolver.findActiveAccount(accountIdOrNull);
        if (accOpt.isEmpty())
            return null;
        return accOpt.get().getCitizenId();
    }
}
