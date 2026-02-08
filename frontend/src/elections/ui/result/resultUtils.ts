// frontend/src/elections/ui/result/resultUtils.ts
export type ElectionKind = "NORMAL" | "ALLOC";

export function detectKind(e: unknown): ElectionKind {
    const obj = e as any;

    const bt = (obj?.ballotType ?? obj?.ballot ?? obj?.mode ?? "")
        .toString()
        .toUpperCase();

    if (
        bt === "ALLOCATION" ||
        bt === "ALLOC" ||
        bt === "ALLOCATED" ||
        bt === "POINTS"
    ) {
        return "ALLOC";
    }

    const key = (obj?.electionKey ?? "").toString().toLowerCase();
    if (key.includes("alloc")) return "ALLOC";

    return "NORMAL";
}

export function percent(v: number, total: number) {
    if (total <= 0) return "0.0%";
    const p = (v / total) * 100;
    return `${p.toFixed(1)}%`;
}

export function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

export function rankMap(
    rows: { candidateId: string; value: number }[],
): Map<string, number> {
    const map = new Map<string, number>();
    let rank = 0;
    let prev: number | null = null;

    for (let i = 0; i < rows.length; i++) {
        const v = rows[i].value;
        if (prev === null || v !== prev) {
            rank = i + 1;
            prev = v;
        }
        map.set(rows[i].candidateId, rank);
    }
    return map;
}

export type ResultRowModel = {
    candidateId: string;
    candidateKey: string | null;
    candidateName: string;
    value: number;
};

export function toResultRows(bundle: unknown): {
    ballotType: string;
    isAlloc: boolean;
    title: string;
    rows: ResultRowModel[];
    total: number;
    noneSupport: number;
} {
    const b = bundle as any;

    const ballotType = (b?.ballotType ?? "SINGLE_CHOICE")
        .toString()
        .toUpperCase();

    const isAlloc = ballotType === "ALLOCATION";

    const title = (isAlloc ? b?.alloc?.title : b?.normal?.title) ?? "結果";

    if (!b) {
        return {
            ballotType,
            isAlloc,
            title,
            rows: [],
            total: 0,
            noneSupport: 0,
        };
    }

    if (isAlloc) {
        const a = b.alloc;

        const rows: ResultRowModel[] = (a?.results ?? [])
            .filter((r: any) => !!r?.candidateId)
            .map(
                (r: any): ResultRowModel => ({
                    candidateId: r.candidateId as string,
                    candidateKey: (r as any).candidateKey ?? null,
                    candidateName: r.candidateName as string,
                    value: Number(r.points ?? 0),
                }),
            )
            .sort((x: ResultRowModel, y: ResultRowModel) => y.value - x.value);

        return {
            ballotType,
            isAlloc,
            title,
            rows,
            total: Number(a?.totalPoints ?? 0),
            noneSupport: Number(a?.noneSupportPoints ?? 0),
        };
    }

    const n = b.normal;

    const rows: ResultRowModel[] = (n?.results ?? [])
        .filter((r: any) => !!r?.candidateId)
        .map(
            (r: any): ResultRowModel => ({
                candidateId: r.candidateId as string,
                candidateKey: (r as any).candidateKey ?? null,
                candidateName: r.candidateName as string,
                value: Number(r.votes ?? 0),
            }),
        )
        .sort((x: ResultRowModel, y: ResultRowModel) => y.value - x.value);

    return {
        ballotType,
        isAlloc,
        title,
        rows,
        total: Number(n?.totalVotes ?? 0),
        noneSupport: Number(n?.noneSupportVotes ?? 0),
    };
}
