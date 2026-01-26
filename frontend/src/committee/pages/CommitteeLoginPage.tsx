// frontend/src/committee/pages/CommitteeLoginPage.tsx
import { useMemo, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useStaffAuth } from "../../staff/StaffAuthContext";
import { useAuth } from "../../user/UserAuthContext";
import { normalizeFrom } from "../../shared/normalizeFrom";

type LocationState = {
    loginId?: string;
    from?: string;
};

export function CommitteeLoginPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;

    const from = normalizeFrom(state.from ?? "/committee");

    const { login: staffLogin, refreshMe, staff } = useStaffAuth();
    const { logout: userLogout } = useAuth();

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

    const onSubmit = async (e: FormEvent) => {
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

            userLogout();
            await staffLogin(loginId.trim(), password);
            await refreshMe();

            if (staff?.role !== "COMMITTEE") {
                setMsg("委員会アカウントではありません");
                return;
            }

            nav(from, { replace: true });
        } catch (err: any) {
            console.error("committee login error", err);
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
                <label style={{ display: "grid", gap: 4 }}>
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

                <label style={{ display: "grid", gap: 4 }}>
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
                            aria-pressed={showPw}
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
