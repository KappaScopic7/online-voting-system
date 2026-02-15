// frontend/src/identity/components/IdentityNfcKeyboardReader.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../user/UserAuthContext";
import {
    performIdentityAction,
    type IdentityActionMode,
} from "../services/identityAction";
import { looksLikeUuid, isPinValid } from "../utils/identityValidation";

type BridgeState = "CHECKING" | "ONLINE" | "OFFLINE";

export function IdentityNfcKeyboardReader(props: {
    mode?: IdentityActionMode;

    onLinked?: (accessToken: string) => void;
    onIssued?: (voteToken: string) => void;

    electionId?: string;
    onError?: (msg: string) => void;

    pin?: string;
    pinRequired?: boolean;
}) {
    const {
        mode = "IDENTITY_LINK",
        onLinked,
        onIssued,
        electionId,
        onError,
        pin = "",
        pinRequired = false,
    } = props;

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

        const clearLast = () => {
            if (lastTimer) window.clearInterval(lastTimer);
            lastTimer = null;
        };

        const stopOffline = (note: string) => {
            clearLast();
            setBridgeState("OFFLINE");
            setBridgeNote(note);
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
                stopOffline(
                    "NFC Bridgeとの通信が切れました（自動入力をOFFにしました）",
                );
            }
        };

        const startPollingLast = () => {
            if (lastTimer) return;
            lastTimer = window.setInterval(tickLast, 400);
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
                    setBridgeState("ONLINE");
                    setBridgeNote(null);
                    startPollingLast();
                    return;
                }
            } catch {
                // ignore
            }

            stopOffline(
                "NFC Bridge未接続（ローカルで runNfcBridge を起動してください）",
            );
        };

        checkHealth();

        return () => {
            alive = false;
            clearLast();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [busy, value, bridgeHealthUrl, bridgeLastUrl]);

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

        if (mode === "VOTE_TOKEN_ISSUE" && !String(electionId ?? "").trim()) {
            const m = "electionId がありません（投票入口から開いてください）";
            setMsg(m);
            onError?.(m);
            return;
        }

        setBusy(true);
        try {
            const r = await performIdentityAction({
                mode,
                citizenId: v,
                pin,
                pinRequired,
                electionId,
                setAccessToken,
            });

            if (r.kind === "LINK") onLinked?.(r.accessToken);
            else onIssued?.(r.voteToken);
        } catch (err: any) {
            const m =
                err?.response?.data?.message ??
                (mode === "IDENTITY_LINK"
                    ? "本人認証に失敗しました"
                    : "本人認証（投票）に失敗しました");
            setMsg(m);
            onError?.(m);
        } finally {
            setBusy(false);
        }
    };

    const pinOk = !pinRequired || isPinValid(pin);

    return (
        <div style={{ display: "grid", gap: 10 }}>
            <div
                style={{
                    padding: 12,
                    border: "1px solid #ddd",
                    borderRadius: 12,
                    background: "#fff",
                    display: "grid",
                    gap: 8,
                }}
            >
                <div style={{ fontWeight: 800 }}>
                    本人認証（NFC）
                    <span style={{ fontWeight: 400, opacity: 0.7 }}>
                        {" "}
                        {bridgeState === "ONLINE"
                            ? "（スキャン待機中 / 自動入力ON）"
                            : bridgeState === "CHECKING"
                              ? "（接続確認中…）"
                              : "（未接続 / 手入力OK）"}
                    </span>
                </div>

                <div style={{ margin: 0, opacity: 0.85, lineHeight: 1.5 }}>
                    PCのNFCリーダーでカードをかざすか、下の欄に
                    citizenId（UUID）を入力してください。
                </div>

                <div
                    style={{
                        padding: 12,
                        border: "1px dashed #bbb",
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        minHeight: 48,
                    }}
                >
                    <div style={{ opacity: value.trim() ? 1 : 0.65 }}>
                        {value.trim()
                            ? "認証データを検出しました"
                            : bridgeState === "ONLINE"
                              ? "（読み取り待ち…）"
                              : "（手入力してください）"}
                    </div>

                    {value.trim() && (
                        <div
                            style={{
                                fontFamily:
                                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                fontSize: 12,
                                opacity: 0.75,
                            }}
                            title={value}
                        >
                            {value.slice(0, 8)}…
                        </div>
                    )}
                </div>

                <label style={{ display: "grid", gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>
                        citizenId (UUID)
                        {bridgeState === "ONLINE" ? "（自動入力されます）" : ""}
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
                        placeholder="例: 123e4567-e89b-12d3-a456-426614174000"
                        style={{ width: "100%", padding: 8 }}
                    />
                </label>
            </div>

            {!pinOk && (
                <div
                    style={{
                        padding: 10,
                        border: "1px solid #eee",
                        borderRadius: 12,
                        background: "#fafafa",
                    }}
                >
                    先に PIN（4桁）を入力してください
                </div>
            )}

            {bridgeNote && (
                <div
                    style={{
                        padding: 10,
                        border: "1px solid #eee",
                        borderRadius: 12,
                        background: "#fafafa",
                    }}
                >
                    {bridgeNote}
                </div>
            )}

            {msg && (
                <div
                    role="alert"
                    style={{
                        padding: 10,
                        border: "1px solid #eee",
                        borderRadius: 12,
                        background: "#fafafa",
                    }}
                >
                    {msg}
                </div>
            )}

            <button
                onClick={commit}
                disabled={busy || !value.trim() || !pinOk}
                style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid #ddd",
                }}
            >
                {busy
                    ? mode === "IDENTITY_LINK"
                        ? "登録中..."
                        : "発行中..."
                    : mode === "IDENTITY_LINK"
                      ? "本人認証を登録"
                      : "本人認証して投票へ進む"}
            </button>
        </div>
    );
}
