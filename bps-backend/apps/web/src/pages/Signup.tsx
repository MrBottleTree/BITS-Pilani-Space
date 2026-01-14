import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useState } from "react";
import axios from "axios";

export function Signup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSignup() {
        setIsLoading(true);

        try {
            const response = await axios.post(`http://127.0.0.1:3000/api/v1/auth/signup`, {
                    name: name,
                    email: email,
                    password: password
            });

            const data = response;

            if (data.status == 201) {
                alert("Signed up successfully!");
            } else {
                alert("Error: " + data.data);
            }
        } catch (error) {
            console.error("Signup failed:", error);
            alert("Something went wrong while signing up.");
        } finally {
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
                <Input placeholder="Full name" onChange={(e) => setName(e.target.value)} />
                <br /> 
                <Input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
                <br />
                <Input placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
                <br />

                <Button 
                    label={isLoading ? "Signing up..." : "Submit"} 
                    disabled={isLoading} 
                />
            </form>
        </div>
    )
}