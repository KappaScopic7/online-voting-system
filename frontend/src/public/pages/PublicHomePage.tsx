// frontend/src/public/pages/PublicHomePage.tsx
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { useAuth } from "../../user/UserAuthContext";
import { fetchPublicAnnouncement } from "../api/announcement";
import type { SystemAnnouncement } from "../../shared/model/announcement";
import { fetchPublicNotices, type PublicNotice } from "../api/notices";
import { formatLocal } from "../../shared/datetime/formatLocal";

function actorLabel(actor: SystemAnnouncement["actor"]) {
    return actor === "SYSTEM_ADMIN"
        ? "システム管理者から"
        : "選挙管理委員会から";
}

export function PublicHomePage() {
    const { me, isLoading: authLoading } = useAuth();

    const loc = useLocation();
    const from = loc.pathname + loc.search;

    const [banner, setBanner] = useState<SystemAnnouncement | null>(null);
    const [bannerLoading, setBannerLoading] = useState(false);
    const [bannerUpdatedAt, setBannerUpdatedAt] = useState<string | null>(null);

    const [notices, setNotices] = useState<PublicNotice[]>([]);
    const [noticesLoading, setNoticesLoading] = useState(false);
    const [noticesUpdatedAt, setNoticesUpdatedAt] = useState<string | null>(
        null,
    );

    const anyBusy = bannerLoading || noticesLoading;

    async function loadBanner() {
        setBannerLoading(true);
        try {
            const a = await fetchPublicAnnouncement();
            // enabled=false のときは表示しない
            setBanner(a && a.enabled ? a : null);
            setBannerUpdatedAt(new Date().toISOString());
        } catch {
            setBanner(null);
            setBannerUpdatedAt(new Date().toISOString());
        } finally {
            setBannerLoading(false);
        }
    }

    async function loadNotices() {
        setNoticesLoading(true);
        try {
            const items = await fetchPublicNotices(5);
            setNotices(items ?? []);
            setNoticesUpdatedAt(new Date().toISOString());
        } catch {
            setNotices([]);
            setNoticesUpdatedAt(new Date().toISOString());
        } finally {
            setNoticesLoading(false);
        }
    }

    // ✅ 手動の「再読み込み」はバナーもお知らせも両方更新
    async function reloadAll() {
        // 片方失敗で片方も巻き込まない（Promise.allSettled）
        setBannerLoading(true);
        setNoticesLoading(true);

        const [rb, rn] = await Promise.allSettled([
            loadBanner(),
            loadNotices(),
        ]);

        // loadBanner/loadNotices 側で finally が走るけど、念のため保険で落とす
        // （Reactの状態更新の順序でチラつくのを防ぐ目的）
        if (rb.status === "rejected") setBannerLoading(false);
        if (rn.status === "rejected") setNoticesLoading(false);
    }

    // 初回：バナー
    useEffect(() => {
        loadBanner();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 初回 + 自動更新（30秒ごと）：お知らせ一覧だけ
    useEffect(() => {
        loadNotices();
        const t = window.setInterval(loadNotices, 30000);
        return () => window.clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>公開ページ</h1>}
            actions={
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <Link to="/elections" state={{ from }}>
                        選挙一覧へ
                    </Link>

                    {authLoading ? (
                        <span style={{ fontSize: 12, opacity: 0.75 }}>
                            認証確認中...
                        </span>
                    ) : me ? (
                        <span style={{ fontSize: 12, opacity: 0.75 }}>
                            ログイン中
                        </span>
                    ) : (
                        <Link to="/login" state={{ from }}>
                            ログイン
                        </Link>
                    )}
                </div>
            }
            maxWidth={820}
        >
            {/* ===== 単発バナー ===== */}
            {banner && (
                <Card>
                    <div style={{ display: "grid", gap: 6 }}>
                        <div style={{ fontWeight: 900 }}>
                            [{actorLabel(banner.actor)}]
                        </div>

                        <div
                            style={{
                                fontSize: 13,
                                opacity: 0.9,
                                lineHeight: 1.6,
                                whiteSpace: "pre-wrap",
                            }}
                        >
                            {banner.message}
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: 10,
                                alignItems: "center",
                                flexWrap: "wrap",
                            }}
                        >
                            {banner.updatedAt && (
                                <div style={{ fontSize: 12, opacity: 0.6 }}>
                                    更新: {formatLocal(banner.updatedAt)}
                                </div>
                            )}
                            {bannerUpdatedAt && (
                                <div style={{ fontSize: 12, opacity: 0.55 }}>
                                    取得: {formatLocal(bannerUpdatedAt)}
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            )}

            {/* ===== 複数件お知らせ ===== */}
            <Card>
                <div style={{ display: "grid", gap: 10 }}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 12,
                            flexWrap: "wrap",
                        }}
                    >
                        <div style={{ fontWeight: 900 }}>お知らせ</div>

                        <div
                            style={{
                                display: "flex",
                                gap: 10,
                                alignItems: "center",
                                flexWrap: "wrap",
                            }}
                        >
                            {noticesUpdatedAt && (
                                <span style={{ fontSize: 12, opacity: 0.6 }}>
                                    最終更新: {formatLocal(noticesUpdatedAt)}
                                </span>
                            )}

                            {/* ✅ ここがポイント：全部更新 */}
                            <button
                                style={{
                                    fontSize: 12,
                                    padding: "6px 10px",
                                    borderRadius: 10,
                                    border: "1px solid rgba(0,0,0,0.2)",
                                    background: "#fff",
                                    cursor: anyBusy ? "not-allowed" : "pointer",
                                    opacity: anyBusy ? 0.7 : 1,
                                }}
                                onClick={reloadAll}
                                disabled={anyBusy}
                            >
                                {anyBusy ? "更新中…" : "再読み込み"}
                            </button>
                        </div>
                    </div>

                    {notices.length === 0 ? (
                        <div style={{ fontSize: 13, opacity: 0.6 }}>
                            現在、お知らせはありません。
                        </div>
                    ) : (
                        <div style={{ display: "grid", gap: 10 }}>
                            {notices.map((n) => (
                                <div
                                    key={n.id}
                                    style={{
                                        border: "1px solid rgba(0,0,0,0.12)",
                                        borderRadius: 12,
                                        padding: 12,
                                        display: "grid",
                                        gap: 6,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 8,
                                            flexWrap: "wrap",
                                            alignItems: "center",
                                        }}
                                    >
                                        {n.pinned && (
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    padding: "2px 8px",
                                                    borderRadius: 999,
                                                    border: "1px solid rgba(0,0,0,0.2)",
                                                    opacity: 0.9,
                                                }}
                                            >
                                                固定
                                            </span>
                                        )}
                                        <div style={{ fontWeight: 800 }}>
                                            {n.title}
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            fontSize: 13,
                                            opacity: 0.9,
                                            lineHeight: 1.6,
                                            whiteSpace: "pre-wrap",
                                        }}
                                    >
                                        {n.body}
                                    </div>

                                    <div style={{ fontSize: 12, opacity: 0.6 }}>
                                        公開: {formatLocal(n.publishedAt)}
                                        {n.expiresAt
                                            ? ` / 期限: ${formatLocal(
                                                  n.expiresAt,
                                              )}`
                                            : ""}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            <Card>
                <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ fontWeight: 900 }}>このページについて</div>

                    <div
                        style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.8 }}
                    >
                        ・本システムは<strong>町田市で行われる選挙</strong>
                        を想定した、オンライン投票の卒業制作です。
                        <br />
                        ・有権者は、開催中の選挙に対して
                        <strong>オンラインで投票</strong>できます。
                        <br />
                        ・将来的には、運用・制度・セキュリティ整備を前提に、
                        <strong>全国規模へ拡大</strong>
                        できる仕組みを目指しています。
                    </div>

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <Link to="/elections" state={{ from }}>
                            <b>町田市の選挙一覧を見る →</b>
                        </Link>

                        {!me && !authLoading && (
                            <Link to="/login" state={{ from }}>
                                ログインして投票 →
                            </Link>
                        )}

                        {me && !authLoading && (
                            <Link to="/me/elections" state={{ from }}>
                                マイ選挙へ →
                            </Link>
                        )}
                    </div>
                </div>
            </Card>

            <Card>
                <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ fontWeight: 900 }}>案内</div>

                    <div
                        style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.8 }}
                    >
                        本システムでは、<strong>町田市で行われる選挙</strong>
                        を想定し、 以下の方法でオンライン投票が可能です。
                        <br />
                        <br />
                        <strong>■ ログインして投票する場合</strong>
                        <br />
                        1. アカウントでログインします
                        <br />
                        2. 「選挙一覧」から開催中の選挙を選択します
                        <br />
                        3. 投票画面へ進み、オンラインで投票します
                        <br />
                        <br />
                        <strong>■ 未ログインで本人認証して投票する場合</strong>
                        <br />
                        1. 選挙一覧から対象の選挙を選択します
                        <br />
                        2. 本人認証（NFCカード / 専用アプリ）を行います
                        <br />
                        3. 認証完了後、そのまま投票できます
                        <br />
                        <br />※ 投票は
                        <strong>期間内であれば何度でも変更可能</strong>で、
                        最後に送信した内容が有効になります。
                    </div>

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <Link to="/elections" state={{ from }}>
                            <b>選挙一覧を見る →</b>
                        </Link>

                        {!me && !authLoading && (
                            <>
                                <Link to="/login" state={{ from }}>
                                    ログインして投票 →
                                </Link>
                                <span style={{ fontSize: 12, opacity: 0.7 }}>
                                    ※ 本人認証のみでも投票可能
                                </span>
                            </>
                        )}

                        {me && !authLoading && (
                            <Link to="/me/elections" state={{ from }}>
                                マイ選挙へ →
                            </Link>
                        )}
                    </div>
                </div>
            </Card>

            <DevDebug
                value={{
                    me: !!me,
                    authLoading,
                    from,
                    banner,
                    bannerUpdatedAt,
                    noticesCount: notices.length,
                    noticesUpdatedAt,
                    busy: { bannerLoading, noticesLoading },
                }}
            />
        </Page>
    );
}
