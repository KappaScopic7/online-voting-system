// frontend/src/auth/pages/VerifyEmailPage.tsx
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { verifyEmail } from "../../user/api/userAuthApi";
import { sanitizeReturnTo } from "../../auth/routes/returnTo";
import { Card, Page, DevDebug } from "../../shared/ui/page";

type LocationState = { email?: string; from?: string };

function isValidEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function isValidCode(v: string) {
    return /^\d{6}$/.test(v);
}

export function VerifyEmailPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;

    const returnTo = useMemo(
        () => sanitizeReturnTo(state.from, "/"),
        [state.from],
    );

    const [email, setEmail] = useState(state.email ?? "");
    const isDev = import.meta.env?.DEV;
    const [code, setCode] = useState(isDev ? "123456" : "");

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

            nav("/login", {
                replace: true,
                state: { email: em, from: returnTo, verified: true },
            });
        } catch (err: any) {
            setMsg(err?.response?.data?.message ?? "認証に失敗しました");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ※ APIがあるならここを差し替え
    const onResend = async () => {
        setMsg(null);
        setIsResending(true);
        try {
            await new Promise((r) => setTimeout(r, 400));
            setMsg("確認コードを再送しました（デモ）");
        } catch (err: any) {
            setMsg(err?.response?.data?.message ?? "再送に失敗しました");
        } finally {
            setIsResending(false);
        }
    };

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>メール認証</h1>}
            actions={
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link to={returnTo}>← 戻る</Link>
                </div>
            }
            maxWidth={560}
        >
            <Card>
                <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.6 }}>
                    登録したメール宛に確認コードを送った想定です（デモでは何でもOK）。
                </div>
            </Card>

            {msg && (
                <Card role="alert">
                    <div style={{ fontWeight: 900, marginBottom: 6 }}>
                        メッセージ
                    </div>
                    <div style={{ opacity: 0.9, lineHeight: 1.6 }}>{msg}</div>
                </Card>
            )}

            <Card>
                <form
                    onSubmit={onSubmit}
                    aria-busy={isSubmitting}
                    style={{ display: "grid", gap: 10, maxWidth: 460 }}
                >
                    <label style={{ display: "grid", gap: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 900 }}>
                            メールアドレス
                        </div>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="例: user@example.com"
                            autoComplete="email"
                            disabled={isSubmitting}
                            style={{
                                padding: "10px 12px",
                                borderRadius: 10,
                                border: "1px solid #e5e5e5",
                            }}
                        />
                        {fieldErr.email && (
                            <small style={{ color: "crimson" }}>
                                {fieldErr.email}
                            </small>
                        )}
                    </label>

                    <label style={{ display: "grid", gap: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 900 }}>
                            確認コード（6桁）
                        </div>
                        <input
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="例: 123456"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            disabled={isSubmitting}
                            style={{
                                padding: "10px 12px",
                                borderRadius: 10,
                                border: "1px solid #e5e5e5",
                            }}
                        />
                        {fieldErr.code && (
                            <small style={{ color: "crimson" }}>
                                {fieldErr.code}
                            </small>
                        )}
                    </label>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                            type="submit"
                            disabled={!canSubmit || isSubmitting}
                        >
                            {isSubmitting ? "認証中..." : "認証する"}
                        </button>

                        <button
                            type="button"
                            onClick={onResend}
                            disabled={
                                isResending ||
                                isSubmitting ||
                                !isValidEmail(email.trim())
                            }
                        >
                            {isResending ? "再送中..." : "コードを再送"}
                        </button>
                    </div>

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <Link
                            to="/login"
                            state={{ email: email.trim(), from: returnTo }}
                        >
                            ログインへ戻る
                        </Link>
                        <Link
                            to="/register"
                            state={{ email: email.trim(), from: returnTo }}
                        >
                            新規登録へ
                        </Link>
                    </div>
                </form>
            </Card>

            {isDev && (
                <DevDebug
                    value={{
                        email,
                        code,
                        msg,
                        state,
                        returnTo,
                        isSubmitting,
                        isResending,
                    }}
                />
            )}
        </Page>
    );
}
