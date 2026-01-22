import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useTokenRefresh } from '../hooks/useTokenRefresh';
import axios from '../api/axios';
import { HTTP_BACKEND_URL } from '../config';

interface AuthContextType {
    accessToken: string | null;
    setAccessToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {

    console.log("AuthProvider rendering...");

    const [accessToken, setTokenState] = useState<string>(localStorage.getItem('access_token') || '');

    const setAccessToken = (token: string) => {
        localStorage.setItem('access_token', token);
        setTokenState(token);
    };

    const performRefresh = useCallback(async () => {
        console.log("20% time remaining - Refreshing token...");
        try {
            const response = await axios.post(`${HTTP_BACKEND_URL}/api/v1/auth/refresh`);
            const data = response.data.data;

            if (data.access_token) {
                setAccessToken(data.access_token);
            }
        } catch (err) {
            console.error("Refresh failed", err);
        }
    }, []);

    console.log("Setting up token refresh hook...");
    useTokenRefresh(accessToken, performRefresh);

    return (
        <AuthContext.Provider value={{ accessToken, setAccessToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);