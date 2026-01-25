// frontend/src/identity/components/IdentityManualForm.tsx
import { useMemo, useState } from "react";
import { linkIdentity } from "../api/identity";
import { useAuth } from "../../auth/AuthContext";
import { demoPersonas } from "../../demo/personas";

function isUuidLike(v: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        v,
    );
}

export function IdentityManualForm(props: {
    onLinked: (accessToken: string) => void;
}) {
    const { onLinked } = props;
    const { setAccessToken } = useAuth();

    const isDev = import.meta.env?.DEV;

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

    const fillDemoCitizenId = (id: string) => {
        setCitizenId(id);
        setFieldErr({});
        setMsg(null);
    };

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
            onLinked(token.accessToken);
        } catch (err: any) {
            setMsg(err?.response?.data?.message ?? "Link failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ display: "grid", gap: 8 }}>
            <p style={{ margin: 0, opacity: 0.85 }}>
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

                {isDev && (
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                            marginTop: 4,
                        }}
                    >
                        {Object.values(demoPersonas.voter)
                            .filter((p) => p.citizenId)
                            .map((p) => (
                                <button
                                    key={p.key}
                                    type="button"
                                    onClick={() =>
                                        fillDemoCitizenId(p.citizenId)
                                    }
                                    disabled={isSubmitting}
                                    style={{ fontSize: 12, padding: "4px 8px" }}
                                    title={p.description}
                                >
                                    {p.label}
                                </button>
                            ))}
                    </div>
                )}

                <button type="submit" disabled={!canSubmit}>
                    {isSubmitting ? "登録中..." : "本人認証を登録"}
                </button>
            </form>
        </div>
    );
}
