// backend/src/main/java/com/bteam/ovs/shared/auth/AccountResolver.java
package com.bteam.ovs.shared.auth;

import com.bteam.ovs.auth.entity.UserAccount;
import com.bteam.ovs.auth.repository.UserAccountRepository;
import com.bteam.ovs.shared.errors.ApiException;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@RequiredArgsConstructor
@Component
public class AccountResolver {

    private final UserAccountRepository userRepo;

    public UserAccount requireAccount(UUID accountId) {
        if (accountId == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }
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

    // 公開API用：例外を投げず「未ログイン扱い」に落とす
    public Optional<UserAccount> findActiveAccount(UUID accountId) {
        if (accountId == null)
            return Optional.empty();

        return userRepo.findById(accountId)
                .filter(UserAccount::isEnabled)
                .filter(a -> !a.isLocked());
    }
}
