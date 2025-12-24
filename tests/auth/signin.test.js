const utils = require("../utils/testUtils");
const valid_password = "Password@123";

describe("signin successful", () => {
    test("user should be able to signin", async () => {
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
    });

    test("admin should be able to signin", async () => {
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
    });
});

// things like missing identifier and missing password
describe("common signin failure", () => {
    test("missing password failure for user", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        let credentials = {username, password: valid_password, email, role: "USER"}
        const response = await utils.signup_user(credentials);

        expect(response.status).toBe(201);
        expect(response.data).toBeDefined();
        expect(response.data.id).toBeDefined();

        const signin_response = await utils.signin_user({identifier: "wrong username"});

        expect(signin_response.status).toBe(400);
        expect(signin_response.data).toBeDefined();
        expect(signin_response.data.error).toBeDefined();
    });

    test("missing identifier failure for user", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        let credentials = {username, password: valid_password, email, role: "USER"}
        const response = await utils.signup_user(credentials);

        expect(response.status).toBe(201);
        expect(response.data).toBeDefined();
        expect(response.data.id).toBeDefined();

        const signin_response = await utils.signin_user({password: valid_password});

        expect(signin_response.status).toBe(400);
        expect(signin_response.data).toBeDefined();
        expect(signin_response.data.error).toBeDefined();
    });

    test("missing password failure for admin", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        let credentials = {username, password: valid_password, email, role: "ADMIN"}
        const response = await utils.signup_user(credentials);

        expect(response.status).toBe(201);
        expect(response.data).toBeDefined();
        expect(response.data.id).toBeDefined();

        const signin_response = await utils.signin_user({identifier: "wrong username"});

        expect(signin_response.status).toBe(400);
        expect(signin_response.data).toBeDefined();
        expect(signin_response.data.error).toBeDefined();
    });

    test("missing identifier failure for admin", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        let credentials = {username, password: valid_password, email, role: "ADMIN"}
        const response = await utils.signup_user(credentials);

        expect(response.status).toBe(201);
        expect(response.data).toBeDefined();
        expect(response.data.id).toBeDefined();

        const signin_response = await utils.signin_user({password: valid_password});

        expect(signin_response.status).toBe(400);
        expect(signin_response.data).toBeDefined();
        expect(signin_response.data.error).toBeDefined();
    });
});

describe("wrong credentials fails for user", () => {
    test("wrong username as identifier should fail", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        let credentials = {username, password: valid_password, email, role: "USER"}
        const response = await utils.signup_user(credentials);

        expect(response.status).toBe(201);
        expect(response.data).toBeDefined();
        expect(response.data.id).toBeDefined();

        credentials['identifier'] = "wrong username";
        const signin_response = await utils.signin_user(credentials);

        expect(signin_response.status).toBe(401);
        expect(signin_response.data).toBeDefined();
        expect(signin_response.data.error).toBeDefined();
    });

    test("wrong email as identifier should fail", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        let credentials = {username, password: valid_password, email, role: "USER"}
        const response = await utils.signup_user(credentials);

        expect(response.status).toBe(201);
        expect(response.data).toBeDefined();
        expect(response.data.id).toBeDefined();

        credentials['identifier'] = "wrong email";
        const signin_response = await utils.signin_user(credentials);

        expect(signin_response.status).toBe(401);
        expect(signin_response.data).toBeDefined();
        expect(signin_response.data.error).toBeDefined();
    });

    test("wrong password should fail", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        let credentials = {username, password: valid_password, email, role: "USER"}
        const response = await utils.signup_user(credentials);

        expect(response.status).toBe(201);
        expect(response.data).toBeDefined();
        expect(response.data.id).toBeDefined();

        const signin_response = await utils.signin_user({identifier: username, password: "Wrongpassword@123"});

        expect(signin_response.status).toBe(401);
        expect(signin_response.data).toBeDefined();
        expect(signin_response.data.error).toBeDefined();
    });
});

describe("wrong credentials fails for admin", () => {
    test("wrong username as identifier should fail", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        let credentials = {username, password: valid_password, email, role: "ADMIN"}
        const response = await utils.signup_user(credentials);

        expect(response.status).toBe(201);
        expect(response.data).toBeDefined();
        expect(response.data.id).toBeDefined();

        credentials['identifier'] = "wrong username";
        const signin_response = await utils.signin_user(credentials);

        expect(signin_response.status).toBe(401);
        expect(signin_response.data).toBeDefined();
        expect(signin_response.data.error).toBeDefined();
    });

    test("wrong email as identifier should fail", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        let credentials = {username, password: valid_password, email, role: "ADMIN"}
        const response = await utils.signup_user(credentials);

        expect(response.status).toBe(201);
        expect(response.data).toBeDefined();
        expect(response.data.id).toBeDefined();

        credentials['identifier'] = "wrong email";
        const signin_response = await utils.signin_user(credentials);

        expect(signin_response.status).toBe(401);
        expect(signin_response.data).toBeDefined();
        expect(signin_response.data.error).toBeDefined();
    });

    test("wrong password should fail", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        let credentials = {username, password: valid_password, email, role: "ADMIN"}
        const response = await utils.signup_user(credentials);

        expect(response.status).toBe(201);
        expect(response.data).toBeDefined();
        expect(response.data.id).toBeDefined();

        const signin_response = await utils.signin_user({identifier: username, password: "Wrongpassword@123"});

        expect(signin_response.status).toBe(401);
        expect(signin_response.data).toBeDefined();
        expect(signin_response.data.error).toBeDefined();
    });
});

describe("field violation for user", () => {
    test("identifier max length violation for user", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        let credentials = {username, password: valid_password, email, role: "USER"}
        const response = await utils.signup_user(credentials);

        expect(response.status).toBe(201);
        expect(response.data).toBeDefined();
        expect(response.data.id).toBeDefined();

        credentials['identifier'] = email.repeat(50);
        const signin_response = await utils.signin_user(credentials);

        expect(signin_response.status).toBe(400);
        expect(signin_response.data).toBeDefined();
        expect(signin_response.data.error).toBeDefined();
    });

    test("password max length violation for user", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        let credentials = {username, password: valid_password, email, role: "USER"}
        const response = await utils.signup_user(credentials);

        expect(response.status).toBe(201);
        expect(response.data).toBeDefined();
        expect(response.data.id).toBeDefined();

        credentials['identifier'] = email;
        credentials['password'] = email.repeat(50);

        const signin_response = await utils.signin_user(credentials);

        expect(signin_response.status).toBe(400);
        expect(signin_response.data).toBeDefined();
        expect(signin_response.data.error).toBeDefined();
    })
});

describe("field violation for admin", () => {
    test("identifier max length violation for admin", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        let credentials = {username, password: valid_password, email, role: "ADMIN"}
        const response = await utils.signup_user(credentials);

        expect(response.status).toBe(201);
        expect(response.data).toBeDefined();
        expect(response.data.id).toBeDefined();

        credentials['identifier'] = email.repeat(50);
        const signin_response = await utils.signin_user(credentials);

        expect(signin_response.status).toBe(400);
        expect(signin_response.data).toBeDefined();
        expect(signin_response.data.error).toBeDefined();
    });

    test("password max length violation for admin", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        let credentials = {username, password: valid_password, email, role: "ADMIN"}
        const response = await utils.signup_user(credentials);

        expect(response.status).toBe(201);
        expect(response.data).toBeDefined();
        expect(response.data.id).toBeDefined();

        credentials['identifier'] = email;
        credentials['password'] = email.repeat(50);

        const signin_response = await utils.signin_user(credentials);

        expect(signin_response.status).toBe(400);
        expect(signin_response.data).toBeDefined();
        expect(signin_response.data.error).toBeDefined();
    })
});