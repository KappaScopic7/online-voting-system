// frontend/src/shared/httpClientFactory.ts
import axios from "axios";

type TokenStore = { get(): string | null; clear(): void };

export function createHttpClient(
    tokenStore: TokenStore,
    opts?: { clearOnAuthError?: boolean },
) {
    const clearOnAuthError = opts?.clearOnAuthError ?? false;

    const http = axios.create({
        baseURL: "/api",
        headers: { "Content-Type": "application/json" },
    });

    http.interceptors.request.use((config) => {
        const token = tokenStore.get();
        if (token) {
            config.headers = config.headers ?? {};
            (config.headers as any).Authorization = `Bearer ${token}`;
        }
        return config;
    });

    http.interceptors.response.use(
        (res) => res,
        (err) => {
            const status = err?.response?.status;

            // ✅ public token は期限切れ/無効なら即クリアしてループを止める
            if (clearOnAuthError && (status === 401 || status === 403)) {
                tokenStore.clear();
            }

            return Promise.reject(err);
        },
    );

    return http;
}
