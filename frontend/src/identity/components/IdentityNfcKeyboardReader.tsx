// frontend/src/identity/components/IdentityNfcKeyboardReader.tsx
import { useEffect, useRef, useState } from "react";
import { linkIdentity } from "../api/identity";
import { useAuth } from "../../user/UserAuthContext";

function looksLikeUuid(v: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        v,
    );
}

export function IdentityNfcKeyboardReader(props: {
    onLinked: (accessToken: string) => void;
}) {
    const { onLinked } = props;
    const { setAccessToken } = useAuth();

    const inputRef = useRef<HTMLInputElement>(null);
    const [value, setValue] = useState("");
    const [msg, setMsg] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const timerRef = useRef<number | null>(null);
    const scheduleCommit = () => {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
            commit();
        }, 250);
    };

    useEffect(() => {
        inputRef.current?.focus();
        return () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
            const token = await linkIdentity(v); // ✅ stringで呼ぶ
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

            {msg && (
                <div
                    role="alert"
                    style={{ padding: 8, border: "1px solid #ccc" }}
                >
                    {msg}
                </div>
            )}

            <label style={{ display: "grid", gap: 4 }}>
                <span>読み取り結果 citizenId (UUID)</span>
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
                    placeholder="ここに自動入力されます"
                    style={{ width: "100%", padding: 8 }}
                />
            </label>

            <button onClick={commit} disabled={busy || !value.trim()}>
                {busy ? "登録中..." : "この読み取り結果で本人認証を登録"}
            </button>
        </div>
    );
}
