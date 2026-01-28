// frontend/src/Committee/pages/CommitteeLoginPage.tsx
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useStaffAuth } from "../../staff/StaffAuthContext";

type LocationState = {
    loginId?: string;
    from?: string;
};

export function CommitteeLoginPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;

    const { login } = useStaffAuth();

    const [loginId, setLoginId] = useState(state.loginId ?? "");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);

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
            await login(loginId.trim(), password);
            nav("/committee/me", { replace: true }); 
        } catch (err: any) {
            setMsg(
                err?.response?.data?.message ?? "管理者ログインに失敗しました",
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
                    {fieldErr.loginId && (
                        <small style={{ color: "crimson" }}>
                            {fieldErr.loginId}
                        </small>
                    )}
                </label>

                <label>
                    <span>Password</span>
                    <div style={{ display: "flex", gap: 8 }}>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type={showPw ? "text" : "password"}
                            autoComplete="current-password"
                            style={{ flex: 1 }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPw((v) => !v)}
                        >
                            {showPw ? "Hide" : "Show"}
                        </button>
                    </div>
                    {fieldErr.password && (
                        <small style={{ color: "crimson" }}>
                            {fieldErr.password}
                        </small>
                    )}
                </label>

                <button type="submit" disabled={!canSubmit}>
                    {isSubmitting ? "Logging in..." : "Login"}
                </button>
            </form>
        </div>
    );
}
