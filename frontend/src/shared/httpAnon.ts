import axios from "axios";

export const httpAnon = axios.create({
    baseURL: "/api",
    headers: { "Content-Type": "application/json" },
});
