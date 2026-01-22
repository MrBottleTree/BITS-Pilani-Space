import { useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const useTokenRefresh = (token: string | null, refreshFunction: () => Promise<void>) => {
    useEffect(() => {
        console.log("Use Effect function running...")
        if (!token) {
            refreshFunction();
            return;
        }

        console.log("Token found, decoding...");

        let timeoutRef: any;

        console.log("Use Effect function starting...")

        try {
            const decoded: any = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            
            // calculate the trigger point (when 20% is left)
            const refreshTriggerTime = 0.8 * decoded.exp + 0.2 * decoded.iat;
            
            const delayInMs = (refreshTriggerTime - currentTime) * 1000;

            if (delayInMs > 0) {
                console.log(`Scheduling refresh in ${(delayInMs/1000).toFixed(1)} seconds`);

                timeoutRef = setTimeout(refreshFunction, delayInMs);
            } else{
                // If we passed the 20% mark but token is still valid, refresh now
                console.log("Token past refresh point but still valid, refreshing now...");
                refreshFunction();
            }
        } catch (e) {
            console.error("Token decode failed", e);
        }

        return () => {
            console.log("Use Effect function destroying...")
            if (timeoutRef) clearTimeout(timeoutRef);
        };
    }, [token, refreshFunction]);
};