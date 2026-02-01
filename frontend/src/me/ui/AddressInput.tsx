import { useEffect, useMemo, useRef, useState } from "react";
import { getCities, getPrefs, lookupByZip } from "../api/master";
import type { CityItem, PrefItem, ZipCandidate } from "../api/master";

type AddressMode = "ZIP" | "SELECT";

function normalizeZip(raw: string) {
    return raw.replace(/[^\d]/g, "").slice(0, 7);
}

function useDebouncedValue<T>(value: T, delayMs: number) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = window.setTimeout(() => setDebounced(value), delayMs);
        return () => window.clearTimeout(t);
    }, [value, delayMs]);
    return debounced;
}

export function AddressInput({
    prefCode,
    cityCode,
    onChangePref,
    onChangeCity,
    disabled,
}: {
    prefCode: string;
    cityCode: string;
    onChangePref: (v: string) => void;
    onChangeCity: (v: string) => void;
    disabled?: boolean;
}) {
    const [mode, setMode] = useState<AddressMode>("ZIP");

    return (
        <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <label
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                    }}
                >
                    <input
                        type="radio"
                        checked={mode === "ZIP"}
                        onChange={() => setMode("ZIP")}
                        disabled={disabled}
                    />
                    郵便番号で入力
                </label>

                <label
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                    }}
                >
                    <input
                        type="radio"
                        checked={mode === "SELECT"}
                        onChange={() => setMode("SELECT")}
                        disabled={disabled}
                    />
                    選択して入力
                </label>
            </div>

            {mode === "ZIP" ? (
                <ZipMode
                    disabled={disabled}
                    onResolved={(r) => {
                        onChangePref(r.prefCode);
                        onChangeCity(r.cityCode);
                    }}
                />
            ) : (
                <SelectMode
                    disabled={disabled}
                    prefCode={prefCode}
                    cityCode={cityCode}
                    onChangePref={onChangePref}
                    onChangeCity={onChangeCity}
                />
            )}

            <div style={{ fontSize: 12, opacity: 0.75 }}>
                現在の設定: prefCode=<b>{prefCode || "(未設定)"}</b> / cityCode=
                <b>{cityCode || "(未設定)"}</b>
            </div>
        </div>
    );
}

function ZipMode({
    disabled,
    onResolved,
}: {
    disabled?: boolean;
    onResolved: (v: { prefCode: string; cityCode: string }) => void;
}) {
    const [zip, setZip] = useState("");
    const [msg, setMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [candidates, setCandidates] = useState<ZipCandidate[]>([]);

    const canSearch = zip.length === 7 && !loading && !disabled;

    const display = (c: ZipCandidate) => {
        const town = (c.town ?? "").trim();
        return `${c.prefName} ${c.cityName}${town ? ` ${town}` : ""}`;
    };

    const search = async () => {
        setMsg(null);
        setCandidates([]);
        if (zip.length !== 7) {
            setMsg("郵便番号は7桁で入力してください");
            return;
        }
        setLoading(true);
        try {
            const res = await lookupByZip(zip);
            if (!res.length) {
                setMsg("該当する住所が見つかりませんでした");
                return;
            }

            setCandidates(res);

            if (res.length === 1) {
                onResolved({
                    prefCode: res[0].prefCode,
                    cityCode: res[0].cityCode,
                });
                setMsg("住所を反映しました");
            } else {
                setMsg("候補から選択してください");
            }
        } catch (err: any) {
            setMsg(
                err?.response?.data?.message ??
                    err?.message ??
                    "検索に失敗しました",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: "grid", gap: 10 }}>
            <div
                style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    alignItems: "end",
                }}
            >
                <label style={{ display: "grid", gap: 6, minWidth: 220 }}>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>
                        郵便番号（7桁）
                    </div>
                    <input
                        value={zip}
                        onChange={(e) => setZip(normalizeZip(e.target.value))}
                        inputMode="numeric"
                        placeholder="例: 1940001"
                        disabled={disabled || loading}
                        style={{
                            padding: "10px 12px",
                            borderRadius: 10,
                            border: "1px solid #e5e5e5",
                            background: disabled ? "#fafafa" : "#fff",
                        }}
                    />
                </label>

                <button type="button" onClick={search} disabled={!canSearch}>
                    {loading ? "検索中..." : "検索"}
                </button>
            </div>

            {msg && (
                <div
                    style={{
                        border: "1px solid #eee",
                        borderRadius: 12,
                        padding: 10,
                        background: "#fafafa",
                    }}
                >
                    {msg}
                </div>
            )}

            {candidates.length >= 2 && (
                <div style={{ display: "grid", gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>
                        候補を選択
                    </div>
                    <div style={{ display: "grid", gap: 6 }}>
                        {candidates.map((c, idx) => (
                            <button
                                key={idx}
                                type="button"
                                disabled={disabled}
                                onClick={() => {
                                    onResolved({
                                        prefCode: c.prefCode,
                                        cityCode: c.cityCode,
                                    });
                                    setMsg("住所を反映しました");
                                }}
                                style={{
                                    textAlign: "left",
                                    padding: "10px 12px",
                                    borderRadius: 12,
                                    border: "1px solid #eee",
                                    background: "#fafafa",
                                }}
                            >
                                {display(c)}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function SelectMode({
    disabled,
    prefCode,
    cityCode,
    onChangePref,
    onChangeCity,
}: {
    disabled?: boolean;
    prefCode: string;
    cityCode: string;
    onChangePref: (v: string) => void;
    onChangeCity: (v: string) => void;
}) {
    const [prefs, setPrefs] = useState<PrefItem[]>([]);
    const [cities, setCities] = useState<CityItem[]>([]);
    const [q, setQ] = useState("");
    const qDebounced = useDebouncedValue(q, 250);

    const [msg, setMsg] = useState<string | null>(null);
    const [loadingPrefs, setLoadingPrefs] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

    // prefs 初回ロード
    useEffect(() => {
        (async () => {
            setMsg(null);
            setLoadingPrefs(true);
            try {
                const res = await getPrefs();
                setPrefs(res);
            } catch (err: any) {
                setMsg(
                    err?.response?.data?.message ??
                        err?.message ??
                        "都道府県の取得に失敗しました",
                );
            } finally {
                setLoadingPrefs(false);
            }
        })();
    }, []);

    // pref を変えたら city をリセット & city候補ロード（qなし）
    const lastPrefRef = useRef<string>("");

    useEffect(() => {
        if (lastPrefRef.current !== prefCode) {
            lastPrefRef.current = prefCode;
            onChangeCity("");
            setQ("");
        }
        if (!prefCode) {
            setCities([]);
            return;
        }
        (async () => {
            setMsg(null);
            setLoadingCities(true);
            try {
                const res = await getCities(prefCode);
                setCities(res);
            } catch (err: any) {
                setMsg(
                    err?.response?.data?.message ??
                        err?.message ??
                        "市区町村の取得に失敗しました",
                );
            } finally {
                setLoadingCities(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prefCode]);

    // q（debounced）で検索し直す
    useEffect(() => {
        if (!prefCode) return;
        if (!qDebounced.trim()) return;

        (async () => {
            setMsg(null);
            setLoadingCities(true);
            try {
                const res = await getCities(prefCode, qDebounced.trim());
                setCities(res);
            } catch (err: any) {
                setMsg(
                    err?.response?.data?.message ??
                        err?.message ??
                        "検索に失敗しました",
                );
            } finally {
                setLoadingCities(false);
            }
        })();
    }, [prefCode, qDebounced]);

    const selectedPrefName = useMemo(() => {
        return prefs.find((p) => p.prefCode === prefCode)?.prefName ?? "";
    }, [prefs, prefCode]);

    return (
        <div style={{ display: "grid", gap: 10 }}>
            {msg && (
                <div
                    style={{
                        border: "1px solid #eee",
                        borderRadius: 12,
                        padding: 10,
                        background: "#fafafa",
                    }}
                >
                    {msg}
                </div>
            )}

            <label style={{ display: "grid", gap: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>都道府県</div>
                <select
                    value={prefCode}
                    onChange={(e) => onChangePref(e.target.value)}
                    disabled={disabled || loadingPrefs}
                    style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid #e5e5e5",
                        background: disabled ? "#fafafa" : "#fff",
                    }}
                >
                    <option value="">
                        {loadingPrefs ? "読み込み中..." : "選択してください"}
                    </option>
                    {prefs.map((p) => (
                        <option key={p.prefCode} value={p.prefCode}>
                            {p.prefName}（{p.prefCode}）
                        </option>
                    ))}
                </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>
                    市区町村（検索）
                </div>
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={
                        prefCode ? "例: 町田 / 13209" : "先に都道府県を選択"
                    }
                    disabled={disabled || !prefCode}
                    style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid #e5e5e5",
                        background: disabled ? "#fafafa" : "#fff",
                    }}
                />
                {selectedPrefName && (
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                        対象: {selectedPrefName}
                    </div>
                )}
            </label>

            <label style={{ display: "grid", gap: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>市区町村</div>
                <select
                    value={cityCode}
                    onChange={(e) => onChangeCity(e.target.value)}
                    disabled={disabled || !prefCode || loadingCities}
                    style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid #e5e5e5",
                        background: disabled ? "#fafafa" : "#fff",
                    }}
                >
                    <option value="">
                        {loadingCities
                            ? "読み込み中..."
                            : prefCode
                              ? "選択してください"
                              : "先に都道府県を選択"}
                    </option>
                    {cities.map((c) => (
                        <option key={c.cityCode} value={c.cityCode}>
                            {c.cityName}（{c.cityCode}）
                        </option>
                    ))}
                </select>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                    ※ 件数が多い場合は検索欄に入力すると絞れます
                </div>
            </label>
        </div>
    );
}
