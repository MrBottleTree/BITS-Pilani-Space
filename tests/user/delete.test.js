const utils = require("../utils/testUtils");

describe("User Account Deletion", () => {
    let userData;
    let authToken;
    let userId;

    beforeEach(async () => {
        const uniqueSuffix = utils.makeUniqueUsername();
        userData = {
            username: `${uniqueSuffix}`,
            email: `${uniqueSuffix}@example.com`,
            password: "StrongPassword123!",
            role: "USER"
        };

        const signup_resp = await utils.signup_user(userData);

        userId = signup_resp.data.id

        const signin_resp = await utils.signin_user({
            identifier: userData.email,
            password: userData.password
        });
        
        authToken = signin_resp.data.access_token
    });

    test("Should successfully mark user deleted when ID and Password are correct", async () => {
        const payload = {
            id: userId,
            password: userData.password
        };

        const response = await utils.delete_user(authToken, payload);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty("deleted_at");
        expect(response.data.userId).toBe(userId);
    });

    test("Should fail if the Body ID does not match the Token ID", async () => {
        const payload = {
            id: "some_other_random_id",
            password: userData.password
        };

        const response = await utils.delete_user(authToken, payload);

        expect(response.status).toBe(400);
        expect(response.data.error).toMatch(/userid.*does not match/i);
    });

    test("Should return 401 if the password is incorrect", async () => {
        const payload = {
            id: userId,
            password: "WrongPassword123!"
        };

        const response = await utils.delete_user(authToken, payload);

        expect(response.status).toBe(401);
        expect(response.data.error).toMatch(/wrong password/i);
    });

    test("Should return 400 if ID or Password is missing in body", async () => {
        const resNoPass = await utils.delete_user(authToken, { id: userId });
        expect(resNoPass.status).toBe(400);

        const resNoId = await utils.delete_user(authToken, { password: userData.password });
        expect(resNoId.status).toBe(400);
    });

    test("Should return 400 (or 401) if token is invalid", async () => {
        const payload = {
            id: userId,
            password: userData.password
        };

        const response = await utils.delete_user("invalid.token.string", payload);

        expect(response.status).toBe(400); 
    });

    test("Should fail if the user is already deleted", async () => {
        const payload = { id: userId, password: userData.password };

        const firstRes = await utils.delete_user(authToken, payload);
        expect(firstRes.status).toBe(200);

        const secondRes = await utils.delete_user(authToken, payload);
        
        expect(secondRes.status).toBe(400);
        expect(secondRes.data.error).toMatch(/marked as deleted/i);
    });

    test("Should fail if the user has admin role", async () => {
        const uniqueSuffix = utils.makeUniqueUsername();
        userData = {
            username: `${uniqueSuffix}`,
            email: `${uniqueSuffix}@example.com`,
            password: "StrongPassword123!",
            role: "ADMIN"
        };

        const signup_resp = await utils.signup_user(userData);

        userId = signup_resp.data.id

        const signin_resp = await utils.signin_user({
            identifier: userData.email,
            password: userData.password
        });
        
        authToken = signin_resp.data.access_token

        const payload = { id: userId, password: userData.password };
        const response = await utils.delete_user(authToken, payload);
        expect(response.status).toBe(401);
    });
});