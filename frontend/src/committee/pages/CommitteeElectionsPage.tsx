// frontend/src/committee/pages/CommitteeElectionsPage.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { ElectionListView } from "../../elections/components/ElectionListView";
import {
    fetchCommitteeElections,
    type CommitteeElectionListItem,
} from "../api/elections";
import { Link } from "react-router-dom";

export function CommitteeElectionsPage() {
    const isDev = import.meta.env?.DEV === true;

    const [items, setItems] = useState<CommitteeElectionListItem[] | null>(
        null,
    );
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const load = useCallback(async () => {
        setError(null);
        setIsLoading(true);
        try {
            const data = await fetchCommitteeElections();
            setItems(data);
        } catch (e: any) {
            setError(e?.response?.data?.message ?? "Failed to load");
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const debugValue = useMemo(
        () => JSON.stringify({ items, error, isLoading }, null, 2),
        [items, error, isLoading],
    );

    return (
        <div>
            <div style={{ marginBottom: 12 }}>
                <Link to="/committee/elections/new">新規登録</Link>
            </div>
            <ElectionListView
                title="担当選挙一覧"
                items={items}
                error={error}
                isLoading={isLoading}
                onReload={load}
                detailsHref={(e) => `/committee/elections/${e.electionId}`}
            />

            {isDev && (
                <details style={{ marginTop: 12 }}>
                    <summary>Debug</summary>
                    <pre style={{ whiteSpace: "pre-wrap" }}>{debugValue}</pre>
                </details>
            )}
        </div>
    );
}
