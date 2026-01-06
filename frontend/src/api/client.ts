import { getToken, setToken, clearToken } from '../auth/tokenStore';
import type {
    ApiError,
    TokenResponse,
    MeResponse,
    ElectionListItem,
    CandidateItem,
    VoteHistoryItem,
} from './types';

const API_BASE = '';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
        ...(init.headers as Record<string, string> | undefined),
    };

    if (init.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

    if (!res.ok) {
        let body: any = null;
        try {
            body = await res.json();
        } catch {
            // ignore
        }
        const err: ApiError = body?.code
            ? body
            : { code: 'HTTP_ERROR', message: `HTTP ${res.status}` };

        // 401ならトークン破棄（以後の画面遷移が安定する）
        if (res.status === 401) clearToken();

        throw err;
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
}

// ---- auth ----
export async function apiLogin(email: string, password: string): Promise<void> {
    const r = await request<TokenResponse>('/api/auth/voter/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    setToken(r.accessToken);
}

export async function apiMe(): Promise<MeResponse> {
    return request<MeResponse>('/api/auth/me');
}

// ---- voter ----
export async function apiListElections(): Promise<ElectionListItem[]> {
    return request<ElectionListItem[]>('/api/voter/elections');
}

export async function apiListCandidates(electionId: string): Promise<CandidateItem[]> {
    return request<CandidateItem[]>(`/api/voter/elections/${electionId}/candidates`);
}

export async function apiCastVote(electionId: string, candidateId: string): Promise<void> {
    return request<void>(`/api/voter/elections/${electionId}/votes`, {
        method: 'POST',
        body: JSON.stringify({ candidateId }),
    });
}

export async function apiVoteHistory(): Promise<VoteHistoryItem[]> {
    return request<VoteHistoryItem[]>('/api/voter/votes');
}
