const axios = require("axios");

axios.defaults.validateStatus = () => true;

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
if (!BACKEND_URL) { // no backend URL, no tests
    throw new Error("BACKEND_URL environment variable is not defined");
}

describe("signin success", () => {
    test("user should be able to signin with correct credentials", async () => {
        let username = "test_user_signin" + Date.now() + "_" + process.hrtime.bigint();
        const password = username + " Password@123";
        const email = username + "@example.com";

        // First signup the user
        const signup_response = await axios.post(`${BACKEND_URL}/api/v1/auth/signup`, {
            email,
            username,
            password,
            type: "user" // normal user type
        });

        expect(signup_response.status).toBe(201);
        expect(signup_response.data).toBeDefined();
        expect(signup_response.data.id).toBeDefined();

        // Now signin with the same credentials
        const signin_response = await axios.post(`${BACKEND_URL}/api/v1/auth/signin`, { identifier: username, password });

        expect(signin_response.status).toBe(200);

        // Get all cookies from the response
        const setCookie = signin_response.headers["set-cookie"];
        expect(setCookie).toBeDefined();

        // Get the cookie we need
        const refreshTokenCookie = setCookie.find(c => c.startsWith("refresh_token="));
        expect(refreshTokenCookie).toBeDefined();

        // assert on the COOKIE STRING
        expect(refreshTokenCookie).toContain("HttpOnly");
        expect(refreshTokenCookie).toContain("Secure");
        expect(refreshTokenCookie).toContain("SameSite=None");
        expect(refreshTokenCookie).toContain("Path=/api/v1/auth/refresh");

        // token exists
        expect(refreshTokenCookie).toMatch(/^refresh_token=[^;]+;/);

    });

    test("admin should be able to signin with correct credentials", async () => {
        const username = "test_admin_signin" + Date.now() + "_" + process.hrtime.bigint();
        const password = username + " Password@123";
        const email = username + "@example.com";
        // First signup the admin
        const signup_response = await axios.post(`${BACKEND_URL}/api/v1/auth/signup`, {
            email,
            username,
            password,
            type: "admin" // admin user type
        });

        expect(signup_response.status).toBe(201);
        expect(signup_response.data).toBeDefined();
        expect(signup_response.data.id).toBeDefined();

        // Now signin with the same credentials
        const signin_response = await axios.post(`${BACKEND_URL}/api/v1/auth/signin`, { identifier: username, password });
        expect(signin_response.status).toBe(200);

        // Get all cookies from the response
        const setCookie = signin_response.headers["set-cookie"];
        expect(setCookie).toBeDefined();

        // Get the cookie we need
        const refreshTokenCookie = setCookie.find(c => c.startsWith("refresh_token="));
        expect(refreshTokenCookie).toBeDefined();

        // assert on the COOKIE STRING
        expect(refreshTokenCookie).toContain("HttpOnly");
        expect(refreshTokenCookie).toContain("Secure");
        expect(refreshTokenCookie).toContain("SameSite=None");
        expect(refreshTokenCookie).toContain("Path=/api/v1/auth/refresh");

        // token exists
        expect(refreshTokenCookie).toMatch(/^refresh_token=[^;]+;/);
    });
});

describe("signin failure", () => {
    const username = "test_user_signin_fail" + Date.now() + "_" + process.hrtime.bigint();
    const password = username + " Password@123";
    const email = username + "@example.com";

    beforeAll(async () => {
        // First signup the user
        const signup_response = await axios.post(`${BACKEND_URL}/api/v1/auth/signup`, {
            email,
            username,
            password,
            type: "user" // normal user type
        });

        expect(signup_response.status).toBe(201);
        expect(signup_response.data).toBeDefined();
        expect(signup_response.data.id).toBeDefined();
    });

    test("signin with incorrect password/identifier pair fails", async () => {
        let signin_response = await axios.post(`${BACKEND_URL}/api/v1/auth/signin`, { identifier: username, password: "wrong_password" });
        expect(signin_response.status).toBe(401);
        expect(signin_response.data).toBeDefined();
        expect(signin_response.data.error).toBeDefined();

        const wrong_username = "wrong_" + username;
        signin_response = await axios.post(`${BACKEND_URL}/api/v1/auth/signin`, { identifier: wrong_username, password });
        expect(signin_response.status).toBe(401);
        expect(signin_response.data).toBeDefined();
        expect(signin_response.data.error).toBeDefined();
    });

    test("signin with missing fields fails", async () => {
        let signin_response = await axios.post(`${BACKEND_URL}/api/v1/auth/signin`, { password });
        expect(signin_response.status).toBe(400);
        expect(signin_response.data).toBeDefined();
        expect(signin_response.data.error).toBeDefined();

        signin_response = await axios.post(`${BACKEND_URL}/api/v1/auth/signin`, { identifier: username });
        expect(signin_response.status).toBe(400);
        expect(signin_response.data).toBeDefined();
        expect(signin_response.data.error).toBeDefined();

        signin_response = await axios.post(`${BACKEND_URL}/api/v1/auth/signin`, { });
        expect(signin_response.status).toBe(400);
        expect(signin_response.data).toBeDefined();
        expect(signin_response.data.error).toBeDefined();
    });
});