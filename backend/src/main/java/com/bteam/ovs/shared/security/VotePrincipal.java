package com.bteam.ovs.shared.security;

import java.util.UUID;

/**
 * ログインなし投票用の認証主体（JWT kind=VOTE）
 */
public record VotePrincipal(
        UUID citizenId,
        UUID electionId) {
}
