import axios from "axios";
import { userToken } from "./tokenStorage";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export const httpUser = axios.create({
    baseURL: API_BASE,
    headers: { "Content-Type": "application/json" },
});

httpUser.interceptors.request.use((config) => {
    const token = userToken.get();
    if (token) {
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

httpUser.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err?.response?.status === 401) userToken.clear();
        return Promise.reject(err);
    },
);
