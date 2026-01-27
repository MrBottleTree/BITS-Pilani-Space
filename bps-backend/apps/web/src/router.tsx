import { createBrowserRouter } from "react-router-dom";
import { Signup } from "./pages/Signup";
import { Signin } from "./pages/Signin";
import { Signout } from "./pages/Signout";

export const router = createBrowserRouter([{
        path: "/auth/signup",
        element: <Signup />,
    }, {
        path: "/auth/signin",
        element: <Signin />,
    }, {
        path: "/auth/signout",
        element: <Signout />,
    }
]);