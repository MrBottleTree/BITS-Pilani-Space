const axios = require("axios");

const BACKEND_URL = process.env.BACKEND_URL;
if (!BACKEND_URL) { // no backend URL, no tests
    throw new Error("BACKEND_URL environment variable is not defined");
}

describe("signup", () => {
    test("user signup creates new user", async () => {
        const username = "test_user" + Date.now() + "_" + process.hrtime.bigint(); // This guy ensures uniqueness
        const password = username + " password@123"; // Random password
        const email = username + "@example.com";

        const response = await axios.post(`${BACKEND_URL}/auth/signup`, {
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

        const response = await axios.post(`${BACKEND_URL}/auth/signup`, {
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