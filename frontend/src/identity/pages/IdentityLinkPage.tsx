// frontend/src/identity/pages/IdentityLinkPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Card, DevDebug, Page } from "../../shared/ui/page";

import {
    IdentityMethodTabs,
    type IdentityMethod,
} from "../components/IdentityMethodTabs";
import { IdentityManualForm } from "../components/IdentityManualForm";
import { IdentityNfcScanner } from "../components/IdentityNfcScanner";
import { IdentityNfcKeyboardReader } from "../components/IdentityNfcKeyboardReader";

import {
    fetchDemoPersonas,
    type DemoPersonaDto,
} from "../../demo/api/demoPersonas";

import { useIdentityDevice } from "../hooks/useIdentityDevice";
import { useIdentityNav } from "../hooks/useIdentityNav";
import { IdentityErrorCard } from "../ui/IdentityErrorCard";
import { IdentityStepHeaderCard } from "../ui/IdentityStepHeaderCard";
import { IdentityPinStepCard } from "../ui/IdentityPinStepCard";
import { isPinValid } from "../utils/identityValidation";
import { createLinkPairing } from "../api/identity";

type Step = "PIN" | "METHOD";

function buildAndroidLinkDeepLink(params: { returnTo: string }) {
    const q = new URLSearchParams();
    q.set("returnTo", params.returnTo);
    return `ovs://nfc-link?${q.toString()}`;
}

export function IdentityLinkPage() {
    const nav = useNavigate();
    const loc = useLocation();

    const { canWebNfc, isPc, isAndroid } = useIdentityDevice();
    const isDev = import.meta.env?.DEV;

    const { self, backTo } = useIdentityNav({
        fallbackBackTo: "/me",
        fallbackReturnTo: "/me/elections",
    });

    const toUser = useMemo(() => {
        const fallback = "/me/elections";
        const from = (loc.state as any)?.from;
        return from && from !== loc.pathname ? from : fallback;
    }, [loc.state, loc.pathname]);

    const pinRequired = true; // 恒久本人認証は常に PIN 必須（PIN+タッチ）

    // ✅ Androidは最初からMETHOD（PIN+タッチを同画面で見せる）
    const [step, setStep] = useState<Step>(isAndroid ? "METHOD" : "PIN");
    useEffect(() => {
        setStep(isAndroid ? "METHOD" : "PIN");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAndroid]);

    const [pin, setPin] = useState("");
    const pinOk = isPinValid(pin);

    // ✅ Manual 許可ポリシー：
    // - WebNFC非対応なら Manual 必須（常に許可）
    // - WebNFC対応かつ Android は Manual を隠す（強制NFC）
    // - WebNFC対応かつ 非Android は DEV の時だけ Manual 可
    const allowManual = !canWebNfc || (!isAndroid && isDev);

    const [method, setMethod] = useState<IdentityMethod>(() =>
        canWebNfc ? "NFC" : "MANUAL",
    );

    // allowManual=false なら強制的に NFC に寄せる
    useEffect(() => {
        if (!allowManual && method === "MANUAL") setMethod("NFC");
    }, [allowManual, method]);

    const [err, setErr] = useState<string | null>(null);

    const onLinkedUser = (_accessToken: string) => {
        nav(toUser, { replace: true });
    };

    // DEV personas
    const [devPersonas, setDevPersonas] = useState<DemoPersonaDto[]>([]);
    const [devCitizenId, setDevCitizenId] = useState("");
    const [devLoading, setDevLoading] = useState(false);
    const [devErr, setDevErr] = useState<string | null>(null);

    const reloadDevPersonas = async () => {
        if (!isDev) return;
        try {
            setDevErr(null);
            setDevLoading(true);
            const list = await fetchDemoPersonas();
            setDevPersonas(Array.isArray(list) ? list : []);
        } catch (e: any) {
            setDevErr(
                e?.response?.data?.message ??
                    e?.message ??
                    "DEV personas の取得に失敗しました",
            );
            setDevPersonas([]);
        } finally {
            setDevLoading(false);
        }
    };

    useEffect(() => {
        reloadDevPersonas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDev]);

    const fillDev = (p: DemoPersonaDto) => {
        setErr(null);
        setDevCitizenId((p.citizenId ?? "").trim());
        setMethod("MANUAL");
        setStep("METHOD");
    };

    const openPcPending = async () => {
        try {
            setErr(null);

            const created = await createLinkPairing();
            const pairId = (created?.pairId ?? "").trim();
            if (!pairId) throw new Error("pairId missing");

            // Androidアプリへ渡す deepLink（pairId必須）
            const qDeep = new URLSearchParams();
            qDeep.set("pairId", pairId);
            qDeep.set("returnTo", self); // PCのpendingに戻す
            const deepLink = `ovs://nfc-link?${qDeep.toString()}`;

            // PCの待機画面へ
            const q = new URLSearchParams();
            q.set("mode", "linkPending");
            q.set("deepLink", deepLink);
            q.set("backTo", backTo);

            nav(`/identity/pending?${q.toString()}`, {
                replace: false,
                state: { from: (loc.state as any)?.from ?? "/me/elections" },
            });
        } catch (e: any) {
            setErr(
                e?.response?.data?.message ??
                    e?.message ??
                    "本人認証の開始に失敗しました",
            );
        }
    };

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>本人認証</h1>}
            actions={
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link to={backTo}>← 戻る</Link>
                    <Link to="/me" state={{ from: self }}>
                        My Page →
                    </Link>
                </div>
            }
            maxWidth={680}
        >
            <IdentityErrorCard
                err={err}
                onClose={() => setErr(null)}
                backTo={backTo}
            />

            {/* ========================= PC: Pendingへ ========================= */}
            {isPc ? (
                <div style={{ display: "grid", gap: 12 }}>
                    <Card>
                        <div style={{ display: "grid", gap: 10 }}>
                            <div style={{ fontWeight: 900 }}>
                                PCでは本人認証できません（スマホでNFC認証します）
                            </div>
                            <div
                                style={{
                                    fontSize: 13,
                                    opacity: 0.85,
                                    lineHeight: 1.7,
                                }}
                            >
                                1) 「スマホで認証を開始」を押す
                                <br />
                                2) PCに表示されるQRをスマホで開く（アプリ起動）
                                <br />
                                3) アプリでPIN入力 → NFCカードをタッチ
                                <br />
                                4) 完了すると自動で戻ります
                            </div>

                            <button
                                type="button"
                                onClick={openPcPending}
                                style={{
                                    padding: "12px 14px",
                                    fontWeight: 900,
                                    fontSize: 16,
                                }}
                            >
                                スマホで認証を開始 →
                            </button>

                            <div style={{ fontSize: 12, opacity: 0.75 }}>
                                ※
                                アプリ未インストールの場合はQRからストア/導線を用意するのが理想
                            </div>

                            {isDev && (
                                <DevDebug
                                    value={{
                                        isPc,
                                        deepLink: buildAndroidLinkDeepLink({
                                            returnTo: self,
                                        }),
                                    }}
                                />
                            )}
                        </div>
                    </Card>
                </div>
            ) : (
                /* ========================= Mobile ========================= */
                <>
                    <IdentityStepHeaderCard
                        stepLabel={
                            isAndroid
                                ? "PIN入力 → NFCカードをタッチしてください"
                                : step === "PIN"
                                  ? "STEP 1 / 2：PIN（4桁）を入力"
                                  : "STEP 2 / 2：認証方法を選択"
                        }
                        canWebNfc={canWebNfc}
                    />

                    {/* iOS等: 従来どおり PIN→METHOD */}
                    {!isAndroid && step === "PIN" && (
                        <div style={{ display: "grid", gap: 12 }}>
                            <IdentityPinStepCard
                                pin={pin}
                                setPin={setPin}
                                onNext={() => {
                                    if (!pinOk) return;
                                    setErr(null);
                                    setStep("METHOD");
                                }}
                            />
                        </div>
                    )}

                    {(isAndroid || step === "METHOD") && (
                        <Card>
                            <div style={{ display: "grid", gap: 10 }}>
                                {/* Android: PIN入力を前面に */}
                                {isAndroid && (
                                    <Card>
                                        <IdentityPinStepCard
                                            pin={pin}
                                            setPin={setPin}
                                            onNext={() => {}}
                                        />
                                        <div
                                            style={{
                                                fontSize: 12,
                                                opacity: 0.75,
                                            }}
                                        >
                                            ※
                                            PINを入力したら、下でカードをタッチしてください
                                        </div>
                                    </Card>
                                )}

                                {!isAndroid && (
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
                                            onClick={() => {
                                                setErr(null);
                                                setStep("PIN");
                                            }}
                                        >
                                            ← PINを修正
                                        </button>
                                        <span
                                            style={{
                                                fontSize: 12,
                                                opacity: 0.75,
                                            }}
                                        >
                                            PIN: <b>••••</b>（入力済み）
                                        </span>
                                    </div>
                                )}

                                <IdentityMethodTabs
                                    value={method}
                                    onChange={setMethod}
                                    allowManual={allowManual}
                                />

                                <div
                                    style={{
                                        marginTop: 12,
                                        border: "1px solid #eee",
                                        borderRadius: 12,
                                        padding: 12,
                                    }}
                                >
                                    {method === "MANUAL" && allowManual ? (
                                        <IdentityManualForm
                                            pin={pin}
                                            pinRequired={pinRequired}
                                            onLinked={onLinkedUser}
                                            onError={setErr}
                                            devCitizenId={devCitizenId}
                                        />
                                    ) : canWebNfc ? (
                                        <IdentityNfcScanner
                                            pin={pin}
                                            pinRequired={pinRequired}
                                            mode="IDENTITY_LINK"
                                            onLinked={onLinkedUser}
                                            onError={setErr}
                                        />
                                    ) : (
                                        <IdentityNfcKeyboardReader
                                            pin={pin}
                                            pinRequired={pinRequired}
                                            onLinked={onLinkedUser}
                                            onError={setErr}
                                        />
                                    )}
                                </div>

                                <div style={{ fontSize: 12, opacity: 0.7 }}>
                                    ※
                                    うまくいかない場合は「手入力」をお試しください
                                    {!allowManual && (
                                        <>
                                            <br />※
                                            この端末では手入力を無効化しています（運用方針）
                                        </>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}

                    {isDev && (
                        <Card>
                            <details>
                                <summary style={{ cursor: "pointer" }}>
                                    DEV tools
                                </summary>
                                <div
                                    style={{
                                        marginTop: 12,
                                        display: "grid",
                                        gap: 10,
                                    }}
                                >
                                    <DevDebug
                                        value={{
                                            step,
                                            method,
                                            pin: pin ? "(present)" : null,
                                            pinOk,
                                            backTo,
                                            toUser,
                                            self,
                                            canWebNfc,
                                            isPc,
                                            isAndroid,
                                            pinRequired,
                                            allowManual,
                                            devLoading,
                                            devErr,
                                            devPersonasCount:
                                                devPersonas.length,
                                            devCitizenId: devCitizenId
                                                ? "(present)"
                                                : null,
                                        }}
                                    />

                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 8,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <button
                                            type="button"
                                            onClick={reloadDevPersonas}
                                            disabled={devLoading}
                                            style={{
                                                fontSize: 12,
                                                padding: "6px 10px",
                                            }}
                                        >
                                            {devLoading
                                                ? "読み込み中..."
                                                : "再読込"}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setDevCitizenId("")}
                                            style={{
                                                fontSize: 12,
                                                padding: "6px 10px",
                                            }}
                                        >
                                            クリア
                                        </button>
                                    </div>

                                    {devErr && (
                                        <div
                                            style={{
                                                color: "crimson",
                                                fontSize: 12,
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            {devErr}
                                        </div>
                                    )}

                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 8,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        {devPersonas.map((p) => (
                                            <button
                                                key={p.key}
                                                type="button"
                                                onClick={() => fillDev(p)}
                                                style={{
                                                    fontSize: 12,
                                                    padding: "6px 10px",
                                                }}
                                                title={p.description}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </details>
                        </Card>
                    )}
                </>
            )}
        </Page>
    );
}
