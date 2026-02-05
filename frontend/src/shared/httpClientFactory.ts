// frontend/src/shared/httpClientFactory.ts
import axios from "axios";

type TokenStore = { get(): string | null; clear(): void };

// ✅ DevもProdも常に /api を叩く
const API_BASE = "/api";

export function createHttpClient(tokenStore: TokenStore) {
    const http = axios.create({
        baseURL: API_BASE,
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
            const url: string | undefined = err?.config?.url;

            if (
                (status === 401 || status === 403) &&
                url?.includes("/auth/me")
            ) {
                tokenStore.clear();
            }
            return Promise.reject(err);
        },
    );

    return http;
}
