import { createBrowserRouter } from "react-router-dom";
import { Signup } from "./pages/Signup";

export const router = createBrowserRouter([
    {
        path: "/signup",
        element: <Signup />,
    },
]);