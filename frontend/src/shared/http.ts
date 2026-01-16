// shared/http.ts
import axios from "axios";
import { getToken, clearToken } from "./tokenStorage";

export const http = axios.create({
    baseURL: "http://localhost:8080",
    headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        // Axios v1: headers が AxiosHeaders の場合があるので安全にセット
        if (
            config.headers &&
            typeof (config.headers as any).set === "function"
        ) {
            (config.headers as any).set("Authorization", `Bearer ${token}`);
        } else {
            config.headers = {
                ...(config.headers ?? {}),
                Authorization: `Bearer ${token}`,
            } as any;
        }
    }
    return config;
});

http.interceptors.response.use(
    (res) => res,
    (err) => {
        // 401 なら token 破棄（未ログイン扱いへ）
        if (err?.response?.status === 401) clearToken();
        return Promise.reject(err);
    },
);
