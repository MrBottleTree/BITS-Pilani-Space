import axios, { HttpStatusCode } from "../api/axios";
import { useState } from "react"
import { HTTP_BACKEND_URL } from "../config";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

export function Signin() {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSignin() {
        setIsLoading(true);

        try{
            const response = await axios.post(`${HTTP_BACKEND_URL}/api/v1/auth/signin`, {identifier, password}, { withCredentials: true });
            console.log("Here are the cookies: " + response.headers)
            if(response.status == HttpStatusCode.Ok){
                console.log(response.data);
                // Need to store the access key and stuff in local storage
            }
            else{
                // Need to take care of cases like incorrect identifier etc
                alert("Error in signing in")
            }
        }

        catch(err) {
            console.error("Error: " + err);
        }

        finally{
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