// backend/src/main/java/com/bteam/ovs/shared/auth/AccountResolver.java
package com.bteam.ovs.shared.auth;

import com.bteam.ovs.auth.entity.UserAccount;
import com.bteam.ovs.auth.repository.UserAccountRepository;
import com.bteam.ovs.shared.errors.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
public class AccountResolver {

    private final UserAccountRepository userRepo;

    public AccountResolver(UserAccountRepository userRepo) {
        this.userRepo = userRepo;
    }

    public UserAccount requireAccount(UUID accountId) {
        return userRepo.findById(accountId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));
    }

    public UserAccount requireActiveAccount(UUID accountId) {
        UserAccount acc = requireAccount(accountId);

        if (!acc.isEnabled()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED", "アカウントが無効です");
        }
        if (acc.isLocked()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED", "アカウントがロックされています");
        }
        return acc;
    }

    // ★追加：公開API用（例外を投げない）
    public Optional<UserAccount> findActiveAccount(UUID accountId) {
        if (accountId == null)
            return Optional.empty();

        var opt = userRepo.findById(accountId);
        if (opt.isEmpty())
            return Optional.empty();

        var acc = opt.get();
        if (!acc.isEnabled())
            return Optional.empty();
        if (acc.isLocked())
            return Optional.empty();

        return Optional.of(acc);
    }
}
