// frontend/src/identity/components/IdentityNfcKeyboardReader.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { linkIdentity } from "../api/identity";
import { useAuth } from "../../user/UserAuthContext";

function looksLikeUuid(v: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        v,
    );
}

function isPinValid(pin: string) {
    return /^\d{4}$/.test(pin);
}

type BridgeState = "CHECKING" | "ONLINE" | "OFFLINE";

export function IdentityNfcKeyboardReader(props: {
    onLinked: (accessToken: string) => void;
    onError?: (msg: string) => void;

    // ✅ 追加
    pin?: string;
    pinRequired?: boolean;
}) {
    const { onLinked, onError, pin = "", pinRequired = false } = props;
    const { setAccessToken } = useAuth();

    const inputRef = useRef<HTMLInputElement>(null);
    const [value, setValue] = useState("");
    const [msg, setMsg] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const [bridgeState, setBridgeState] = useState<BridgeState>("CHECKING");
    const [bridgeNote, setBridgeNote] = useState<string | null>(null);

    const BRIDGE_BASE = "/nfc-bridge";
    const bridgeHealthUrl = useMemo(() => `${BRIDGE_BASE}/health`, []);
    const bridgeLastUrl = useMemo(() => `${BRIDGE_BASE}/last`, []);

    const commitTimerRef = useRef<number | null>(null);
    const scheduleCommit = () => {
        if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
        commitTimerRef.current = window.setTimeout(() => commit(), 250);
    };

    useEffect(() => {
        let alive = true;

        let lastTimer: number | null = null;
        let checkTimer: number | null = null;

        let backoffMs = 800;
        const maxBackoffMs = 10_000;

        const clearLast = () => {
            if (lastTimer) window.clearInterval(lastTimer);
            lastTimer = null;
        };
        const clearCheck = () => {
            if (checkTimer) window.clearTimeout(checkTimer);
            checkTimer = null;
        };

        const scheduleRecheck = () => {
            clearCheck();
            const wait = backoffMs;
            backoffMs = Math.min(Math.floor(backoffMs * 1.7), maxBackoffMs);
            checkTimer = window.setTimeout(() => {
                if (!alive) return;
                checkHealth();
            }, wait);
        };

        const checkHealth = async () => {
            if (!alive) return;
            if (busy) return;

            setBridgeState("CHECKING");

            try {
                const res = await fetch(bridgeHealthUrl, {
                    method: "GET",
                    cache: "no-store",
                });

                if (!alive) return;

                if (res.ok) {
                    backoffMs = 800;
                    setBridgeState("ONLINE");
                    setBridgeNote(null);
                    startPollingLast();
                    return;
                }
            } catch {
                // ignore
            }

            clearLast();
            setBridgeState("OFFLINE");
            setBridgeNote(
                "NFC Bridge未接続（ローカルで runNfcBridge を起動すると自動入力が有効になります）",
            );
            scheduleRecheck();
        };

        const tickLast = async () => {
            if (!alive) return;
            if (busy) return;

            try {
                const res = await fetch(bridgeLastUrl, {
                    method: "GET",
                    cache: "no-store",
                });

                if (!alive) return;

                if (res.status === 204) return;

                if (res.ok) {
                    const data = (await res.json()) as { uuid?: string };
                    const uuid = String(data.uuid ?? "").trim();
                    if (uuid && uuid !== value) {
                        setValue(uuid);
                        scheduleCommit();
                    }
                    return;
                }

                throw new Error(`bridge /last status=${res.status}`);
            } catch {
                clearLast();
                setBridgeState("OFFLINE");
                setBridgeNote(
                    "NFC Bridgeとの通信が切れました（再接続を試行中…）",
                );
                scheduleRecheck();
            }
        };

        const startPollingLast = () => {
            if (lastTimer) return;
            lastTimer = window.setInterval(tickLast, 400);
        };

        checkHealth();

        return () => {
            alive = false;
            clearLast();
            clearCheck();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [busy, value]);

    const commit = async () => {
        const v = value.trim();
        if (!v) return;

        setMsg(null);

        if (pinRequired && !isPinValid(pin)) {
            const m = "先にPIN（4桁）を入力してください";
            setMsg(m);
            onError?.(m);
            return;
        }

        if (!looksLikeUuid(v)) {
            const m =
                "UUID形式ではありません。タグ内容/リーダー設定を確認してください。";
            setMsg(m);
            onError?.(m);
            return;
        }

        setBusy(true);
        try {
            const token = await linkIdentity({
                citizenId: v,
                pin: pinRequired ? pin : undefined,
            });
            await setAccessToken(token.accessToken);
            onLinked(token.accessToken);
        } catch (err: any) {
            const m = err?.response?.data?.message ?? "Link failed";
            setMsg(m);
            onError?.(m);
        } finally {
            setBusy(false);
        }
    };

    const pinOk = !pinRequired || isPinValid(pin);

    return (
        <div style={{ display: "grid", gap: 8 }}>
            <p style={{ margin: 0, opacity: 0.85 }}>
                PCのNFCリーダーでカードをかざしてください（入力欄に自動入力されます）。
            </p>

            {!pinOk && (
                <div style={{ padding: 8, border: "1px solid #ccc" }}>
                    先に PIN（4桁）を入力してください
                </div>
            )}

            {bridgeNote && (
                <div style={{ padding: 8, border: "1px solid #ccc" }}>
                    {bridgeNote}
                </div>
            )}

            {msg && (
                <div
                    role="alert"
                    style={{ padding: 8, border: "1px solid #ccc" }}
                >
                    {msg}
                </div>
            )}

            <label style={{ display: "grid", gap: 4 }}>
                <span>
                    読み取り結果 citizenId (UUID)
                    {bridgeState === "ONLINE" ? "（自動入力ON）" : ""}
                    {bridgeState === "CHECKING" ? "（bridge確認中…）" : ""}
                </span>
                <input
                    ref={inputRef}
                    value={value}
                    disabled={busy}
                    onChange={(e) => {
                        setValue(e.target.value);
                        scheduleCommit();
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            commit();
                        }
                    }}
                    placeholder="ここに自動入力されます（手入力もOK）"
                    style={{ width: "100%", padding: 8 }}
                />
            </label>

            <button onClick={commit} disabled={busy || !value.trim() || !pinOk}>
                {busy ? "登録中..." : "この読み取り結果で本人認証を登録"}
            </button>
        </div>
    );
}
