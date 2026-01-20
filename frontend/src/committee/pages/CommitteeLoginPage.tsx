// committee/pages/CommitteeLoginPage.tsx
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { staffLogin } from "../../staff/api/staffAuth";
import { useAuth } from "../../auth/AuthContext";

type LocationState = {
    loginId?: string;
    from?: string;
};

export function CommitteeLoginPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;
    const from = state.from ?? "/committee";

    const { setAccessToken } = useAuth();

    const [loginId, setLoginId] = useState(state.loginId ?? "");
    const [password, setPassword] = useState("");

    const [msg, setMsg] = useState<string | null>(null);
    const [fieldErr, setFieldErr] = useState<{
        loginId?: string;
        password?: string;
    }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canSubmit = useMemo(() => {
        if (!loginId.trim() || !password) return false;
        return !isSubmitting;
    }, [loginId, password, isSubmitting]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);
        setFieldErr({});

        const nextErr: typeof fieldErr = {};
        if (!loginId.trim()) nextErr.loginId = "ログインIDを入力してください";
        if (!password) nextErr.password = "パスワードを入力してください";

        if (nextErr.loginId || nextErr.password) {
            setFieldErr(nextErr);
            return;
        }

        try {
            setIsSubmitting(true);
            const token = await staffLogin(loginId.trim(), password);
            await setAccessToken(token.accessToken);
            nav(from, { replace: true });
        } catch (err: any) {
            setMsg(
                err?.response?.data?.message ?? "委員会ログインに失敗しました",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ padding: 16, display: "grid", gap: 12, maxWidth: 420 }}>
            <h2>Committee Login</h2>

            {msg && (
                <div
                    role="alert"
                    style={{ padding: 8, border: "1px solid #ccc" }}
                >
                    {msg}
                </div>
            )}

            <form onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
                <label>
                    <span>Login ID</span>
                    <input
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                        autoComplete="username"
                    />
                </label>

                <label>
                    <span>Password</span>
                    <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        autoComplete="current-password"
                    />
                </label>

                <button type="submit" disabled={!canSubmit}>
                    {isSubmitting ? "Logging in..." : "Login"}
                </button>
            </form>
        </div>
    );
}
