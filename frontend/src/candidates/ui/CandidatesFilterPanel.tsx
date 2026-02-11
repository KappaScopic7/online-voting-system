// frontend/src/candidates/ui/CandidatesFilterPanel.tsx
import type { Dispatch, SetStateAction } from "react";
import { Card } from "../../shared/ui/page";
import type { ElectionListItem } from "../../elections/model/electionTypes";
import type { PartyListItem } from "../../parties/model/partyTypes";

export type DisplayMode = "ELECTION" | "PERSON";

export function CandidatesFilterPanel(props: {
    mode: DisplayMode;
    setMode: Dispatch<SetStateAction<DisplayMode>>;

    elections: ElectionListItem[];
    parties: PartyListItem[];
    metaLoading: boolean;
    partiesLoading: boolean;

    electionId: string;
    setElectionId: Dispatch<SetStateAction<string>>;
    partyKey: string;
    setPartyKey: Dispatch<SetStateAction<string>>;
    q: string;
    setQ: Dispatch<SetStateAction<string>>;

    isLoading: boolean;
    onApply: () => void;
    onReset: () => void;
}) {
    const {
        mode,
        setMode,
        elections,
        parties,
        metaLoading,
        partiesLoading,
        electionId,
        setElectionId,
        partyKey,
        setPartyKey,
        q,
        setQ,
        isLoading,
        onApply,
        onReset,
    } = props;

    // 入力系は「スマホで収まる」ことを最優先（width:100% + maxWidth）
    const inputStyle = {
        padding: 8,
        width: "100%",
        maxWidth: 420,
        minWidth: 0,
        boxSizing: "border-box",
    } as const;

    const selectStyleWide = {
        padding: 8,
        width: "100%",
        maxWidth: 420,
        minWidth: 0,
        boxSizing: "border-box",
    } as const;

    const selectStyleMid = {
        padding: 8,
        width: "100%",
        maxWidth: 320,
        minWidth: 0,
        boxSizing: "border-box",
    } as const;

    return (
        <Card>
            <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
                {/* mode */}
                <div
                    style={{
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                        alignItems: "center",
                        minWidth: 0,
                    }}
                >
                    <span style={{ fontSize: 12, opacity: 0.7 }}>
                        表示モード
                    </span>

                    <label
                        style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                            minWidth: 0,
                        }}
                    >
                        <input
                            type="radio"
                            checked={mode === "ELECTION"}
                            onChange={() => setMode("ELECTION")}
                        />
                        <span style={{ fontSize: 13 }}>選挙単位</span>
                    </label>

                    <label
                        style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                            minWidth: 0,
                        }}
                    >
                        <input
                            type="radio"
                            checked={mode === "PERSON"}
                            onChange={() => setMode("PERSON")}
                        />
                        <span style={{ fontSize: 13 }}>人物単位</span>
                    </label>

                    <span
                        style={{
                            marginLeft: "auto",
                            fontSize: 12,
                            opacity: 0.7,
                            minWidth: 0,
                        }}
                    >
                        {metaLoading ? "選挙情報読み込み中…" : " "}
                        {partiesLoading ? "政党情報読み込み中…" : " "}
                    </span>
                </div>

                {/* server filters */}
                <div
                    style={{
                        display: "grid",
                        gap: 10,
                        // 2カラムまでを自然に作りつつ、スマホは1カラムに落ちる
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(240px, 1fr))",
                        alignItems: "end",
                        minWidth: 0,
                        maxWidth: "100%",
                    }}
                >
                    <label style={{ display: "grid", gap: 4, minWidth: 0 }}>
                        <span style={{ fontSize: 12, opacity: 0.7 }}>
                            選挙（任意）
                        </span>
                        <select
                            value={electionId}
                            onChange={(e) => setElectionId(e.target.value)}
                            style={selectStyleWide}
                        >
                            <option value="">（指定なし）</option>
                            {elections.map((e) => (
                                <option key={e.electionId} value={e.electionId}>
                                    {e.title}
                                </option>
                            ))}
                        </select>
                        <span style={{ fontSize: 11, opacity: 0.6 }}>
                            ※UUID手入力したい場合は下に貼ってOK
                        </span>
                        <input
                            value={electionId}
                            onChange={(e) => setElectionId(e.target.value)}
                            placeholder="electionId(UUID) 直入力"
                            style={inputStyle}
                        />
                    </label>

                    <label style={{ display: "grid", gap: 4, minWidth: 0 }}>
                        <span style={{ fontSize: 12, opacity: 0.7 }}>
                            政党（任意）
                        </span>
                        <select
                            value={partyKey}
                            onChange={(e) => setPartyKey(e.target.value)}
                            style={selectStyleMid}
                        >
                            <option value="">（指定なし）</option>
                            {parties.map((p) => (
                                <option key={p.partyKey} value={p.partyKey}>
                                    {p.name}（{p.shortName}）
                                </option>
                            ))}
                            <option value="__independent__">
                                無所属だけ（※未対応なら手入力で）
                            </option>
                        </select>
                        <input
                            value={partyKey}
                            onChange={(e) => setPartyKey(e.target.value)}
                            placeholder="partyKey 直入力（tokyo_reform など）"
                            style={inputStyle}
                        />
                    </label>

                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            flexWrap: "wrap",
                            minWidth: 0,
                        }}
                    >
                        <button onClick={onApply} disabled={isLoading}>
                            絞り込み
                        </button>
                        <button onClick={onReset} disabled={isLoading}>
                            解除
                        </button>
                    </div>
                </div>

                {/* local search */}
                <label style={{ display: "grid", gap: 4, minWidth: 0 }}>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>
                        検索（ローカル：名前/肩書き）
                    </span>
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="例：DX / 子育て / 鈴木"
                        style={inputStyle}
                    />
                </label>
            </div>
        </Card>
    );
}
