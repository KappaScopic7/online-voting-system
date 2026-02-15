// frontend/src/identity/components/IdentityManualForm.tsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../user/UserAuthContext";
import {
    performIdentityAction,
    type IdentityActionMode,
} from "../services/identityAction";
import { formatUuidInput } from "../utils/identityFormat";
import { looksLikeUuid, isPinValid } from "../utils/identityValidation";

export type IdentityManualMode = IdentityActionMode;

export function IdentityManualForm(props: {
    mode?: IdentityManualMode;

    // LINK
    onLinked?: (accessToken: string) => void;

    // VOTE
    electionId?: string;
    onIssued?: (voteToken: string) => void;

    onError?: (msg: string) => void;

    // PIN
    pin?: string;
    pinRequired?: boolean;

    // DEV: 親から流し込む用
    devCitizenId?: string;

    // 表示文言カスタムしたいなら
    submitLabel?: string;
}) {
    const {
        mode = "IDENTITY_LINK",
        onLinked,
        electionId,
        onIssued,
        onError,
        pin = "",
        pinRequired = false,
        devCitizenId,
        submitLabel,
    } = props;

    const { setAccessToken } = useAuth();

    const [citizenId, setCitizenId] = useState("");
    const [msg, setMsg] = useState<string | null>(null);
    const [fieldErr, setFieldErr] = useState<{ citizenId?: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const v = String(devCitizenId ?? "").trim();
        if (!v) return;
        setCitizenId(formatUuidInput(v));
        setFieldErr({});
        setMsg(null);
    }, [devCitizenId]);

    const pinOk = !pinRequired || isPinValid(pin);

    const canSubmit = useMemo(() => {
        const v = citizenId.trim();
        if (!v) return false;
        if (!looksLikeUuid(v)) return false;
        if (!pinOk) return false;
        if (mode === "VOTE_TOKEN_ISSUE" && !String(electionId ?? "").trim())
            return false;
        return !isSubmitting;
    }, [citizenId, isSubmitting, pinOk, mode, electionId]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);
        setFieldErr({});

        const v = citizenId.trim();

        if (!v) {
            setFieldErr({ citizenId: "citizenId を入力してください" });
            return;
        }
        if (!looksLikeUuid(v)) {
            setFieldErr({ citizenId: "UUID形式が不正です" });
            return;
        }
        if (!pinOk) {
            const m = "PINは4桁の数字で入力してください";
            setMsg(m);
            onError?.(m);
            return;
        }
        if (mode === "VOTE_TOKEN_ISSUE" && !String(electionId ?? "").trim()) {
            const m = "electionId がありません（投票入口から開いてください）";
            setMsg(m);
            onError?.(m);
            return;
        }

        try {
            setIsSubmitting(true);

            const r = await performIdentityAction({
                mode,
                payload: v, //citizenId: v, 02/16変更ポイント
                pin,
                //pinRequired, 02/16変更ポイント
                electionId,
                setAccessToken,
            });

            if (r.kind === "LINK") onLinked?.(r.accessToken);
            else onIssued?.(r.voteToken);
        } catch (err: any) {
            const m =
                err?.response?.data?.message ??
                (mode === "IDENTITY_LINK"
                    ? "本人認証に失敗しました"
                    : "本人認証（投票）に失敗しました");
            setMsg(m);
            onError?.(m);
        } finally {
            setIsSubmitting(false);
        }
    };

    const uuidIncompleteButHasInput =
        !!citizenId.trim() && !looksLikeUuid(citizenId.trim());

    const defaultSubmitLabel =
        mode === "IDENTITY_LINK" ? "本人認証を登録" : "本人認証して投票へ進む";

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
                            setCitizenId(formatUuidInput(e.target.value));
                            setFieldErr({});
                            setMsg(null);
                        }}
                        onBlur={() => {
                            const vv = citizenId.trim();
                            if (vv && !looksLikeUuid(vv)) {
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
                    {isSubmitting
                        ? mode === "IDENTITY_LINK"
                            ? "登録中..."
                            : "送信中..."
                        : (submitLabel ?? defaultSubmitLabel)}
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
