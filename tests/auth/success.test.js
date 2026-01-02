const utils = require("../utils/testUtils.js");

const valid_password = "Password@123";

const roles = ['USER', 'ADMIN']

describe("Unit tests", () => {
    test.each(roles)("Signup works", async (role) => {
        const email = `${utils.makeUniqueUsername()}@something.com`;
        const response = await utils.signup_user({
            name: "Test",
            email,
            password: valid_password,
            role
        });

        expect(response.status).toBe(utils.HTTP_STATUS.CREATED);
        const data = response.data;
        expect(data).toBeDefined();
        expect(data.message).toBe('User Created.');
        expect(data.data).toBeDefined();
        expect(data.data.user).toBeDefined();
        expect(data.data.user.id).toBeDefined();
        expect(data.data.user.handle).toBeDefined();
        expect(data.data.user.role).toBe(role);
        expect(data.data.user.name).toBe("Test");
        expect(data.data.user.email).toBe(email);
    });

    test.each(roles)("Signin works", async (role) => {
        const email = `${utils.makeUniqueUsername()}@something.com`;
        await utils.signup_user({
            name: "Test",
            email,
            password: valid_password,
            role
        });

        const response = await utils.signin_user({identifier: email, password: valid_password});
        expect(response.status).toBe(utils.HTTP_STATUS.OK);

        const data = response.data;

        expect(data).toBeDefined();
        expect(data.message).toBe('Refresh token created.');
        
        expect(data.data.user).toBeDefined();
        expect(data.data.access_token).toBeDefined();
        expect(data.data.expires_in).toBeDefined();

        const user = data.data.user;

        expect(user.id).toBeDefined();
        expect(user.handle).toBeDefined();
        expect(user.name).toBe("Test");
        expect(user.email).toBe(email);
        expect(user.role).toBe(role);

        // get that refresh token
        expect(response.headers['set-cookie']).toBeDefined();
        expect(
            response.headers['set-cookie'].some(h => h.includes('refresh_token='))
        ).toBe(true);
    });

    test.each(roles)("Refresh works", async (role) => {
        const email = `${utils.makeUniqueUsername()}@something.com`;
        await utils.signup_user({
            name: "Test",
            email,
            password: valid_password,
            role
        });

        const response = await utils.signin_user({identifier: email, password: valid_password});
        const access_token = response.data.data.access_token;
        const refresh_token = response.headers['set-cookie'].find(c => c.startsWith('refresh_token=')).split('=')[1].split(';')[0];

        expect(access_token).toBeDefined();
        expect(refresh_token).toBeDefined();

        const refresh_response = await utils.refresh_token(refresh_token);
        expect(refresh_response.status).toBe(utils.HTTP_STATUS.OK);
        expect(refresh_response.data.message).toBe('Access Token refreshed.');
        expect(refresh_response.data.data).toBeDefined();
        expect(refresh_response.data.data.access_token).toBeDefined();
        expect(refresh_response.data.data.expires_in).toBeDefined();
    });

    test.each(roles)("Signout works", async (role) => {
        const email = `${utils.makeUniqueUsername()}@something.com`;
        await utils.signup_user({
            name: "Test",
            email,
            password: valid_password,
            role
        });
        const response = await utils.signin_user({identifier: email, password: valid_password});
        const refresh_token = response.headers['set-cookie'].find(c => c.startsWith('refresh_token=')).split('=')[1].split(';')[0];

        const signout_response = await utils.signout_user(refresh_token);
        expect(signout_response.status).toBe(utils.HTTP_STATUS.NO_CONTENT);
    });
});