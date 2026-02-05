// frontend/src/identity/components/IdentityNfcKeyboardReader.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { linkIdentity } from "../api/identity";
import { useAuth } from "../../user/UserAuthContext";

function looksLikeUuid(v: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        v,
    );
}

type BridgeState = "CHECKING" | "ONLINE" | "OFFLINE";

export function IdentityNfcKeyboardReader(props: {
    onLinked: (accessToken: string) => void;
}) {
    const { onLinked } = props;
    const { setAccessToken } = useAuth();

    const inputRef = useRef<HTMLInputElement>(null);
    const [value, setValue] = useState("");
    const [msg, setMsg] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const [bridgeState, setBridgeState] = useState<BridgeState>("CHECKING");
    const [bridgeNote, setBridgeNote] = useState<string | null>(null);

    const BRIDGE_BASE = "http://127.0.0.1:39123";
    const bridgeHealthUrl = useMemo(() => `${BRIDGE_BASE}/health`, []);
    const bridgeLastUrl = useMemo(() => `${BRIDGE_BASE}/last`, []);

    const commitTimerRef = useRef<number | null>(null);
    const scheduleCommit = () => {
        if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
        commitTimerRef.current = window.setTimeout(() => commit(), 250);
    };

    // ✅ Bridge を「ある時だけ」ポーリングする
    useEffect(() => {
        let alive = true;

        let lastTimer: number | null = null;
        let checkTimer: number | null = null;

        // 失敗時はバックオフして再チェック（ログスパム防止）
        let backoffMs = 800; // start
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
            if (busy) return; // 登録中は触らない

            setBridgeState("CHECKING");

            try {
                // cache を避ける（開発中にたまに変な挙動するの防止）
                const res = await fetch(bridgeHealthUrl, {
                    method: "GET",
                    cache: "no-store",
                });

                if (!alive) return;

                if (res.ok) {
                    // ONLINE
                    backoffMs = 800;
                    setBridgeState("ONLINE");
                    setBridgeNote(null);
                    startPollingLast();
                    return;
                }
            } catch {
                // ignore
            }

            // OFFLINE
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

                // 想定外の status（bridge 側が落ちた/変）
                throw new Error(`bridge /last status=${res.status}`);
            } catch {
                // ここに入ったら「落ちた」と判断して poll 停止→再チェック
                clearLast();
                setBridgeState("OFFLINE");
                setBridgeNote(
                    "NFC Bridgeとの通信が切れました（再接続を試行中…）",
                );
                scheduleRecheck();
            }
        };

        const startPollingLast = () => {
            if (lastTimer) return; // 既に動いてる
            // 400ms はそのまま
            lastTimer = window.setInterval(tickLast, 400);
        };

        // 初回チェック
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

        if (!looksLikeUuid(v)) {
            setMsg(
                "UUID形式ではありません。タグ内容/リーダー設定を確認してください。",
            );
            return;
        }

        setBusy(true);
        try {
            const token = await linkIdentity(v);
            await setAccessToken(token.accessToken);
            onLinked(token.accessToken);
        } catch (err: any) {
            setMsg(err?.response?.data?.message ?? "Link failed");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div style={{ display: "grid", gap: 8 }}>
            <p style={{ margin: 0, opacity: 0.85 }}>
                PCのNFCリーダーでカードをかざしてください（入力欄に自動入力されます）。
            </p>

            {/* ✅ bridge 状態表示（OFFLINEでも手動入力は可） */}
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

            <button onClick={commit} disabled={busy || !value.trim()}>
                {busy ? "登録中..." : "この読み取り結果で本人認証を登録"}
            </button>
        </div>
    );
}
