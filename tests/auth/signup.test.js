const axios = require("axios");

axios.defaults.validateStatus = () => true;

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
if (!BACKEND_URL) { // no backend URL, no tests
    throw new Error("BACKEND_URL environment variable is not defined");
}

describe("signnup success", () => {
    test("user should be able to signup with valid credentials", async () => {});

    test("admin should be able to signup with valid credentials", async () => {});
});

describe("common signup failure", () => {
    test("should fail signup with missing type", async () => {});

    test("should fail signup with invalid type", async () => {});

    test("should fail signup with no fields", async () => {});
});

describe("user signup failure on missing fields", () => {
    test("should fail signup with missing username", async () => {});

    test("should fail signup with missing email", async () => {});

    test("should fail signup with missing password", async () => {});

});

describe("user signup failure on invalid username", () => {
    test("should fail signup with invalid username (less than minimum)", async () => {});

    test("should fail signup with invalid username (more than maximum)", async () => {});

    test("should fail signup with invalid username (invalid characters)", async () => {});
});

describe("user signup failure on invalid email", () => {
    test("should fail signup with invalid email (not an email)", async () => {});

    test("should fail signup with invalid email (more than maximum)", async () => {});
});

describe("user signup failure on invalid password", () => {
    test("should fail signup with invalid password (contains white space)", async () => {});

    test("should fail signup with invalid password (less than minimum)", async () => {});

    test("should fail signup with invalid password (more than maximum)", async () => {});

    test("should fail signup with invalid password (no uppercase letter)", async () => {});

    test("should fail signup with invalid password (no lowercase letter)", async () => {});

    test("should fail signup with invalid password (no number)", async () => {});

    test("should fail signup with invalid password (no special character)", async () => {});

    test("should fail signup with invalid password (if it contains control characters)", async () => {});
});

describe("admin signup failure", () => {
    // all testcases same except it is for admin
});