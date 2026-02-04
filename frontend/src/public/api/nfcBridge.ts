import axios from "axios";

const BRIDGE_BASE = "http://127.0.0.1:39123";

export async function getNfcLast(): Promise<string | null> {
    const res = await axios.get(`${BRIDGE_BASE}/last`, {
        validateStatus: () => true,
    });
    if (res.status === 204) return null;
    if (res.status >= 400)
        throw new Error(
            typeof res.data === "string" ? res.data : "bridge error",
        );
    return res.data?.uuid ?? null;
}

export async function clearNfcLast(): Promise<void> {
    const res = await axios.post(`${BRIDGE_BASE}/clear`, null, {
        validateStatus: () => true,
    });
    if (res.status >= 400)
        throw new Error(
            typeof res.data === "string" ? res.data : "bridge clear error",
        );
}
