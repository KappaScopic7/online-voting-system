// frontend/src/staff/StaffAuthContext.tsx
import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { staffLogin, fetchStaffMe } from "./api/staffAuth";
import { staffToken } from "../shared/tokenStorage";

export type StaffMe = {
    accountId: string;
    loginId: string;
    role: "ADMIN" | "COMMITTEE";
};

type StaffAuthState = {
    staff: StaffMe | null;
    isLoading: boolean;
    isAuthed: boolean;
    login: (loginId: string, password: string) => Promise<void>;
    logout: () => void;
    refreshMe: () => Promise<void>;
};

const StaffAuthContext = createContext<StaffAuthState | null>(null);

export function StaffAuthProvider({ children }: { children: React.ReactNode }) {
    const [staff, setStaff] = useState<StaffMe | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshMe = async () => {
        const token = staffToken.get();
        if (!token) {
            setStaff(null);
            return;
        }

        try {
            const me = await fetchStaffMe();
            setStaff(me);
        } catch {
            staffToken.clear();
            setStaff(null);
        }
    };

    const login = async (loginId: string, password: string) => {
        const res = await staffLogin(loginId, password);
        staffToken.set(res.accessToken);
        await refreshMe();
    };

    const logout = () => {
        staffToken.clear();
        setStaff(null);
    };

    // 初期ロード
    useEffect(() => {
        (async () => {
            setIsLoading(true);
            try {
                await refreshMe();
            } finally {
                setIsLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // token変更（別タブ含む）に追従：必要なら
    useEffect(() => {
        const unsub = staffToken.subscribe(() => {
            const token = staffToken.get();
            if (!token) setStaff(null);
        });
        return unsub;
    }, []);

    const value = useMemo<StaffAuthState>(
        () => ({
            staff,
            isLoading,
            isAuthed: !!staff,
            login,
            logout,
            refreshMe,
        }),
        [staff, isLoading],
    );

    return (
        <StaffAuthContext.Provider value={value}>
            {children}
        </StaffAuthContext.Provider>
    );
}

export function useStaffAuth(): StaffAuthState {
    const ctx = useContext(StaffAuthContext);
    if (!ctx) {
        throw new Error("useStaffAuth must be used within StaffAuthProvider");
    }
    return ctx;
}
