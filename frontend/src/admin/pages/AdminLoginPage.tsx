// frontend/src/admin/pages/AdminLoginPage.tsx
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useStaffAuth } from "../../staff/StaffAuthContext";

type LocationState = {
    loginId?: string;
    from?: string;
};

export function AdminLoginPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;
    const from = state.from ?? "/admin";

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

            // StaffAuthContext に任せる（token保存→me取得まで）
            await login(loginId.trim(), password);

            // login後に staff が入る想定。念のため role チェック
            // （roleミスマッチならログアウトして弾くのが親切）
            // ここで staff はまだ古い可能性があるので、厳密にやるなら refreshMe を返す設計にする。
            // 今回は「ADMIN画面に入ったら RequireStaff が弾く」でもOK。
            nav(from, { replace: true });
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
            <h2>Admin Login</h2>

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
