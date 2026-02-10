import type { UnifiedGroup, ViewMode } from "./voteHistoryTypes";

export function filterVoteHistoryGroups(
    groups: UnifiedGroup[],
    q: string,
    mode: ViewMode,
): UnifiedGroup[] {
    const keyword = q.trim().toLowerCase();
    const wantNormal = mode === "ALL" || mode === "NORMAL";
    const wantAlloc = mode === "ALL" || mode === "ALLOC";

    return groups
        .map((g) => {
            const hitElection = (g.electionTitle ?? "")
                .toLowerCase()
                .includes(keyword);

            const normalFiltered = !wantNormal
                ? []
                : !keyword
                  ? g.normal
                  : g.normal.filter((v) => {
                        const label =
                            v.label ??
                            (v.type === "NONE_SUPPORT"
                                ? "誰も支持しない"
                                : v.type === "JUDGE_REVIEW"
                                  ? "（不明な裁判官）"
                                  : "（不明な候補者）");
                        return label.toLowerCase().includes(keyword);
                    });

            const allocFiltered = !wantAlloc
                ? []
                : !keyword
                  ? g.alloc
                  : g.alloc.filter((v) =>
                        v.items.some((it) =>
                            (it.label ?? "").toLowerCase().includes(keyword),
                        ),
                    );

            if (!keyword) {
                const hasAny =
                    normalFiltered.length > 0 || allocFiltered.length > 0;
                return hasAny
                    ? { ...g, normal: normalFiltered, alloc: allocFiltered }
                    : null;
            }

            if (hitElection) {
                const keepNormal = wantNormal ? g.normal : [];
                const keepAlloc = wantAlloc ? g.alloc : [];
                const hasAny = keepNormal.length > 0 || keepAlloc.length > 0;
                return hasAny
                    ? { ...g, normal: keepNormal, alloc: keepAlloc }
                    : null;
            }

            if (normalFiltered.length === 0 && allocFiltered.length === 0)
                return null;
            return { ...g, normal: normalFiltered, alloc: allocFiltered };
        })
        .filter((x): x is UnifiedGroup => x !== null);
}
