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

    const [notices, setNotices] = useState<PublicNotice[]>([]);
    const [noticesLoading, setNoticesLoading] = useState(false);
    const [noticesUpdatedAt, setNoticesUpdatedAt] = useState<string | null>(
        null,
    );

    async function loadBanner() {
        try {
            const a = await fetchPublicAnnouncement();
            setBanner(a && a.enabled ? a : null);
        } catch {
            setBanner(null);
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

    // 単発バナー（初回）
    useEffect(() => {
        loadBanner();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 複数件お知らせ（初回 + 自動更新）
    useEffect(() => {
        loadNotices();
        // ✅ 自動更新（30秒ごと）
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
            {/* 単発バナー */}
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

                        {banner.updatedAt && (
                            <div style={{ fontSize: 12, opacity: 0.6 }}>
                                更新: {formatLocal(banner.updatedAt)}
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* 複数件お知らせ */}
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

                            <button
                                style={{
                                    fontSize: 12,
                                    padding: "6px 10px",
                                    borderRadius: 10,
                                    border: "1px solid rgba(0,0,0,0.2)",
                                }}
                                onClick={loadNotices}
                                disabled={noticesLoading}
                            >
                                {noticesLoading ? "更新中…" : "再読み込み"}
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
                        ・このページは「公開入口」の仮実装です。
                        <br />
                        ・投票機能は、現在は <b>ログイン投票</b>{" "}
                        のみ提供しています。
                        <br />
                        ・本人認証（未ログイン）投票は、後で構成を整理してから復活させます。
                    </div>

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <Link to="/elections" state={{ from }}>
                            <b>選挙一覧を見る →</b>
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
                        style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.7 }}
                    >
                        1. 「選挙一覧」で開催中の選挙を選びます
                        <br />
                        2. 投票するにはログインが必要です
                        <br />
                        3. ログイン後、投票画面へ進めます
                    </div>

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <Link to="/elections" state={{ from }}>
                            選挙一覧へ
                        </Link>
                        <Link to="/login" state={{ from }}>
                            ログイン
                        </Link>
                    </div>
                </div>
            </Card>

            <DevDebug
                value={{
                    me: !!me,
                    authLoading,
                    from,
                    banner,
                    noticesCount: notices.length,
                    noticesUpdatedAt,
                }}
            />
        </Page>
    );
}
