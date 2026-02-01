// frontend/src/shared/httpClientFactory.ts
import axios from "axios";

type TokenStore = { get(): string | null; clear(): void };

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

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

            if (status === 401 && url && url.includes("/api/auth/me")) {
                tokenStore.clear();
            }

            return Promise.reject(err);
        },
    );

    return http;
}
