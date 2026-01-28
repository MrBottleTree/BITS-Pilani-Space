import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export function Signout() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const handleSignout = async () => {
            await logout();
            navigate("/auth/signin");
        };
        handleSignout();
    }, [logout, navigate]);

    return <div>Signing out...</div>;
}
