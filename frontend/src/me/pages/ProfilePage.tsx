// frontend/src/me/pages/ProfilePage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Page, Card, DevDebug } from "../../shared/ui/page";
import { ErrorCard } from "../../shared/ui/ErrorCard";
import { useFromBackTo } from "../../shared/routes/useFromBackTo";
import { useAsyncLoad } from "../../shared/hooks/useAsyncLoad";
import { getMeProfile, putMeProfile } from "../api/profile";
import type {
    MeProfileResponse,
    MeProfileUpdateRequest,
} from "../model/profileTypes";
import { ProfileCard } from "../ui/me/ProfileCard";

export function ProfilePage() {
    const { self, backTo } = useFromBackTo("/me");

    const {
        data: profile,
        setData: setProfile,
        error,
        setError,
        isLoading,
        run,
    } = useAsyncLoad<MeProfileResponse | null>(async () => {
        try {
            return await getMeProfile();
        } catch (err: any) {
            // 404=未入力 → 正常扱い（null）
            if (err?.response?.status === 404) return null;
            throw err;
        }
    });

    const [profileMsg, setProfileMsg] = useState<string | null>(null);

    // form
    const [birthDate, setBirthDate] = useState("");
    const [prefCode, setPrefCode] = useState("");
    const [cityCode, setCityCode] = useState("");

    const [saving, setSaving] = useState(false);

    // UX
    const [showProfileEdit, setShowProfileEdit] = useState(false);
    const autoOpenedRef = useRef(false);

    // 初回ロード
    useEffect(() => {
        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // profile→フォーム同期
    useEffect(() => {
        if (profile === null) {
            setBirthDate("");
            setPrefCode("");
            setCityCode("");
            return;
        }
        if (profile) {
            setBirthDate(profile.birthDate ?? "");
            setPrefCode(profile.prefCode ?? "");
            setCityCode(profile.cityCode ?? "");
        }
    }, [profile]);

    // 編集可否：CITIZEN由来は編集不可
    const isCitizenSource = profile?.source === "CITIZEN";
    const disableSelfEdit = isCitizenSource;

    // ✅ 要件ベースの判定（生年月日 or 住所が揃っていればOK）
    const hasBirth = !!birthDate;
    const addrComplete = !!prefCode && !!cityCode;
    const addrHalf = (!!prefCode && !cityCode) || (!prefCode && !!cityCode);

    const profileOk = hasBirth || addrComplete;

    // ✅ 変更検知（変更がある時だけ保存ボタンを有効化）
    const dirty =
        (birthDate ?? "") !== (profile?.birthDate ?? "") ||
        (prefCode ?? "") !== (profile?.prefCode ?? "") ||
        (cityCode ?? "") !== (profile?.cityCode ?? "");

    // 不足があるなら初回だけ編集を開く（要件ベース）
    useEffect(() => {
        if (autoOpenedRef.current) return;
        if (disableSelfEdit) return;
        if (profileOk) return;
        setShowProfileEdit(true);
        autoOpenedRef.current = true;
    }, [disableSelfEdit, profileOk]);

    const cannotSaveReason = useMemo(() => {
        if (disableSelfEdit) return "市民情報由来のため編集できません";
        if (saving) return "保存中です";

        if (addrHalf) return "住所は都道府県と市区町村を両方入力してください";
        if (!hasBirth && !addrComplete)
            return "生年月日 もしくは 住所（都道府県+市区町村）を入力してください";

        return null;
    }, [disableSelfEdit, saving, hasBirth, addrComplete, addrHalf]);

    // ✅ 保存可否：入力OK かつ 変更あり
    const canSaveProfile = cannotSaveReason === null && dirty;

    const onReloadProfile = async () => {
        setProfileMsg(null);
        setError(null);
        await run();
    };

    const onSaveProfile = async () => {
        setProfileMsg(null);
        setError(null);

        if (disableSelfEdit) {
            setProfileMsg("市民情報由来のため編集できません");
            return;
        }
        if (saving) return;

        // 入力チェック
        if (addrHalf) {
            setProfileMsg("住所は都道府県と市区町村を両方入力してください");
            return;
        }
        if (!hasBirth && !addrComplete) {
            setProfileMsg(
                "生年月日または住所（都道府県+市区町村）を入力してください",
            );
            return;
        }

        // 変更なし
        if (!dirty) {
            setProfileMsg("変更はありません");
            setShowProfileEdit(false);
            return;
        }

        // 空欄は送らない（部分更新）
        const payload: MeProfileUpdateRequest = {
            ...(birthDate ? { birthDate } : {}),
            ...(prefCode ? { prefCode } : {}),
            ...(cityCode ? { cityCode } : {}),
        };

        setSaving(true);
        try {
            const p = await putMeProfile(payload);
            setProfile(p);

            // 保存結果でフォーム同期
            setBirthDate(p.birthDate ?? "");
            setPrefCode(p.prefCode ?? "");
            setCityCode(p.cityCode ?? "");

            setProfileMsg("保存しました");
            setShowProfileEdit(false);
        } catch (err: any) {
            setProfileMsg(
                err?.response?.data?.message ??
                    err?.message ??
                    "保存に失敗しました",
            );
        } finally {
            setSaving(false);
        }
    };

    const isDev = import.meta.env?.DEV;

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>プロフィール</h1>}
            actions={
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <Link to={backTo}>← 戻る</Link>

                    <button
                        onClick={onReloadProfile}
                        disabled={isLoading || saving}
                        style={{ marginLeft: 8 }}
                    >
                        {isLoading ? "Reloading..." : "再読み込み"}
                    </button>

                    <Link
                        to="/me"
                        state={{ from: self }}
                        style={{ marginLeft: "auto" }}
                    >
                        Myページ →
                    </Link>
                </div>
            }
            maxWidth={860}
        >
            {error && (
                <ErrorCard
                    message={error}
                    actions={<button onClick={onReloadProfile}>再試行</button>}
                />
            )}

            {profileMsg && (
                <Card role="alert">
                    <div style={{ fontWeight: 900, marginBottom: 6 }}>
                        メッセージ
                    </div>
                    <div>{profileMsg}</div>
                </Card>
            )}

            {profile === null || profile ? (
                <ProfileCard
                    profile={profile}
                    profileMsg={profileMsg}
                    disableSelfEdit={disableSelfEdit}
                    showProfileEdit={showProfileEdit}
                    setShowProfileEdit={setShowProfileEdit}
                    saving={saving}
                    birthDate={birthDate}
                    setBirthDate={setBirthDate}
                    prefCode={prefCode}
                    setPrefCode={setPrefCode}
                    cityCode={cityCode}
                    setCityCode={setCityCode}
                    canSaveProfile={canSaveProfile}
                    cannotSaveReason={cannotSaveReason}
                    onSaveProfile={onSaveProfile}
                    onReloadProfile={onReloadProfile}
                    profileOk={profileOk}
                    dirty={dirty}
                />
            ) : (
                <Card>読み込み中…</Card>
            )}

            {isDev && (
                <DevDebug
                    value={{
                        backTo,
                        self,
                        profile,
                        birthDate,
                        prefCode,
                        cityCode,
                        error,
                        isLoading,
                        saving,
                        showProfileEdit,
                        profileOk,
                        dirty,
                    }}
                />
            )}
        </Page>
    );
}
