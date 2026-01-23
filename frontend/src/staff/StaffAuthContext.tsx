// staff/StaffAuthContext.tsx
import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { staffLogin, fetchStaffMe } from "./api/staffAuth";
import { getToken, setToken, clearToken } from "../shared/tokenStorage";

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
        const token = getToken();
        if (!token) {
            setStaff(null);
            return;
        }

        try {
            const me = await fetchStaffMe();
            setStaff(me);
        } catch {
            // token が無効
            clearToken();
            setStaff(null);
        }
    };

    const login = async (loginId: string, password: string) => {
        const res = await staffLogin(loginId, password);
        setToken(res.accessToken);
        await refreshMe();
    };

    const logout = () => {
        clearToken();
        setStaff(null);
    };

    useEffect(() => {
        (async () => {
            setIsLoading(true);
            try {
                await refreshMe();
            } finally {
                setIsLoading(false);
            }
        })();
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
