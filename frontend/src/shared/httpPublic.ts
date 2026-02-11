// frontend/src/shared/httpPublic.ts
import { createHttpClient } from "./httpClientFactory";
import { publicToken } from "./tokenStorage";

export const httpPublic = createHttpClient(publicToken, {
    clearOnAuthError: false, // ✅
});
