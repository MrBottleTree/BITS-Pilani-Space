const utils = require("../utils/testUtils");

const valid_password = "Password@123";

describe("signout success", () => {
    test("success for user role", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        let credentials = {username, password: valid_password, email, role: "USER"}
        const response = await utils.signup_user(credentials);

        expect(response.status).toBe(201);
        expect(response.data).toBeDefined();
        expect(response.data.id).toBeDefined();

        credentials['identifier'] = credentials.username;
        const signin_response = await utils.signin_user(credentials);

        expect(signin_response.status).toBe(200);
        expect(signin_response.data).toBeDefined();
        expect(signin_response.data.id).toBe(response.data.id);
        expect(signin_response.data.role).toBe('USER');
        expect(signin_response.data.access_token).toBeDefined();
        expect(signin_response.data.expires_in).toBeDefined();

        const resp_cookie = signin_response.headers["set-cookie"];
        expect(resp_cookie).toBeDefined();
        
        const refresh_token = resp_cookie.find(c => c.startsWith('refresh_token=')).split(';')[0].split('=')[1];;
        expect(refresh_token).toBeDefined();

        const signout_response = await utils.signout_user(refresh_token);

        expect(signout_response.status).toBe(204);
    });

    test("success for admin role", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        let credentials = {username, password: valid_password, email, role: "ADMIN"}
        const response = await utils.signup_user(credentials);

        expect(response.status).toBe(201);
        expect(response.data).toBeDefined();
        expect(response.data.id).toBeDefined();

        credentials['identifier'] = credentials.username;
        const signin_response = await utils.signin_user(credentials);

        expect(signin_response.status).toBe(200);
        expect(signin_response.data).toBeDefined();
        expect(signin_response.data.id).toBe(response.data.id);
        expect(signin_response.data.role).toBe('ADMIN');
        expect(signin_response.data.access_token).toBeDefined();
        expect(signin_response.data.expires_in).toBeDefined();

        const resp_cookie = signin_response.headers["set-cookie"];
        expect(resp_cookie).toBeDefined();
        
        const refresh_token = resp_cookie.find(c => c.startsWith('refresh_token=')).split(';')[0].split('=')[1];;
        expect(refresh_token).toBeDefined();

        const signout_response = await utils.signout_user(refresh_token);

        expect(signout_response.status).toBe(204);
    });
});

describe("signout fails with invalid refresh token", () => {
    test("fails for user role", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        let credentials = {username, password: valid_password, email, role: "USER"}
        const response = await utils.signup_user(credentials);

        expect(response.status).toBe(201);
        expect(response.data).toBeDefined();
        expect(response.data.id).toBeDefined();

        credentials['identifier'] = credentials.username;
        const signin_response = await utils.signin_user(credentials);

        expect(signin_response.status).toBe(200);
        expect(signin_response.data).toBeDefined();
        expect(signin_response.data.id).toBe(response.data.id);
        expect(signin_response.data.role).toBe('USER');
        expect(signin_response.data.access_token).toBeDefined();
        expect(signin_response.data.expires_in).toBeDefined();

        const resp_cookie = signin_response.headers["set-cookie"];
        expect(resp_cookie).toBeDefined();
        
        const refresh_token = resp_cookie.find(c => c.startsWith('refresh_token='));
        expect(refresh_token).toBeDefined();

        const signout_response = await utils.signout_user("random refresh token");

        expect(signout_response.status).toBe(401);
    });

    test("fails for admin role", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        let credentials = {username, password: valid_password, email, role: "ADMIN"}
        const response = await utils.signup_user(credentials);

        expect(response.status).toBe(201);
        expect(response.data).toBeDefined();
        expect(response.data.id).toBeDefined();

        credentials['identifier'] = credentials.username;
        const signin_response = await utils.signin_user(credentials);

        expect(signin_response.status).toBe(200);
        expect(signin_response.data).toBeDefined();
        expect(signin_response.data.id).toBe(response.data.id);
        expect(signin_response.data.role).toBe('ADMIN');
        expect(signin_response.data.access_token).toBeDefined();
        expect(signin_response.data.expires_in).toBeDefined();

        const resp_cookie = signin_response.headers["set-cookie"];
        expect(resp_cookie).toBeDefined();
        
        const refresh_token = resp_cookie.find(c => c.startsWith('refresh_token='));
        expect(refresh_token).toBeDefined();

        const signout_response = await utils.signout_user("random refresh token");

        expect(signout_response.status).toBe(401);
    });
});