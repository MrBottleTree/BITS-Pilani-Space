import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useState } from "react";
import axios, { HttpStatusCode } from "../api/axios";
import { HTTP_BACKEND_URL } from "../config";
import { useNavigate } from "react-router-dom";

export function Signup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    async function handleSignup() {
        setIsLoading(true);

        try {
            const response = await axios.post(`${HTTP_BACKEND_URL}/api/v1/auth/signup`, {
                name: name,
                email: email,
                password: password
            });

            const data = response; 

            if (data.status === HttpStatusCode.Created) {                
                navigate("/auth/signin");
            }

            else {
                alert("Error: " + data.data);
            }
        }
        
        catch (error) {
            console.error("Signup failed:", error);
            alert("Something went wrong while signing up.");
        }
        
        finally {
            setIsLoading(false);
        }
    }

    return (
        <div> 
            <h1>Sign Up</h1>
            <form onSubmit={(e) => {
                e.preventDefault();
                handleSignup();
            }}>
                <Input placeholder="Full name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
                <br />
                <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <br />
                <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <br />

                <Button 
                    label={isLoading ? "Signing up..." : "Submit"} 
                    disabled={isLoading} 
                />
            </form>
        </div>
    )
}