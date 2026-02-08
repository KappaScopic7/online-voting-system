// frontend/src/shared/httpPublic.ts
import { createHttpClient } from "./httpClientFactory";
import { publicToken } from "./tokenStorage";

// ✅ public は 401/403 でトークンを自動クリア（期限切れループ対策）
export const httpPublic = createHttpClient(publicToken, {
    clearOnAuthError: true,
});
