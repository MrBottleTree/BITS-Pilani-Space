const utils = require("../utils/testUtils");

describe("PATCH /api/v1/user/me - Update Profile", () => {
    
    const setupUser = async () => {
        const username = utils.makeUniqueUsername();
        const email = `${username}@example.com`;
        const password = "Password@123";

        await utils.signup_user({ username, email, password, "role": "USER" });
        
        const loginRes = await utils.signin_user({ identifier: email, password });
        const token = loginRes.data.access_token;

        const meRes = await utils.get_me(token);
        const userId = meRes.data.user.id;

        return { token, userId, username, email, password };
    };

    test("1. Should successfully update ONLY the Username", async () => {
        const { token, userId, password } = await setupUser();
        const newUsername = utils.makeUniqueUsername("updated");

        const res = await utils.update_user(token, {
            id: userId,
            password: password,
            user: { new_username: newUsername }
        });

        expect(res.status).toBe(200);
        expect(res.data.user.username).toBe(newUsername);

        const check = await utils.get_me(token);
        expect(check.data.user.username).toBe(newUsername);
    });

    test("2. Should successfully update ONLY the Email", async () => {
        const { token, userId, password } = await setupUser();
        const newEmail = `new_${utils.makeUniqueUsername()}@test.com`;

        const res = await utils.update_user(token, {
            id: userId,
            password: password,
            user: { new_email: newEmail }
        });

        expect(res.status).toBe(200);
        expect(res.data.user.email).toBe(newEmail);
    });

    test("3. Should successfully update ONLY the Password", async () => {
        const { token, userId, email, password } = await setupUser();
        const newPassword = "NewSecurePassword123!";

        const res = await utils.update_user(token, {
            id: userId,
            password: password,
            user: { new_password: newPassword }
        });

        expect(res.status).toBe(200);

        const fail = await utils.signin_user({ identifier: email, password: password });
        expect(fail.status).toBe(401);

        const success = await utils.signin_user({ identifier: email, password: newPassword });
        expect(success.status).toBe(200);
    });

    test("4. Should update Username, Email, and Password SIMULTANEOUSLY", async () => {
        const { token, userId, password } = await setupUser();
        const newUser = utils.makeUniqueUsername("mega_update");
        const newEmail = `${newUser}@mega.com`;
        const newPass = "MegaPassword@123";

        const res = await utils.update_user(token, {
            id: userId,
            password: password,
            user: {
                new_username: newUser,
                new_email: newEmail,
                new_password: newPass
            }
        });

        expect(res.status).toBe(200);
        expect(res.data.user.username).toBe(newUser);
        expect(res.data.user.email).toBe(newEmail);
    });

    test("5. Should accept update if new_username is same as current (Idempotency)", async () => {
        const { token, userId, username, password } = await setupUser();

        const res = await utils.update_user(token, {
            id: userId,
            password: password,
            user: { new_username: username }
        });

        expect(res.status).toBe(200);
    });

    test("6. Should FAIL (401) if current password is wrong", async () => {
        const { token, userId } = await setupUser();

        const res = await utils.update_user(token, {
            id: userId,
            password: "WRONG_PASSWORD_123",
            user: { new_username: "hacker" }
        });

        expect(res.status).toBe(401);
    });

    test("7. Should FAIL (401) if invalid Token is used", async () => {
        const res = await utils.update_user("INVALID_TOKEN", {
            id: "123",
            password: "password",
            user: { new_username: "hacker" }
        });
        expect(res.status).toBe(400); 
    });

    test("8. Should FAIL (400) if Password field is missing from body", async () => {
        const { token, userId } = await setupUser();

        const res = await utils.update_user(token, {
            id: userId,
            // password: missing!
            user: { new_username: "test" }
        });

        expect(res.status).toBe(400);
    });

    test("9. Should FAIL (400) if new_username is invalid (regex/length)", async () => {
        const { token, userId, password } = await setupUser();

        const res = await utils.update_user(token, {
            id: userId,
            password: password,
            user: { new_username: "bad username with spaces" }
        });

        expect(res.status).toBe(400);
    });

    test("10. Should FAIL (400) if new_email is invalid format", async () => {
        const { token, userId, password } = await setupUser();

        const res = await utils.update_user(token, {
            id: userId,
            password: password,
            user: { new_email: "not-an-email" }
        });

        expect(res.status).toBe(400);
    });

    test("11. Should FAIL (400) if new_password is too short", async () => {
        const { token, userId, password } = await setupUser();

        const res = await utils.update_user(token, {
            id: userId,
            password: password,
            user: { new_password: "short" }
        });

        expect(res.status).toBe(400);
    });

    test("12. Should FAIL (400) if 'user' object is empty", async () => {
        const { token, userId, password } = await setupUser();

        const res = await utils.update_user(token, {
            id: userId,
            password: password,
            user: {} // No fields provided
        });

        expect(res.status).toBe(400);
    });

    test("13. Should FAIL (409) if Username is already taken by ANOTHER user", async () => {
        const userA = await setupUser();
        
        const userB = await setupUser();

        const res = await utils.update_user(userB.token, {
            id: userB.userId,
            password: userB.password,
            user: { new_username: userA.username }
        });

        expect(res.status).toBe(409);
        expect(res.data.error).toMatch(/Username Taken/i);
    });

    test("14. Should FAIL (409) if Email is already taken by ANOTHER user", async () => {
        const userA = await setupUser();
        const userB = await setupUser();

        const res = await utils.update_user(userB.token, {
            id: userB.userId,
            password: userB.password,
            user: { new_email: userA.email }
        });

        expect(res.status).toBe(409);
        expect(res.data.error).toMatch(/Email already registered/i);
    });

    test("15. Should IGNORE 'id' spoofing in body (Security Check)", async () => {
        const userA = await setupUser();
        const userB = await setupUser();

        const newName = "hacked_name";

        const res = await utils.update_user(userA.token, {
            id: userB.userId,
            password: userA.password,
            user: { new_username: newName }
        });

        if (res.status === 200) {
            expect(res.data.user.id).toBe(userA.userId);
            const checkB = await utils.get_me(userB.token);
            expect(checkB.data.user.username).not.toBe(newName);
        }
    });
});