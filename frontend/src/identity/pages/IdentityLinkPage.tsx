// frontend/src/identity/pages/IdentityLinkPage.tsx
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { linkIdentity } from "../api/identity";
import { useAuth } from "../../auth/AuthContext";

type LocationState = {
    from?: string;
};

function isUuidLike(v: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        v,
    );
}

export function IdentityLinkPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;

    const { setAccessToken } = useAuth();

    const [citizenId, setCitizenId] = useState("");
    const [msg, setMsg] = useState<string | null>(null);
    const [fieldErr, setFieldErr] = useState<{ citizenId?: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canSubmit = useMemo(() => {
        const v = citizenId.trim();
        if (!v) return false;
        if (!isUuidLike(v)) return false;
        return !isSubmitting;
    }, [citizenId, isSubmitting]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);
        setFieldErr({});

        const v = citizenId.trim();
        if (!v) {
            setFieldErr({ citizenId: "citizenId を入力してください" });
            return;
        }
        if (!isUuidLike(v)) {
            setFieldErr({ citizenId: "UUID形式が不正です" });
            return;
        }

        try {
            setIsSubmitting(true);
            const token = await linkIdentity(v);

            await setAccessToken(token.accessToken);

            // 元の画面へ戻す（なければMyPage）
            // 自分自身に戻るのは避ける
            const fallback = "/me/elections";
            const to =
                state.from && state.from !== loc.pathname
                    ? state.from
                    : fallback;

            nav(to, { replace: true });
        } catch (err: any) {
            setMsg(err?.response?.data?.message ?? "Link failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isDev = import.meta.env?.DEV;

    return (
        <div style={{ padding: 16, display: "grid", gap: 12, maxWidth: 560 }}>
            <header style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <h2 style={{ margin: 0 }}>本人認証</h2>
                <span style={{ marginLeft: "auto" }}>
                    <Link to="/me">My Pageへ</Link>
                </span>
            </header>

            <p style={{ marginTop: 0, opacity: 0.85 }}>
                デモ用：citizenId(UUID) を入力して本人認証を完了させます。
            </p>

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
                    <span>citizenId (UUID)</span>
                    <input
                        value={citizenId}
                        onChange={(e) => setCitizenId(e.target.value)}
                        placeholder="例: 550e8400-e29b-41d4-a716-446655440000"
                        disabled={isSubmitting}
                    />
                    {fieldErr.citizenId && (
                        <small style={{ color: "crimson" }}>
                            {fieldErr.citizenId}
                        </small>
                    )}
                </label>

                <button type="submit" disabled={!canSubmit}>
                    {isSubmitting ? "登録中..." : "本人認証を登録"}
                </button>

                {state.from && (
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                        認証後は元の画面へ戻ります
                    </div>
                )}
            </form>

            {isDev && (
                <details>
                    <summary>Debug</summary>
                    <pre style={{ whiteSpace: "pre-wrap" }}>
                        {JSON.stringify(
                            { citizenId, msg, state, isSubmitting },
                            null,
                            2,
                        )}
                    </pre>
                </details>
            )}
        </div>
    );
}
