const axios = require("axios");

axios.defaults.validateStatus = () => true;

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
if (!BACKEND_URL) { // no backend URL, no tests
    throw new Error("BACKEND_URL environment variable is not defined");
}

describe("signup success", () => {
    test("user signup creates new user", async () => {
        const username = "Test" + Date.now() + "_" + process.hrtime.bigint();
        const password = username + " password@123";
        const email = username + "@example.com";

        const response = await axios.post(`${BACKEND_URL}/api/v1/auth/signup`, {
            email,
            username: username, // username max length is 20
            password,
            type: "user" // normal user type
        });

        expect(response.status).toBe(201);
        expect(response.data).toBeDefined();
        expect(response.data.id).toBeDefined();
    })

    test("admin signup creates new admin", async () => {
        const username = "Test" + Date.now() + "_" + process.hrtime.bigint();
        const password = username + " password@123";
        const email = username + "@example.com";

        const response = await axios.post(`${BACKEND_URL}/api/v1/auth/signup`, {
            email,
            username: username, // username max length is 20
            password,
            type: "admin" // normal user type
        });

        expect(response.status).toBe(201);
        expect(response.data).toBeDefined();
        expect(response.data.id).toBeDefined();    })
})

describe("signup failure", () => {
    test("signup with existing username fails", async () => {
        const username = "test_user" + Date.now() + "_" + process.hrtime.bigint(); // Making sure that this is still unique
        const password = "Password@123";
        const email = username + "@example.com";

        // First signup a new user
        const first_response = await axios.post(`${BACKEND_URL}/api/v1/auth/signup`, {
            email,
            username: username, // username max length is 20
            password,
            type: "user" // user type, this can be anything, even admin. Usernames should be unique throughout user and admin.
        });

        // Should be successful
        expect(first_response.status).toBe(201);
        expect(first_response.data).toBeDefined();
        expect(first_response.data.id).toBeDefined();
        
        // Check for user type first
        const user_response = await axios.post(`${BACKEND_URL}/api/v1/auth/signup`, {
            email,
            username: username,
            password,
            type: "user" // user type
        });

        expect(user_response.status).toBe(409); // Conflict
        expect(user_response.data).toBeDefined();
        expect(user_response.data.error).toBeDefined(); // Server should tell what the issue is

        // Now check for admin type

        const admin_response = await axios.post(`${BACKEND_URL}/api/v1/auth/signup`, {
            email,
            username: username, // username max length is 20
            password,
            type: "admin" // admin type
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
            username: username, // username max length is 20
            password,
            type: "user"
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
            username: username, // username max length is 20
            password,
            type: "user"
        });

        expect(response.status).toBe(400); // Bad Request (weak password)
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
    });

    // All combinations of missing testcases
    test("signup with multiple missing fields fails", async () => {
        const username = "test_user" + Date.now() + "_" + process.hrtime.bigint();
        const password = username + " password@123";
        const email = username + "@example.com";
        
        const fields = { email, username: username, password, type: "user" };
        const fieldNames = Object.keys(fields);
        const testCases = [];

        // Generate all possible combinations of missing fields (at least one missing)
        for (let i = 1; i <= Math.pow(2, fieldNames.length) - 2; i++) { // from 1 to 2^n - 2 inclusive... -2 because, 2^n -1 will be {1}*n times. we want to exclude some things, so i did this
            const testCase = {};
            for (let j = 0; j < fieldNames.length; j++) {
                if (i & (1 << j)) {
                    testCase[fieldNames[j]] = fields[fieldNames[j]];
                }
            }
            testCases.push(testCase);
        }

        for (const testCase of testCases) {
            const response = await axios.post(`${BACKEND_URL}/api/v1/auth/signup`, testCase);
            expect(response.status).toBe(400);
            expect(response.data).toBeDefined();
            expect(response.data.error).toBeDefined();
        }
    });
});