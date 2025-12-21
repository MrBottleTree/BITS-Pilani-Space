const axios = require("axios");

const BACKEND_URL = process.env.BACKEND_URL;
if (!BACKEND_URL) { // no backend URL, no tests
    throw new Error("BACKEND_URL environment variable is not defined");
}

describe("signup success", () => {
    test("user signup creates new user", async () => {
        const username = "test_user" + Date.now() + "_" + process.hrtime.bigint(); // This guy ensures uniqueness
        const password = username + " password@123"; // Random password
        const email = username + "@example.com";

        const response = await axios.post(`${BACKEND_URL}/api/v1/auth/signup`, {
            email,
            username,
            password,
            type: 0 // normal user type
        });

        expect(response.status).toBe(201);
        expect(response.data).toBeDefined();
        expect(response.data.id).toBeDefined();
    })

    test("admin signup creates new admin", async () => {
        const username = "test_admin" + Date.now() + "_" + process.hrtime.bigint();
        const password = username + " password@123";
        const email = username + "@example.com";

        const response = await axios.post(`${BACKEND_URL}/api/v1/auth/signup`, {
            email,
            username,
            password,
            type: 1 // admin user type
        });

        expect(response.status).toBe(201);
        expect(response.data).toBeDefined();
        expect(response.data.id).toBeDefined();
    })
})

describe("signup failure", () => {
    test("signup with existing username fails", async () => {
        const username = "test_user" + Date.now() + "_" + process.hrtime.bigint(); // Making sure that this is still unique
        const password = "password@123";
        const email = "test_user@example.com";

        // First signup a new user
        const first_response = await axios.post(`${BACKEND_URL}/api/v1/auth/signup`, {
            email,
            username,
            password,
            type: 0 // user type, this can be anything, even admin. Usernames should be unique throughout user and admin.
        });

        // Should be successful
        expect(first_response.status).toBe(201);
        expect(first_response.data).toBeDefined();
        expect(first_response.data.id).toBeDefined();
        
        // Check for user type first
        const user_response = await axios.post(`${BACKEND_URL}/api/v1/auth/signup`, {
            email,
            username,
            password,
            type: 0 // user type
        });

        expect(user_response.status).toBe(409); // Conflict
        expect(user_response.data).toBeDefined();
        expect(user_response.data.error).toBeDefined(); // Server should tell what the issue is

        // Now check for admin type

        const admin_response = await axios.post(`${BACKEND_URL}/auth/signup`, {
            email,
            username,
            password,
            type: 1 // admin type
        });

        expect(admin_response.status).toBe(409); // Conflict
        expect(admin_response.data).toBeDefined();
        expect(admin_response.data.error).toBeDefined(); // Server should tell what the issue is
    });

    test("signup with invalid email fails", async () => {
        const username = "test_user" + Date.now() + "_" + process.hrtime.bigint();
        const password = "password@123";
        const email = "invalid_email_format"; // Invalid email

        const response = await axios.post(`${BACKEND_URL}/api/v1/auth/signup`, {
            email,
            username,
            password,
            type: 0
        });

        expect(response.status).toBe(400); // Bad Request (wrong email format)
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
    });

    test("signup with weak password fails", async () => {
        const username = "test_user" + Date.now() + "_" + process.hrtime.bigint();
        const password = "123"; // Weak password

        const response = await axios.post(`${BACKEND_URL}/api/v1/auth/signup`, {
            email: username + "@example.com",
            username,
            password,
            type: 0
        });

        expect(response.status).toBe(400); // Bad Request (weak password)
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
    });

    test("signup with missing username fails", async () => {});

    test("signup with missing password fails", async () => {});

    test("signup with missing email fails", async () => {});

    test("signup with invalid user type fails", async () => {});

    test("signup with multiple missing fields fails", async () => {}); // All combinations of missing fields
});