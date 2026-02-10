import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { fetchVoteHistory, type VoteHistoryItem } from "../../api/votes";
import { allocHistory } from "../../api/allocVoting";
import type { AllocVoteHistoryItem } from "../../model/allocVotingTypes";

import { normalizeFrom } from "../../../shared/normalizeFrom";
import { fetchMeDetail } from "../../../user/api/userAuthApi";
import type { MeDetailResponse } from "../../../user/model/userAuthTypes";

type LocationState = { from?: string } | null;

export type ViewMode = "ALL" | "NORMAL" | "ALLOC";

export function useVoteHistoryPageState() {
    // ---- data ----
    const [normalItems, setNormalItems] = useState<VoteHistoryItem[] | null>(
        null,
    );
    const [allocItems, setAllocItems] = useState<AllocVoteHistoryItem[] | null>(
        null,
    );

    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // guides (me)
    const [me, setMe] = useState<MeDetailResponse | null>(null);
    const [meError, setMeError] = useState<string | null>(null);

    // ui state
    const [q, setQ] = useState("");
    const [mode, setMode] = useState<ViewMode>("ALL");

    const loc = useLocation();
    const state = (loc.state as LocationState) ?? null;

    const backTo = normalizeFrom(state?.from ?? "/me");
    const from = loc.pathname + loc.search;

    const loadMe = useCallback(async () => {
        setMeError(null);
        try {
            const m = await fetchMeDetail();
            setMe(m);
        } catch (err: any) {
            setMe(null);
            setMeError(
                err?.response?.data?.message ??
                    err?.message ??
                    "ユーザー情報の取得に失敗しました",
            );
        }
    }, []);

    const loadHistories = useCallback(async () => {
        setError(null);
        setIsLoading(true);

        try {
            const [n, a] = await Promise.allSettled([
                fetchVoteHistory(),
                allocHistory(),
            ]);

            // normal
            if (n.status === "fulfilled") {
                setNormalItems(n.value);
            } else {
                const status = (n.reason as any)?.response?.status;
                const message =
                    (n.reason as any)?.response?.data?.message ??
                    "投票履歴（通常）の取得に失敗しました";
                if (status === 401 || status === 403) {
                    setNormalItems([]);
                } else {
                    setNormalItems([]);
                    setError(message);
                }
            }

            // alloc
            if (a.status === "fulfilled") {
                setAllocItems(a.value);
            } else {
                const status = (a.reason as any)?.response?.status;
                const message =
                    (a.reason as any)?.response?.data?.message ??
                    "投票履歴（配分）の取得に失敗しました";
                if (status === 401 || status === 403) {
                    setAllocItems([]);
                } else {
                    setAllocItems([]);
                    setError((prev) => prev ?? message);
                }
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    const load = useCallback(async () => {
        await loadMe();
        await loadHistories();
    }, [loadMe, loadHistories]);

    useEffect(() => {
        load();
    }, [load]);

    // ---- derived ----
    const identityStatus = me?.identityStatus ?? "UNKNOWN";
    const isLinked = identityStatus === "LINKED";
    const isPending = identityStatus === "PENDING";
    const emailVerified = me?.emailVerified === true;

    const showIdentityGuide = me !== null && !isLinked;
    const showEmailGuide = me !== null && !emailVerified;

    const ready = normalItems !== null && allocItems !== null;

    const totalNormal = normalItems?.length ?? 0;
    const totalAlloc = allocItems?.length ?? 0;
    const totalVotes = totalNormal + totalAlloc;

    return {
        // routing context
        backTo,
        from,

        // data
        normalItems,
        allocItems,
        me,

        // ui state
        q,
        setQ,
        mode,
        setMode,

        // status
        error,
        isLoading,
        ready,
        meError,

        // guides
        showEmailGuide,
        showIdentityGuide,
        isPending,
        isLinked,
        emailVerified,

        // counts
        totalNormal,
        totalAlloc,
        totalVotes,

        // actions
        load,
    };
}
