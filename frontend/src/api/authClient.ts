// frontend/src/api/authClient.ts
import { getAccessToken, clearAccessToken } from '../auth/tokenStore';
import type { ElectionStatus } from '../domain/election';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

// ---- types ----
export type LoginResponse = {
    accessToken: string;
    tokenType: string;
};

export type MyElection = {
    electionId: number;
    code: string;
    name: string;
    districtName: string;
    status: ElectionStatus;
    startsAt: string;
    endsAt: string;
};

export type ElectionDetail = {
    id: number;
    code: string;
    name: string;
    description: string;
    districtName: string;
    status: ElectionStatus;
    startsAt: string;
    endsAt: string;
};

export type Candidate = {
    id: number;
    name: string;
    partyName: string | null;
    profile: string | null;
};

export type MyVote = {
    candidateId: number;
    candidateName: string;
    partyName: string | null;
};

export type ElectionResultItem = {
    candidateId: number;
    candidateName: string;
    partyName: string | null;
    voteCount: number;
};

export type VoteHistoryRow = {
    electionId: number;
    electionName: string;
    electionStatus: ElectionStatus;
    votedAt: string;
    candidateName: string;
    partyName: string | null;
};

export type IdentityStatus = {
    verified: boolean;
    verifiedAt: string | null;
};

export type VerifyIdentityRequest = {
    cardId: string;
    pin: string;
};

// ---- error model ----
export class ApiError extends Error {
    readonly status: number;
    readonly url: string;

    constructor(args: { status: number; message: string; url: string }) {
        super(args.message);
        this.name = 'ApiError';
        this.status = args.status;
        this.url = args.url;
    }
}

async function readErrorMessage(res: Response): Promise<string> {
    const contentType = res.headers.get('content-type') ?? '';
    try {
        if (contentType.includes('application/json')) {
            const data = await res.json().catch(() => null);
            const msg =
                data &&
                typeof data === 'object' &&
                'message' in data &&
                typeof (data as any).message === 'string'
                    ? (data as any).message
                    : '';
            return msg || res.statusText || 'リクエストに失敗しました';
        }
        const text = await res.text().catch(() => '');
        return text || res.statusText || 'リクエストに失敗しました';
    } catch {
        return res.statusText || 'リクエストに失敗しました';
    }
}

type RequestOptions = {
    method: 'GET' | 'POST';
    path: string;
    body?: unknown;
    auth?: boolean; // default true
    expectedStatus?: number | number[];
};

function normalizeExpected(expected?: number | number[]): number[] | null {
    if (!expected) return null;
    return Array.isArray(expected) ? expected : [expected];
}

function buildHeaders(opt: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
        Accept: 'application/json',
    };

    const needAuth = opt.auth !== false;
    if (needAuth) {
        const token = getAccessToken();
        if (!token) {
            // 呼び出し元はApiError(401)として扱える
            // 実際のHTTPは飛ばさない（無駄＆ログ汚し防止）
            throw new ApiError({
                status: 401,
                message: 'unauthorized',
                url: `${API_BASE}${opt.path}`,
            });
        }
        headers.Authorization = `Bearer ${token}`;
    }

    if (opt.body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }

    return headers;
}

async function requestJson<T>(opt: RequestOptions): Promise<T> {
    const url = `${API_BASE}${opt.path}`;
    const headers = buildHeaders(opt);

    const res = await fetch(url, {
        method: opt.method,
        headers,
        body: opt.body !== undefined ? JSON.stringify(opt.body) : undefined,
    });

    // ★401は必ずtoken破棄（同一タブもtokenStoreが通知する）
    if (res.status === 401) {
        clearAccessToken();
    }

    const expected = normalizeExpected(opt.expectedStatus);
    if (expected && !expected.includes(res.status)) {
        const msg = await readErrorMessage(res);
        throw new ApiError({ status: res.status, message: msg, url });
    }

    if (!res.ok) {
        const msg = await readErrorMessage(res);
        throw new ApiError({ status: res.status, message: msg, url });
    }

    return res.json();
}

async function requestVoid(opt: RequestOptions): Promise<void> {
    const url = `${API_BASE}${opt.path}`;
    const headers = buildHeaders(opt);

    const res = await fetch(url, {
        method: opt.method,
        headers,
        body: opt.body !== undefined ? JSON.stringify(opt.body) : undefined,
    });

    // ★401は必ずtoken破棄
    if (res.status === 401) {
        clearAccessToken();
    }

    const expected = normalizeExpected(opt.expectedStatus);
    if (expected && !expected.includes(res.status)) {
        const msg = await readErrorMessage(res);
        throw new ApiError({ status: res.status, message: msg, url });
    }

    if (!res.ok) {
        const msg = await readErrorMessage(res);
        throw new ApiError({ status: res.status, message: msg, url });
    }
}

// ---- public APIs (token引数なし) ----

export async function login(email: string, password: string): Promise<LoginResponse> {
    return requestJson<LoginResponse>({
        method: 'POST',
        path: '/api/voters/login',
        body: { email, password },
        auth: false,
        expectedStatus: 200,
    });
}

export async function fetchMyElections(): Promise<MyElection[]> {
    return requestJson<MyElection[]>({
        method: 'GET',
        path: '/api/voters/my-elections',
        expectedStatus: 200,
    });
}

export async function fetchElectionDetail(electionId: number): Promise<ElectionDetail> {
    return requestJson<ElectionDetail>({
        method: 'GET',
        path: `/api/elections/${electionId}`,
        expectedStatus: 200,
    });
}

export async function fetchCandidates(electionId: number): Promise<Candidate[]> {
    return requestJson<Candidate[]>({
        method: 'GET',
        path: `/api/elections/${electionId}/candidates`,
        expectedStatus: 200,
    });
}

export async function fetchMyVote(electionId: number): Promise<MyVote | null> {
    try {
        return await requestJson<MyVote>({
            method: 'GET',
            path: `/api/elections/${electionId}/votes/me`,
            expectedStatus: [200, 404],
        });
    } catch (e: unknown) {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
    }
}

export async function castVote(electionId: number, candidateId: number): Promise<void> {
    await requestVoid({
        method: 'POST',
        path: `/api/elections/${electionId}/votes`,
        body: { candidateId },
        expectedStatus: [204, 200],
    });
}

export async function fetchElectionResult(electionId: number): Promise<ElectionResultItem[]> {
    return requestJson<ElectionResultItem[]>({
        method: 'GET',
        path: `/api/elections/${electionId}/results`,
        expectedStatus: 200,
    });
}

export async function fetchVoteHistory(): Promise<VoteHistoryRow[]> {
    return requestJson<VoteHistoryRow[]>({
        method: 'GET',
        path: '/api/voters/my-votes',
        expectedStatus: 200,
    });
}

export async function fetchIdentityStatus(electionId: number): Promise<IdentityStatus> {
    return requestJson<IdentityStatus>({
        method: 'GET',
        path: `/api/voters/identity/status?electionId=${electionId}`,
        expectedStatus: 200,
    });
}

export async function verifyIdentity(
    electionId: number,
    req: VerifyIdentityRequest,
): Promise<void> {
    await requestVoid({
        method: 'POST',
        path: `/api/elections/${electionId}/verification`,
        body: req,
        expectedStatus: [204, 200],
    });
}

export async function fetchMyVerification(electionId: number): Promise<boolean> {
    return requestJson<boolean>({
        method: 'GET',
        path: `/api/elections/${electionId}/verification/me`,
        expectedStatus: 200,
    });
}
