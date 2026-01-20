// auth/pages/VerifyEmailPage.tsx
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { verifyEmail } from "../api/auth";

type LocationState = {
    email?: string;
    from?: string; // 保護ルートから来た場合の戻り先
};

function isValidEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isValidCode(v: string) {
    // 仮：6桁数字
    return /^\d{6}$/.test(v);
}

export function VerifyEmailPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;
    const from = state.from ?? "/";

    const [email, setEmail] = useState(state.email ?? "");
    const [code, setCode] = useState("123456"); // デモならOK。本番は "" 推奨

    const [msg, setMsg] = useState<string | null>(null);
    const [fieldErr, setFieldErr] = useState<{ email?: string; code?: string }>(
        {},
    );

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const canSubmit = useMemo(() => {
        const em = email.trim();
        if (!em || !isValidEmail(em)) return false;
        if (!isValidCode(code.trim())) return false;
        return !isSubmitting;
    }, [email, code, isSubmitting]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);
        setFieldErr({});

        const em = email.trim();
        const cd = code.trim();

        const nextErr: typeof fieldErr = {};
        if (!em) nextErr.email = "メールアドレスを入力してください";
        else if (!isValidEmail(em))
            nextErr.email = "メールアドレスの形式が不正です";

        if (!cd) nextErr.code = "確認コードを入力してください";
        else if (!isValidCode(cd)) nextErr.code = "確認コードは6桁の数字です";

        if (nextErr.email || nextErr.code) {
            setFieldErr(nextErr);
            return;
        }

        setIsSubmitting(true);
        try {
            await verifyEmail(em, cd);
            nav("/login", { replace: true, state: { email: em, from } });
        } catch (err: any) {
            setMsg(err?.response?.data?.message ?? "Verify failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const onResend = async () => {
        setMsg(null);
        setIsResending(true);
        try {
            // TODO: resend API ができたら差し替え
            // await resendVerifyCode(email.trim());
            await new Promise((r) => setTimeout(r, 400));
            setMsg("確認コードを再送しました（デモ）");
        } catch (err: any) {
            setMsg(err?.response?.data?.message ?? "Resend failed");
        } finally {
            setIsResending(false);
        }
    };

    const isDev = import.meta.env?.DEV;

    return (
        <div style={{ padding: 16, display: "grid", gap: 12, maxWidth: 520 }}>
            <h2>Verify Email</h2>

            <p style={{ marginTop: 0 }}>
                登録したメールに確認コードを送った想定です（デモでは何でもOK）。
            </p>

            {msg && (
                <div
                    role="alert"
                    style={{ padding: 8, border: "1px solid #ccc" }}
                >
                    {msg}
                </div>
            )}

            <form
                onSubmit={onSubmit}
                style={{ display: "grid", gap: 10, maxWidth: 420 }}
            >
                <label style={{ display: "grid", gap: 4 }}>
                    <span>Email</span>
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email"
                        autoComplete="email"
                        // register→verifyの流れなら readOnly もアリ（仮）
                        // readOnly={!!state.email}
                    />
                    {fieldErr.email && (
                        <small style={{ color: "crimson" }}>
                            {fieldErr.email}
                        </small>
                    )}
                </label>

                <label style={{ display: "grid", gap: 4 }}>
                    <span>Code</span>
                    <input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="6-digit code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                    />
                    {fieldErr.code && (
                        <small style={{ color: "crimson" }}>
                            {fieldErr.code}
                        </small>
                    )}
                </label>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button type="submit" disabled={!canSubmit}>
                        {isSubmitting ? "Verifying..." : "Verify"}
                    </button>

                    <button
                        type="button"
                        onClick={onResend}
                        disabled={isResending || !email.trim()}
                    >
                        {isResending ? "Sending..." : "コードを再送"}
                    </button>
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link to="/login" state={{ email: email.trim(), from }}>
                        ログインへ戻る
                    </Link>
                    <Link to="/register" state={{ email: email.trim() }}>
                        新規登録へ
                    </Link>
                </div>
            </form>

            {/* DEV用デバッグ（本番は code を出さない） */}
            {isDev && (
                <details>
                    <summary>Debug</summary>
                    <pre style={{ whiteSpace: "pre-wrap" }}>
                        {JSON.stringify(
                            {
                                email,
                                code,
                                msg,
                                locationState: state,
                                isSubmitting,
                                isResending,
                            },
                            null,
                            2,
                        )}
                    </pre>
                </details>
            )}
        </div>
    );
}
