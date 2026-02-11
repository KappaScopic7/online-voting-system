// frontend/src/identity/components/IdentityManualForm.tsx
import { useEffect, useMemo, useState } from "react";
import { linkIdentity } from "../api/identity";
import { useAuth } from "../../user/UserAuthContext";

function isUuidLike(v: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        v,
    );
}

function isPinValid(pin: string) {
    return /^\d{4}$/.test(pin);
}

/** UUID入力：hex以外を除去 → 32桁まで → 8-4-4-4-12 でハイフン挿入 */
function formatUuidInput(raw: string): string {
    const hex = raw.toLowerCase().replace(/[^0-9a-f]/g, "");
    const s = hex.slice(0, 32);

    const p1 = s.slice(0, 8);
    const p2 = s.slice(8, 12);
    const p3 = s.slice(12, 16);
    const p4 = s.slice(16, 20);
    const p5 = s.slice(20, 32);

    const parts = [p1, p2, p3, p4, p5].filter((p) => p.length > 0);
    return parts.join("-");
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

    const [citizenId, setCitizenId] = useState("");
    const [msg, setMsg] = useState<string | null>(null);
    const [fieldErr, setFieldErr] = useState<{ citizenId?: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ✅ 親から渡された devCitizenId をフォームへ反映（正規化して入れる）
    useEffect(() => {
        const v = (devCitizenId ?? "").trim();
        if (!v) return;
        setCitizenId(formatUuidInput(v));
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

    const uuidIncompleteButHasInput =
        !!citizenId.trim() && !isUuidLike(citizenId.trim());

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
                        onChange={(e) => {
                            // ✅ 入力をUUID形式に寄せる（禁止文字は入らない）
                            const next = formatUuidInput(e.target.value);
                            setCitizenId(next);

                            // 入力中はエラー表示を過剰に出さない
                            setFieldErr({});
                            setMsg(null);
                        }}
                        onBlur={() => {
                            // ✅ フォーカス外れで「不完全なら」だけ優しく出す
                            const v = citizenId.trim();
                            if (v && !isUuidLike(v)) {
                                setFieldErr({
                                    citizenId:
                                        "UUID形式（8-4-4-4-12）で入力してください",
                                });
                            }
                        }}
                        placeholder="例: 550e8400-e29b-41d4-a716-446655440000"
                        disabled={isSubmitting}
                        inputMode="text"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        style={{
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "1px solid #ddd",
                            fontFamily:
                                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                            letterSpacing: 0.2,
                        }}
                    />

                    {fieldErr.citizenId ? (
                        <small style={{ color: "crimson" }}>
                            {fieldErr.citizenId}
                        </small>
                    ) : uuidIncompleteButHasInput ? (
                        <small style={{ opacity: 0.7 }}>
                            入力中: UUID形式に整形しています（32桁で完成）
                        </small>
                    ) : null}
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
        </div>
    );
}
