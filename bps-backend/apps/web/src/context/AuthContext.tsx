import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import axios, { HttpStatusCode } from "../api/axios";
import { HTTP_BACKEND_URL } from "../config";

interface User {
    id: string;
    handle: string;
    email: string;
    role: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string, expires_in: number, user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem("access_token"));
    const [isLoading, setIsLoading] = useState(true);

    // UseRef for the timer to persist across renders and closures
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Helper to clear everything
    const clearAuth = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("access_token");
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
    };

    const scheduleRefresh = (expires_in_seconds: number) => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }

        // Refresh at 80% of the lifetime
        // expires_in is in seconds, convert to ms
        const refreshTimeMs = (expires_in_seconds * 1000) * 0.8;

        console.log(`Scheduling refresh in ${refreshTimeMs / 1000} seconds`);

        refreshTimerRef.current = setTimeout(() => {
            refreshSession();
        }, refreshTimeMs);
    };

    const refreshSession = async () => {
        try {
            console.log("Proactive refreshing...");

            const response = await axios.post(`${HTTP_BACKEND_URL}/api/v1/auth/refresh`);

            if (response.status === HttpStatusCode.Ok) {
                const { access_token, expires_in, user } = response.data.data;

                // Update state
                setToken(access_token);
                setUser(user);
                localStorage.setItem("access_token", access_token);

                // Schedule next refresh
                scheduleRefresh(expires_in);
                console.log("Refresh successful");
            } else {
                console.warn("Refresh failed with status", response.status);
                logout();
            }
        } catch (error) {
            console.error("Refresh failed", error);
            logout();
        }
    };

    const login = (newToken: string, expires_in: number, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem("access_token", newToken);
        scheduleRefresh(expires_in);
    };

    const logout = async () => {
        try {
            await axios.post(`${HTTP_BACKEND_URL}/api/v1/auth/signout`);
        } catch (err) {
            console.error("Signout error", err);
        } finally {
            clearAuth();
        }
    };

    // On mount, try to refresh immediately to validate session and start timer
    useEffect(() => {
        const initAuth = async () => {
            setIsLoading(true);
            const storedToken = localStorage.getItem("access_token");

            if (storedToken) {
                // We have a token locally, let's convert it to a session verify + refresh
                // This handles the case where the user reloads the page
                try {
                    const response = await axios.post(`${HTTP_BACKEND_URL}/api/v1/auth/refresh`);
                    if (response.status === HttpStatusCode.Ok) {
                        const { access_token, expires_in, user } = response.data.data;
                        login(access_token, expires_in, user);
                    } else {
                        // If 401, maybe token expired or session invalid.
                        console.log("Initial refresh returned non-OK status");
                        clearAuth();
                    }
                } catch (error) {
                    // If refresh fails on load (e.g. cookie expired), clear auth
                    console.log("Initial refresh failed, clearing auth");
                    clearAuth();
                }
            } else {
                setIsLoading(false);
            }
            setIsLoading(false);
        };

        initAuth();

        return () => {
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
                refreshTimerRef.current = null;
            }
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}