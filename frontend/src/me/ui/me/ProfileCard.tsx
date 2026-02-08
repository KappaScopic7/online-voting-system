// frontend/src/me/ui/me/ProfileCard.tsx
import { Card } from "../../../shared/ui/page";
import type { MeProfileResponse } from "../../model/profileTypes";
import { Badge } from "./Badge";
import { AddressInput } from "../AddressInput";

function Field(props: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    disabled?: boolean;
    hint?: string;
    type?: React.HTMLInputTypeAttribute;
}) {
    const {
        label,
        value,
        onChange,
        placeholder,
        disabled,
        hint,
        type = "text",
    } = props;

    return (
        <label style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>{label}</div>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #e5e5e5",
                    background: disabled ? "#fafafa" : "#fff",
                }}
            />
            {hint && (
                <div style={{ fontSize: 12, opacity: 0.7, lineHeight: 1.5 }}>
                    {hint}
                </div>
            )}
        </label>
    );
}

export function ProfileCard(props: {
    profile: MeProfileResponse | null;
    profileMsg: string | null;

    disableSelfEdit: boolean;

    showProfileEdit: boolean;
    setShowProfileEdit: (v: boolean) => void;

    saving: boolean;

    birthDate: string;
    setBirthDate: (v: string) => void;
    prefCode: string;
    setPrefCode: (v: string) => void;
    cityCode: string;
    setCityCode: (v: string) => void;

    canSaveProfile: boolean;
    cannotSaveReason: string | null;

    onSaveProfile: () => void;
    onReloadProfile: () => void;

    profileFilled: boolean;
}) {
    const {
        profile,
        profileMsg,
        disableSelfEdit,
        showProfileEdit,
        setShowProfileEdit,
        saving,
        birthDate,
        setBirthDate,
        prefCode,
        setPrefCode,
        cityCode,
        setCityCode,
        canSaveProfile,
        cannotSaveReason,
        onSaveProfile,
        onReloadProfile,
        profileFilled,
    } = props;

    return (
        <Card>
            <div style={{ display: "grid", gap: 12 }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                    }}
                >
                    <div>
                        <div style={{ fontWeight: 900, fontSize: 15 }}>
                            判定用プロフィール
                        </div>
                        <div
                            style={{
                                fontSize: 12,
                                opacity: 0.75,
                                lineHeight: 1.6,
                            }}
                        >
                            My選挙の対象判定に使います。本人認証済みの場合は市民情報が優先され、編集できません。
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                        }}
                    >
                        {profile?.source ? (
                            <Badge
                                tone={
                                    profile.source === "CITIZEN"
                                        ? "good"
                                        : "neutral"
                                }
                            >
                                source: {profile.source}
                            </Badge>
                        ) : (
                            <Badge tone="neutral">未登録</Badge>
                        )}

                        {!disableSelfEdit && (
                            <button
                                type="button"
                                onClick={() =>
                                    setShowProfileEdit(!showProfileEdit)
                                }
                            >
                                {showProfileEdit ? "閉じる" : "編集する"}
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
                    <div>
                        生年月日: <b>{profile?.birthDate ?? "(未登録)"}</b>
                    </div>
                    <div>
                        都道府県コード: <b>{profile?.prefCode ?? "(未登録)"}</b>
                    </div>
                    <div>
                        市区町村コード: <b>{profile?.cityCode ?? "(未登録)"}</b>
                    </div>
                    {profile?.updatedAt && (
                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                            updatedAt: {profile.updatedAt}
                        </div>
                    )}
                </div>

                {disableSelfEdit && (
                    <div
                        style={{
                            border: "1px solid #eee",
                            borderRadius: 12,
                            padding: 10,
                            background: "#fafafa",
                            fontSize: 12,
                            lineHeight: 1.6,
                            opacity: 0.9,
                        }}
                    >
                        本人認証済み（または市民情報由来）です。
                        <br />
                        判定用プロフィールは <b>市民情報が優先</b>
                        されるため、自己申告プロフィールは編集できません。
                    </div>
                )}

                {profileMsg && (
                    <div
                        style={{
                            border: "1px solid #eee",
                            borderRadius: 12,
                            padding: 10,
                        }}
                    >
                        {profileMsg}
                    </div>
                )}

                {showProfileEdit && !disableSelfEdit && (
                    <div style={{ display: "grid", gap: 10 }}>
                        <Field
                            label="生年月日"
                            value={birthDate}
                            onChange={setBirthDate}
                            disabled={saving}
                            type="date"
                        />

                        <div style={{ display: "grid", gap: 8 }}>
                            <div style={{ fontSize: 13, fontWeight: 800 }}>
                                住所
                            </div>
                            <AddressInput
                                prefCode={prefCode}
                                cityCode={cityCode}
                                onChangePref={setPrefCode}
                                onChangeCity={setCityCode}
                                disabled={saving}
                            />
                            <div
                                style={{
                                    fontSize: 12,
                                    opacity: 0.7,
                                    lineHeight: 1.6,
                                }}
                            >
                                ※ 郵便番号 or 選択で入力できます（保存は
                                prefCode/cityCode）
                            </div>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: 12,
                                flexWrap: "wrap",
                                alignItems: "center",
                            }}
                        >
                            <button
                                type="button"
                                onClick={onSaveProfile}
                                disabled={!canSaveProfile}
                                title={cannotSaveReason ?? undefined}
                            >
                                {saving ? "保存中..." : "保存"}
                            </button>

                            <button
                                type="button"
                                onClick={onReloadProfile}
                                disabled={saving}
                            >
                                再取得
                            </button>

                            {cannotSaveReason && (
                                <span style={{ fontSize: 12, opacity: 0.7 }}>
                                    保存不可: {cannotSaveReason}
                                </span>
                            )}

                            {!profileFilled && !cannotSaveReason && (
                                <span style={{ fontSize: 12, opacity: 0.7 }}>
                                    ※ 入力が揃うと My選挙の対象判定が安定します
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
