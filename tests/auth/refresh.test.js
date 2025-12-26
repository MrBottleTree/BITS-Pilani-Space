const utils = require("../utils/testUtils");
const valid_password = "Password@123";

describe("refresh success", () => {
    const username = utils.makeUniqueUsername();
    
    const a_username = utils.makeUniqueUsername();

    const user_email = username + "@example.com";
    const admin_email = a_username + "@example.com";

    let user_access_token;
    let user_refresh_token;

    let admin_access_token;
    let admin_refresh_token;

    beforeAll( async () => {
        // Signup the user
        const user_signup_resp = await utils.signup_user({
            username,
            password: valid_password,
            email: user_email,
            role: "USER"
        });

        expect(user_signup_resp.status).toBe(201);
        expect(user_signup_resp.data).toBeDefined();
        expect(user_signup_resp.data.id).toBeDefined();

        // Signup the admin
        const admin_signup_resp = await utils.signup_user({
            username: a_username,
            password: valid_password,
            email: admin_email,
            role: "ADMIN"
        });

        expect(admin_signup_resp.status).toBe(201);
        expect(admin_signup_resp.data).toBeDefined();
        expect(admin_signup_resp.data.id).toBeDefined();

        // Signin the user
        const user_signin_resp = await utils.signin_user({
            identifier: username,
            password: valid_password
        });

        expect(user_signin_resp.status).toBe(200);
        expect(user_signin_resp.data).toBeDefined();

        expect(user_signin_resp.data.id).toBeDefined();
        expect(user_signin_resp.data.role).toBe("USER");
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
        const admin_signin_resp = await utils.signin_user({
            identifier: a_username,
            password: valid_password
        });

        expect(admin_signin_resp.status).toBe(200);
        expect(admin_signin_resp.data).toBeDefined();

        expect(admin_signin_resp.data.id).toBeDefined();
        expect(admin_signin_resp.data.role).toBe("ADMIN");
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

    test("user should be able to refresh token", async () => {
        // request new access token using refresh token
        const response = await utils.refresh_token(user_refresh_token);

        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
        expect(response.data.access_token).toBeDefined();
        expect(response.data.expires_in).toBeDefined();
    });

    test("admin should be able to refresh token", async () => {
        const response = await utils.refresh_token(admin_refresh_token);

        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
        expect(response.data.access_token).toBeDefined();
        expect(response.data.expires_in).toBeDefined();
    });
});

describe("refresh failure", () => {
    const username = utils.makeUniqueUsername();
    
    const a_username = utils.makeUniqueUsername();

    const user_email = username + "@example.com";
    const admin_email = a_username + "@example.com";

    let user_access_token;
    let user_refresh_token;

    let admin_access_token;
    let admin_refresh_token;

    beforeAll( async () => {
        // Signup the user
        const user_signup_resp = await utils.signup_user({
            username,
            password: valid_password,
            email: user_email,
            role: "USER"
        });

        expect(user_signup_resp.status).toBe(201);
        expect(user_signup_resp.data).toBeDefined();
        expect(user_signup_resp.data.id).toBeDefined();

        // Signup the admin
        const admin_signup_resp = await utils.signup_user({
            username: a_username,
            password: valid_password,
            email: admin_email,
            role: "ADMIN"
        });

        expect(admin_signup_resp.status).toBe(201);
        expect(admin_signup_resp.data).toBeDefined();
        expect(admin_signup_resp.data.id).toBeDefined();

        // Signin the user
        const user_signin_resp = await utils.signin_user({
            identifier: username,
            password: valid_password
        });

        expect(user_signin_resp.status).toBe(200);
        expect(user_signin_resp.data).toBeDefined();

        expect(user_signin_resp.data.id).toBeDefined();
        expect(user_signin_resp.data.role).toBe("USER");
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
        const admin_signin_resp = await utils.signin_user({
            identifier: a_username,
            password: valid_password
        });

        expect(admin_signin_resp.status).toBe(200);
        expect(admin_signin_resp.data).toBeDefined();

        expect(admin_signin_resp.data.id).toBeDefined();
        expect(admin_signin_resp.data.role).toBe("ADMIN");
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

    test("failure on missing refresh token", async () => {
        const response = await utils.refresh_token();
        expect(response.status).toBe(400);
    });

    test("failure on invalid refresh token", async () => {
        const response = await utils.refresh_token('invalid token');
        expect(response.status).toBe(401);
    });
});