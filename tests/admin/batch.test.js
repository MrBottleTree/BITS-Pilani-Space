const utils = require("../utils/testUtils");

describe("Admin Batch Deletion", () => {
    let adminToken;
    let adminUserId;
    const adminPassword = "AdminPassword123!";

    beforeAll(async () => {
        const adminCreds = {
            username: utils.makeUniqueUsername("admin"),
            email: `${utils.makeUniqueUsername("admin")}@example.com`,
            password: adminPassword,
            role: "ADMIN"
        };

        // Sign up as admin
        await utils.signup_user(adminCreds);

        const signinRes = await utils.signin_user({
            identifier: adminCreds.email,
            password: adminCreds.password
        });

        adminToken = signinRes.data.access_token;
        adminUserId = signinRes.data.id;
    });

    test("should fail if no auth token is provided", async () => {
        const payload = {
            userIds: ["some-uuid"],
            password: adminPassword,
            id: adminUserId
        };

        const response = await utils.batch_delete_users("", payload);

        expect(response.status).toBe(400);
    });

    test("should fail if a regular user tries to batch delete", async () => {
        const userCreds = {
            username: utils.makeUniqueUsername("hacker"),
            email: `${utils.makeUniqueUsername("hacker")}@example.com`,
            password: "Password123!",
            role: "USER"
        };
        await utils.signup_user(userCreds);
        const signinRes = await utils.signin_user({"identifier": userCreds.username, "password": userCreds.password});
        const userToken = signinRes.data.access_token;
        const userID = signinRes.data.id;

        const response = await utils.batch_delete_users(userToken, {
            userIds: ["some-uuid"],
            password: userCreds.password,
            id: userID
        });

        expect(response.status).toBe(401);
    });

    test("should fail if validation fails (missing userIds)", async () => {
        const payload = {
            password: adminPassword,
            id: adminUserId
            // missing userIds
        };

        const response = await utils.batch_delete_users(adminToken, payload);
        
        expect(response.status).toBe(400);
    });

    test("should fail if userIds array is empty", async () => {
        const payload = {
            userIds: [],
            password: adminPassword,
            id: adminUserId
        };

        const response = await utils.batch_delete_users(adminToken, payload);
        
        expect(response.status).toBe(400);
    });

    test("should fail if Admin provides incorrect confirmation password", async () => {
        const payload = {
            userIds: ["550e8400-e29b-41d4-a716-446655440000"],
            password: "WrongPassword123!",
            id: adminUserId
        };

        const response = await utils.batch_delete_users(adminToken, payload);
        
        expect(response.status).toBe(401);
    });

    test("should successfully soft-delete multiple valid users", async () => {
        // Create 3 victims
        const victims = [];
        for (let i = 0; i < 3; i++) {
            const creds = {
                username: utils.makeUniqueUsername("victim"),
                email: `${utils.makeUniqueUsername("victim")}@example.com`,
                password: "Password123!",
                role: "USER"
            };
            const res = await utils.signup_user(creds);
            victims.push(res.data.id);
        }

        // 2. Admin deletes them
        const payload = {
            userIds: victims,
            password: adminPassword,
            id: adminUserId
        };

        const response = await utils.batch_delete_users(adminToken, payload);

        expect(response.status).toBe(200);
        expect(response.data.deletedCount).toBe(3);
        expect(response.data.deletedIds).toEqual(expect.arrayContaining(victims));
    });

    test("should silently ignore invalid IDs (partial success)", async () => {
        // Create 1 real user
        const creds = {
            username: utils.makeUniqueUsername("real"),
            email: `${utils.makeUniqueUsername("real")}@example.com`,
            password: "Password123!",
            role: "USER"
        };
        const res = await utils.signup_user(creds);
        const realId = res.data.id;
        const fakeId = "00000000-0000-0000-0000-000000000000";

        // Try to delete Real + Fake
        const payload = {
            userIds: [realId, fakeId],
            password: adminPassword,
            id: adminUserId
        };

        const response = await utils.batch_delete_users(adminToken, payload);

        expect(response.status).toBe(200);
        // Should only delete the 1 real user
        expect(response.data.deletedCount).toBe(1);
        expect(response.data.deletedIds).toContain(realId);
        expect(response.data.deletedIds).not.toContain(fakeId);
    });

    test("should PROTECT the Admin (Admin cannot delete themselves)", async () => {
        // Create a regular user to mix in
        const creds = {
            username: utils.makeUniqueUsername("mix"),
            email: `${utils.makeUniqueUsername("mix")}@example.com`,
            password: "Password123!",
            role: "USER"
        };
        const res = await utils.signup_user(creds);
        const userId = res.data.id;

        // Admin tries to delete User + THEMSELVES
        const payload = {
            userIds: [userId, adminUserId],
            password: adminPassword,
            id: adminUserId
        };

        const response = await utils.batch_delete_users(adminToken, payload);

        expect(response.status).toBe(200);
        expect(response.data.deletedCount).toBe(1);
        expect(response.data.deletedIds).toContain(userId);
        expect(response.data.deletedIds).not.toContain(adminUserId);
    });

    test("should PROTECT other Admins (Admin cannot delete other Admins)", async () => {
        // Create a SECOND Admin
        const admin2Creds = {
            username: utils.makeUniqueUsername("admin2"),
            email: `${utils.makeUniqueUsername("admin2")}@example.com`,
            password: "Password123!",
            role: "ADMIN"
        };
        const res = await utils.signup_user(admin2Creds);
        const admin2Id = res.data.id;

        // First Admin tries to delete Second Admin
        const payload = {
            userIds: [admin2Id],
            password: adminPassword,
            id: adminUserId
        };

        const response = await utils.batch_delete_users(adminToken, payload);

        // Should return 200 OK (request processed) but 0 deletions
        expect(response.status).toBe(200);
        expect(response.data.deletedCount).toBe(0);
        expect(response.data.deletedIds).toHaveLength(0);
    });

    test("deleting already deleted users does nothing", async () => {
        // Create and Delete a User
        const creds = {
            username: utils.makeUniqueUsername("redo"),
            email: `${utils.makeUniqueUsername("redo")}@example.com`,
            password: "Password123!",
            role: "USER"
        };
        const res = await utils.signup_user(creds);
        const userId = res.data.id;
        const payload = { userIds: [userId], password: adminPassword, id: adminUserId };

        await utils.batch_delete_users(adminToken, payload);

        // 2. Try to Delete same user AGAIN
        const response = await utils.batch_delete_users(adminToken, payload);

        expect(response.status).toBe(200);
        expect(response.data.deletedCount).toBe(0);
        expect(response.data.deletedIds).toEqual([]);
    });

    test("Deleted users should not be able to sign in", async () => {
        const creds = {
            username: utils.makeUniqueUsername("logincheck"),
            email: `${utils.makeUniqueUsername("logincheck")}@example.com`,
            password: "Password123!",
            role: "USER"
        };
        const res = await utils.signup_user(creds);
        const userId = res.data.id;

        // Delete User
        await utils.batch_delete_users(adminToken, {
            userIds: [userId],
            password: adminPassword
        });

        // Attempt Login
        const loginRes = await utils.signin_user({
            email: creds.email,
            password: creds.password
        });

        // Should fail
        expect(loginRes.status).not.toBe(200);
    });
});