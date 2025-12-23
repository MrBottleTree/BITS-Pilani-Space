const axios = require("axios");

axios.defaults.validateStatus = () => true;

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
if (!BACKEND_URL) { // no backend URL, no tests
    throw new Error("BACKEND_URL environment variable is not defined");
}

describe("signout success", () => {
    const username = "test_user_signin" + Date.now() + "_" + process.hrtime.bigint();
    const password = "Password@123";
    
    const a_username = "admin" + username;

    const user_email = username + "@example.com";
    const admin_email = a_username + "@example.com";

    let user_access_token;
    let user_refresh_token;

    let admin_access_token;
    let admin_refresh_token;

    beforeAll( async () => {
        // Signup the user
        const user_signup_resp = await axios.post(`${BACKEND_URL}/api/v1/auth/signup`, {
            username,
            password,
            email: user_email,
            role: "user"
        });

        expect(user_signup_resp.status).toBe(201);
        expect(user_signup_resp.data).toBeDefined();
        expect(user_signup_resp.data.id).toBeDefined();

        // Signup the admin
        const admin_signup_resp = await axios.post(`${BACKEND_URL}/api/v1/auth/signup`, {
            username: a_username,
            password,
            email: admin_email,
            role: "admin"
        });

        expect(admin_signup_resp.status).toBe(201);
        expect(admin_signup_resp.data).toBeDefined();
        expect(admin_signup_resp.data.id).toBeDefined();

        // Signin the user
        const user_signin_resp = await axios.post(`${BACKEND_URL}/api/v1/auth/signin`, {
            identifier: username,
            password
        });

        expect(user_signin_resp.status).toBe(200);
        expect(user_signin_resp.data).toBeDefined();

        expect(user_signin_resp.data.id).toBeDefined();
        expect(user_signin_resp.data.type).toBe("USER");
        expect(user_signin_resp.data.access_token).toBeDefined();
        expect(user_signin_resp.data.expires_in).toBeDefined();

        user_access_token = user_signin_resp.data.access_token; // get the access token

        const cookie = user_signin_resp.headers['set-cookie'];
        expect(cookie).toBeDefined();

        const refresh_token_cookie = cookie.find(c => c.startsWith('refresh_token='));
        expect(refresh_token_cookie).toBeDefined();
        user_refresh_token = refresh_token_cookie.split(';')[0].split('=')[1]; // get the refresh token from cookie

        expect(user_access_token).toBeDefined();
        expect(user_refresh_token).toBeDefined();

        // Signin the admin
        const admin_signin_resp = await axios.post(`${BACKEND_URL}/api/v1/auth/signin`, {
            identifier: a_username,
            password
        });

        expect(admin_signin_resp.status).toBe(200);
        expect(admin_signin_resp.data).toBeDefined();

        expect(admin_signin_resp.data.id).toBeDefined();
        expect(admin_signin_resp.data.type).toBe("ADMIN");
        expect(admin_signin_resp.data.access_token).toBeDefined();
        expect(admin_signin_resp.data.expires_in).toBeDefined();

        admin_access_token = admin_signin_resp.data.access_token;
        const a_cookie = admin_signin_resp.headers['set-cookie'];
        expect(a_cookie).toBeDefined();

        const a_refresh_token_cookie = a_cookie.find(c => c.startsWith('refresh_token='));
        expect(a_refresh_token_cookie).toBeDefined();
        admin_refresh_token = a_refresh_token_cookie.split(';')[0].split('=')[1];

        expect(admin_access_token).toBeDefined();
        expect(admin_refresh_token).toBeDefined();

        // Here we are done initializing the token values
    });
    
    test("user should be able to sign out", async () => {

        // Sign out the user

        // see how there is no body content needed for signout
        const signout_resp = await axios.post(`${BACKEND_URL}/api/v1/auth/signout`, {}, {
            headers: {
                Cookie: `refresh_token=${user_refresh_token}`,
                Authorization: `Bearer ${user_access_token}`,
            },
        });

        expect(signout_resp.status).toBe(204);
        // server also does not respond with anything
        // TODO: try to get access to a new access key from the invalidated access token to see if it is really invalidated
    });

    test("admin should be able to sign out", async () => {
        // Sign out the admin
        const signout_resp = await axios.post(`${BACKEND_URL}/api/v1/auth/signout`, {}, {
            headers: {
                Cookie: `refresh_token=${admin_refresh_token}`,
                Authorization: `Bearer ${admin_access_token}`,
            },
        });

        expect(signout_resp.status).toBe(204);
    });
});

describe("signout failure", () => {
    const username = "test_user_signin" + Date.now() + "_" + process.hrtime.bigint();
    const password = "Password@123";
    
    const a_username = "admin" + username;

    const user_email = username + "@example.com";
    const admin_email = a_username + "@example.com";

    let user_access_token;
    let user_refresh_token;

    let admin_access_token;
    let admin_refresh_token;

    beforeAll( async () => {
        // Signup the user
        const user_signup_resp = await axios.post(`${BACKEND_URL}/api/v1/auth/signup`, {
            username,
            password,
            email: user_email,
            role: "user"
        });

        expect(user_signup_resp.status).toBe(201);
        expect(user_signup_resp.data).toBeDefined();
        expect(user_signup_resp.data.id).toBeDefined();

        // Signup the admin
        const admin_signup_resp = await axios.post(`${BACKEND_URL}/api/v1/auth/signup`, {
            username: a_username,
            password,
            email: admin_email,
            role: "admin"
        });

        expect(admin_signup_resp.status).toBe(201);
        expect(admin_signup_resp.data).toBeDefined();
        expect(admin_signup_resp.data.id).toBeDefined();

        // Signin the user
        const user_signin_resp = await axios.post(`${BACKEND_URL}/api/v1/auth/signin`, {
            identifier: username,
            password
        });

        expect(user_signin_resp.status).toBe(200);
        expect(user_signin_resp.data).toBeDefined();

        expect(user_signin_resp.data.id).toBeDefined();
        expect(user_signin_resp.data.type).toBe("USER");
        expect(user_signin_resp.data.access_token).toBeDefined();
        expect(user_signin_resp.data.expires_in).toBeDefined();

        user_access_token = user_signin_resp.data.access_token; // get the access token

        const cookie = user_signin_resp.headers['set-cookie'];
        expect(cookie).toBeDefined();

        const refresh_token_cookie = cookie.find(c => c.startsWith('refresh_token='));
        expect(refresh_token_cookie).toBeDefined();
        user_refresh_token = refresh_token_cookie.split(';')[0].split('=')[1]; // get the refresh token from cookie

        expect(user_access_token).toBeDefined();
        expect(user_refresh_token).toBeDefined();

        // Signin the admin
        const admin_signin_resp = await axios.post(`${BACKEND_URL}/api/v1/auth/signin`, {
            identifier: a_username,
            password
        });

        expect(admin_signin_resp.status).toBe(200);
        expect(admin_signin_resp.data).toBeDefined();

        expect(admin_signin_resp.data.id).toBeDefined();
        expect(admin_signin_resp.data.type).toBe("ADMIN");
        expect(admin_signin_resp.data.access_token).toBeDefined();
        expect(admin_signin_resp.data.expires_in).toBeDefined();

        admin_access_token = admin_signin_resp.data.access_token;
        const a_cookie = admin_signin_resp.headers['set-cookie'];
        expect(a_cookie).toBeDefined();

        const a_refresh_token_cookie = a_cookie.find(c => c.startsWith('refresh_token='));
        expect(a_refresh_token_cookie).toBeDefined();
        admin_refresh_token = a_refresh_token_cookie.split(';')[0].split('=')[1];

        expect(admin_access_token).toBeDefined();
        expect(admin_refresh_token).toBeDefined();

        // Here we are done initializing the token values
    });

    test("user sign out should fail without refresh token", async () => {
        // Sign out the user without refresh token
        const signout_resp = await axios.post(`${BACKEND_URL}/api/v1/auth/signout`, {}, {
            headers: {
                Authorization: `Bearer ${user_access_token}`,
            },
        });

        expect(signout_resp.status).toBe(400);
    });

    test("user sign out should fail with wrong refresh token", async () => {
        // Sign out the user with wrong refresh token
        const signout_resp = await axios.post(`${BACKEND_URL}/api/v1/auth/signout`, {}, {
            headers: {
                Cookie: "refresh_token=" + Date.now() + "_" + process.hrtime.bigint(),
                Authorization: `Bearer ${user_access_token}`,
            },
        });

        expect(signout_resp.status).toBe(401);
    });

    test("admin sign out should fail without refresh token", async () => {
        // Sign out the admin without refresh token
        const signout_resp = await axios.post(`${BACKEND_URL}/api/v1/auth/signout`, {}, {
            headers: {
                Authorization: `Bearer ${admin_access_token}`,
            },
        });
        expect(signout_resp.status).toBe(400);
    });

    test("admin sign out should fail with wrong refresh token", async () => {
        // Sign out the admin with wrong refresh token
        const signout_resp = await axios.post(`${BACKEND_URL}/api/v1/auth/signout`, {}, {
            headers: {
                Cookie: `refresh_token=wrongtoken`,
                Authorization: `Bearer ${admin_access_token}`,
            },
        });
        expect(signout_resp.status).toBe(401);
    });
});