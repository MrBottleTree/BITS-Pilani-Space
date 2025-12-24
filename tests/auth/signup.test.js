const utils = require("../utils/testUtils");

const valid_password = "Password@123";

describe("signnup success", () => {
    test("user should be able to signup with valid credentials", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        const response = await utils.signup_user({
            username,
            password: valid_password,
            email,
            role: "USER"
        });

        expect(response.status).toBe(201);
        expect(response.data).toBeDefined();
        expect(response.data.id).toBeDefined();
    });

    test("admin should be able to signup with valid credentials", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        const response = await utils.signup_user({
            username,
            password: valid_password,
            email,
            role: "ADMIN"
        });

        expect(response.status).toBe(201);
        expect(response.data).toBeDefined();
        expect(response.data.id).toBeDefined();
    });
});

describe("common signup failure", () => {
    test("should fail signup with missing role", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        const response = await utils.signup_user({
            username,
            password: valid_password,
            email,
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });

    test("should fail signup with invalid role", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        const response = await utils.signup_user({
            username,
            password: valid_password,
            email,
            role: "something"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });

    test("should fail signup with no fields", async () => {
        expect((await utils.signup_user({})).status).toBe(400);
    });
});

describe("user signup failure on missing fields", () => {
    test("should fail signup with missing username", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        const response = await utils.signup_user({
            password: valid_password,
            email,
            role: "USER"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });

    test("should fail signup with missing email", async () => {
        const username = utils.makeUniqueUsername();

        const response = await utils.signup_user({
            username,
            password: valid_password,
            role: "USER"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });

    test("should fail signup with missing password", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        const response = await utils.signup_user({
            username,
            email,
            role: "USER"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });

});

describe("user signup failure on invalid username", () => {
    test("should fail signup with invalid username (less than minimum)", async () => {
        const username = utils.makeUniqueUsername().substring(0,2);
        const email = username + "@example.com";

        const response = await utils.signup_user({
            username,
            password: valid_password,
            email,
            role: "USER"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });

    test("should fail signup with invalid username (more than maximum)", async () => {
        const username = utils.makeUniqueUsername().repeat(2);
        const email = username + "@example.com";

        const response = await utils.signup_user({
            username,
            password: valid_password,
            email,
            role: "USER"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });

    test("should fail signup with invalid username (invalid characters)", async () => {
        const username = utils.makeUniqueUsername() + "!";
        const email = username + "@example.com";

        const response = await utils.signup_user({
            username,
            password: valid_password,
            email,
            role: "USER"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });
});

describe("user signup failure on invalid email", () => {
    test("should fail signup with invalid email (not an email)", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "!@@example.com";

        const response = await utils.signup_user({
            username,
            password: valid_password,
            email,
            role: "USER"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });

    test("should fail signup with invalid email (more than maximum)", async () => {
        const username = utils.makeUniqueUsername();
        const email = username.repeat(150) + "@example.com";

        const response = await utils.signup_user({
            username,
            password: valid_password,
            email,
            role: "USER"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });
});

describe("user signup failure on invalid password", () => {
    test("should fail signup with invalid password (contains white space)", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        const response = await utils.signup_user({
            username,
            password: valid_password + ' ',
            email,
            role: "USER"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });

    test("should fail signup with invalid password (less than minimum)", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        const response = await utils.signup_user({
            username,
            password: "awd",
            email,
            role: "USER"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });

    test("should fail signup with invalid password (more than maximum)", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        const response = await utils.signup_user({
            username,
            password: valid_password.repeat(20),
            email,
            role: "USER"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });

    test("should fail signup with invalid password (no uppercase letter)", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        const response = await utils.signup_user({
            username,
            password: "password@123",
            email,
            role: "USER"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });

    test("should fail signup with invalid password (no lowercase letter)", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        const response = await utils.signup_user({
            username,
            password: "PASSWORD@123",
            email,
            role: "USER"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });

    test("should fail signup with invalid password (no number)", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        const response = await utils.signup_user({
            username,
            password: "Passwordawd@@",
            email,
            role: "USER"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });

    test("should fail signup with invalid password (no special character)", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        const response = await utils.signup_user({
            username,
            password: "Password123",
            email,
            role: "USER"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });

    test("should fail signup with invalid password (if it contains control characters)", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        const response = await utils.signup_user({
            username,
            password: `GoodPass1!\x01`,
            email,
            role: "USER"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });
});

describe("admin signup failure on missing fields", () => {
    test("should fail signup with missing username", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        const response = await utils.signup_user({
            password: valid_password,
            email,
            role: "ADMIN"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });

    test("should fail signup with missing email", async () => {
        const username = utils.makeUniqueUsername();

        const response = await utils.signup_user({
            username,
            password: valid_password,
            role: "ADMIN"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });

    test("should fail signup with missing password", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        const response = await utils.signup_user({
            username,
            email,
            role: "ADMIN"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });

});

describe("admin signup failure on invalid username", () => {
    test("should fail signup with invalid username (less than minimum)", async () => {
        const username = utils.makeUniqueUsername().substring(0,2);
        const email = username + "@example.com";

        const response = await utils.signup_user({
            username,
            password: valid_password,
            email,
            role: "ADMIN"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });

    test("should fail signup with invalid username (more than maximum)", async () => {
        const username = utils.makeUniqueUsername().repeat(2);
        const email = username + "@example.com";

        const response = await utils.signup_user({
            username,
            password: valid_password,
            email,
            role: "ADMIN"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });

    test("should fail signup with invalid username (invalid characters)", async () => {
        const username = utils.makeUniqueUsername() + "!";
        const email = username + "@example.com";

        const response = await utils.signup_user({
            username,
            password: valid_password,
            email,
            role: "ADMIN"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });
});

describe("admin signup failure on invalid email", () => {
    test("should fail signup with invalid email (not an email)", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "!@@example.com";

        const response = await utils.signup_user({
            username,
            password: valid_password,
            email,
            role: "ADMIN"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });

    test("should fail signup with invalid email (more than maximum)", async () => {
        const username = utils.makeUniqueUsername();
        const email = username.repeat(15) + "@example.com";

        const response = await utils.signup_user({
            username,
            password: valid_password,
            email,
            role: "ADMIN"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });
});

describe("admin signup failure on invalid password", () => {
    test("should fail signup with invalid password (contains white space)", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        const response = await utils.signup_user({
            username,
            password: valid_password + ' ',
            email,
            role: "ADMIN"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });

    test("should fail signup with invalid password (less than minimum)", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        const response = await utils.signup_user({
            username,
            password: "awd",
            email,
            role: "ADMIN"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });

    test("should fail signup with invalid password (more than maximum)", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        const response = await utils.signup_user({
            username,
            password: valid_password.repeat(20),
            email,
            role: "ADMIN"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });

    test("should fail signup with invalid password (no uppercase letter)", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        const response = await utils.signup_user({
            username,
            password: "password@123",
            email,
            role: "ADMIN"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });

    test("should fail signup with invalid password (no lowercase letter)", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        const response = await utils.signup_user({
            username,
            password: "PASSWORD@123",
            email,
            role: "ADMIN"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });

    test("should fail signup with invalid password (no number)", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        const response = await utils.signup_user({
            username,
            password: "Passwordawd@@",
            email,
            role: "ADMIN"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });

    test("should fail signup with invalid password (no special character)", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        const response = await utils.signup_user({
            username,
            password: "Password123",
            email,
            role: "ADMIN"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });

    test("should fail signup with invalid password (if it contains control characters)", async () => {
        const username = utils.makeUniqueUsername();
        const email = username + "@example.com";

        const response = await utils.signup_user({
            username,
            password: `GoodPass1!\x01`,
            email,
            role: "ADMIN"
        });

        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();
        expect(response.data.details).toBeDefined();
    });
});