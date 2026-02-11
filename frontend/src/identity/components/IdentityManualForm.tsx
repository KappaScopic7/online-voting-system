// frontend/src/identity/components/IdentityManualForm.tsx
import { useEffect, useMemo, useState } from "react";
import { linkIdentity } from "../api/identity";
import { useAuth } from "../../user/UserAuthContext";
// import { demoPersonas } from "../../demo/personas";

function isUuidLike(v: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        v,
    );
}

function isPinValid(pin: string) {
    return /^\d{4}$/.test(pin);
}

export function IdentityManualForm(props: {
    onLinked: (accessToken: string) => void;
    onError?: (msg: string) => void;

    // PIN
    pin?: string;
    pinRequired?: boolean;

    // ✅ DEV: 親から流し込む用（あれば citizenId に自動反映）
    devCitizenId?: string;
}) {
    const {
        onLinked,
        onError,
        pin = "",
        pinRequired = false,
        devCitizenId,
    } = props;
    const { setAccessToken } = useAuth();

    // const isDev = import.meta.env?.DEV;

    const [citizenId, setCitizenId] = useState("");
    const [msg, setMsg] = useState<string | null>(null);
    const [fieldErr, setFieldErr] = useState<{ citizenId?: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ✅ 親から渡された devCitizenId をフォームへ反映
    useEffect(() => {
        const v = (devCitizenId ?? "").trim();
        if (!v) return;
        setCitizenId(v);
        setFieldErr({});
        setMsg(null);
    }, [devCitizenId]);

    const pinOk = !pinRequired || isPinValid(pin);

    const canSubmit = useMemo(() => {
        const v = citizenId.trim();
        if (!v) return false;
        if (!isUuidLike(v)) return false;
        if (!pinOk) return false;
        return !isSubmitting;
    }, [citizenId, isSubmitting, pinOk]);

    // const fillDemoCitizenId = (id: string) => {
    //     setCitizenId(id);
    //     setFieldErr({});
    //     setMsg(null);
    // };

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
        if (!pinOk) {
            const m = "PINは4桁の数字で入力してください";
            setMsg(m);
            onError?.(m);
            return;
        }

        try {
            setIsSubmitting(true);
            const token = await linkIdentity({
                citizenId: v,
                pin: pinRequired ? pin : undefined,
            });
            await setAccessToken(token.accessToken);
            onLinked(token.accessToken);
        } catch (err: any) {
            const m = err?.response?.data?.message ?? "本人認証に失敗しました";
            setMsg(m);
            onError?.(m);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ display: "grid", gap: 12 }}>
            <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.6 }}>
                citizenId（UUID）を入力して本人認証を行います。
            </div>

            {msg && (
                <div
                    role="alert"
                    style={{
                        padding: 8,
                        border: "1px solid #eee",
                        borderRadius: 8,
                        background: "#fafafa",
                    }}
                >
                    {msg}
                </div>
            )}

            <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
                <label style={{ display: "grid", gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>
                        citizenId (UUID)
                    </span>
                    <input
                        value={citizenId}
                        onChange={(e) => setCitizenId(e.target.value)}
                        placeholder="例: 550e8400-e29b-41d4-a716-446655440000"
                        disabled={isSubmitting}
                        style={{
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "1px solid #ddd",
                        }}
                    />
                    {fieldErr.citizenId && (
                        <small style={{ color: "crimson" }}>
                            {fieldErr.citizenId}
                        </small>
                    )}
                </label>

                <button
                    type="submit"
                    disabled={!canSubmit}
                    style={{ alignSelf: "flex-start" }}
                >
                    {isSubmitting ? "登録中..." : "本人認証を登録"}
                </button>

                {!pinOk && (
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                        ※ 先に PIN（4桁）を入力してください
                    </div>
                )}
            </form>

            {/* {isDev && (
                <details>
                    <summary style={{ cursor: "pointer", fontSize: 12 }}>
                        DEV tools
                    </summary>

                    <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                        <div
                            style={{
                                fontSize: 12,
                                fontWeight: 800,
                                opacity: 0.85,
                            }}
                        >
                            DEV: citizenId クイック入力
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                            }}
                        >
                            {Object.values(demoPersonas.voter)
                                .filter((p) => p.citizenId)
                                .map((p) => (
                                    <button
                                        key={p.key}
                                        type="button"
                                        onClick={() =>
                                            fillDemoCitizenId(p.citizenId!)
                                        }
                                        disabled={isSubmitting}
                                        style={{
                                            fontSize: 12,
                                            padding: "4px 8px",
                                        }}
                                        title={p.description}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                        </div>
                    </div>
                </details>
            )} */}
        </div>
    );
}
