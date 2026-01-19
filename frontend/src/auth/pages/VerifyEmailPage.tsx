// auth/pages/VerifyEmailPage.tsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyEmail } from "../api/auth";

type LocationState = {
    email?: string;
};

export function VerifyEmailPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;

    const [email, setEmail] = useState(state.email ?? "");
    const [code, setCode] = useState("123456");
    const [msg, setMsg] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);
        setIsSubmitting(true);
        try {
            await verifyEmail(email, code);

            // 成功 → login へ（emailを渡して入力補助）
            nav("/login", { state: { email } });
        } catch (err: any) {
            setMsg(err?.response?.data?.message ?? "Verify failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <h2>Verify Email</h2>
            <p style={{ marginTop: 8 }}>
                登録したメールに確認コードを送った想定です（デモでは何でもOK）。
            </p>

            <form
                onSubmit={onSubmit}
                style={{ display: "grid", gap: 8, maxWidth: 360 }}
            >
                <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email"
                    autoComplete="email"
                />
                <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="code"
                    inputMode="numeric"
                />
                <button type="submit" disabled={isSubmitting || !email}>
                    {isSubmitting ? "Verifying..." : "Verify"}
                </button>
            </form>

            {msg && <p style={{ marginTop: 8 }}>{msg}</p>}
            <div style={{ marginTop: 16 }}>
                Raw JSON
                <pre style={{ whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(
                        {
                            email,
                            code,
                            msg,
                            locationState: state,
                            isSubmitting,
                        },
                        null,
                        2,
                    )}
                </pre>
            </div>
        </div>
    );
}
