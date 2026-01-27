import axios, { HttpStatusCode } from "../api/axios";
import { useState } from "react"
import { HTTP_BACKEND_URL } from "../config";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";

export function Signin() {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    async function handleSignin() {
        setIsLoading(true);

        try {
            const response = await axios.post(`${HTTP_BACKEND_URL}/api/v1/auth/signin`, { identifier, password });

            if (response.status == HttpStatusCode.Ok) {
                const { access_token, expires_in, user } = response.data.data;
                login(access_token, expires_in, user);
                // For now, just alerting
                alert("Signed in successfully!");
            }
            else {
                alert("Error in signing in")
            }
        }

        catch (err) {
            alert("Error: " + err);
        }
        finally {
            setIsLoading(false);
        }
    }

    return <div>
        <h1>Sign In</h1>
        <form onSubmit={(e) => {
            e.preventDefault();
            handleSignin();
        }}>
            <Input placeholder="Handle or Email" onChange={(e) => setIdentifier(e.target.value)} />
            <br />
            <Input placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
            <br />
            <Button
                label={isLoading ? "Signing in..." : "Submit"}
                disabled={isLoading}
            />
        </form>
    </div>
};