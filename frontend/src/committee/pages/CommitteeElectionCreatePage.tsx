import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCommitteeElection } from "../api/elections";

export function CommitteeElectionCreatePage() {
    const isDev = import.meta.env?.DEV === true;
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [startsAt, setStartsAt] = useState("");
    const [endsAt, setEndsAt] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setError(null);
            setIsLoading(true);

            try {
                await createCommitteeElection({
                    title,
                    startsAt,
                    endsAt,
                });

                // 登録後は一覧へ戻す
                navigate("/committee/elections");
            } catch (e: any) {
                setError(e?.response?.data?.message ?? "Failed to create");
            } finally {
                setIsLoading(false);
            }
        },
        [title, startsAt, endsAt, navigate],
    );

    const debugValue = useMemo(
        () =>
            JSON.stringify(
                { title, startsAt, endsAt, error, isLoading },
                null,
                2,
            ),
        [title, startsAt, endsAt, error, isLoading],
    );

    return (
        <div>
            <h1>選挙登録</h1>

            <form onSubmit={onSubmit}>
                <div>
                    <label>選挙名</label>
                    <br />
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label>開始日時</label>
                    <br />
                    <input
                        type="datetime-local"
                        value={startsAt}
                        onChange={(e) => setStartsAt(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label>終了日時</label>
                    <br />
                    <input
                        type="datetime-local"
                        value={endsAt}
                        onChange={(e) => setEndsAt(e.target.value)}
                        required
                    />
                </div>

                {error && (
                    <div style={{ color: "red", marginTop: 8 }}>{error}</div>
                )}

                <div style={{ marginTop: 12 }}>
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? "登録中…" : "登録"}
                    </button>
                </div>
            </form>

            {isDev && (
                <details style={{ marginTop: 12 }}>
                    <summary>Debug</summary>
                    <pre style={{ whiteSpace: "pre-wrap" }}>{debugValue}</pre>
                </details>
            )}
        </div>
    );
}
