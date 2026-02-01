import { createBrowserRouter } from "react-router-dom";
import { Signup } from "./pages/Signup";
import { Signin } from "./pages/Signin";
import { Signout } from "./pages/Signout";
import { Landing } from "./pages/Landing";
import { SpaceGame } from "./pages/SpaceGame";

export const router = createBrowserRouter([{
        path: "/",
        element: <Landing />,
    }, {
        path: "/auth/signup",
        element: <Signup />,
    }, {
        path: "/auth/signin",
        element: <Signin />,
    }, {
        path: "/auth/signout",
        element: <Signout />,
    }, {
        path: "/space/:id",
        element: <SpaceGame />,
    }
]);