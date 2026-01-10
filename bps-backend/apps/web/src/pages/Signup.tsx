import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function Signup() {
    return (
        <div> 
            <h1>Sign Up</h1>
            <form onSubmit={(e) => e.preventDefault()}>
                <Input placeholder="Username" onChange={() => {}} />
                <br /> 
                <Input placeholder="Password" onChange={() => {}} />
                <br />
                <Button label="Submit" onClick={() => alert("Signed up!")} />
            </form>
        </div>
    )
}