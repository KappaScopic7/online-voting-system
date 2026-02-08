import { useCallback, useState } from "react";

export function useAsyncLoad<T>(fn: () => Promise<T>) {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const run = useCallback(async () => {
        setError(null);
        setIsLoading(true);
        try {
            const d = await fn();
            setData(d);
            return d;
        } catch (e: any) {
            setError(e?.response?.data?.message ?? "Failed to load");
            setData(null);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [fn]);

    return { data, setData, error, setError, isLoading, run };
}
