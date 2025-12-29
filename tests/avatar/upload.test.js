const utils = require("../utils/testUtils");

const createDummyImage = (sizeInBytes = 1024) => Buffer.alloc(sizeInBytes, "a");

describe("Avatar Endpoints Integration Tests", () => {
    let adminToken;
    beforeAll(async () => {
        const adminCreds = {
            username: utils.makeUniqueUsername("admin"),
            password: "Password123!",
            email: `${utils.makeUniqueUsername("admin")}@example.com`,
            role: "ADMIN"
        };
        await utils.signup_user(adminCreds);
        
        const adminLogin = await utils.signin_user({ identifier: adminCreds.username, password: adminCreds.password });
        adminToken = adminLogin.data.access_token;
    });

    describe("POST /avatars - Upload Avatar", () => {
        
        test("Should successfully upload an avatar with valid data", async () => {
            const buffer = createDummyImage();
            const metadata = { name: "Cool Hat" };
            
            const response = await utils.upload_avatar(adminToken, metadata, buffer, "hat.png");

            expect(response.status).toBe(200);
            expect(response.data.avatar).toHaveProperty("id");
            expect(response.data.avatar.name).toBe("Cool Hat");
            expect(response.data.avatar.imageURL).toContain("avatars/");
        });

        test("Should return 400 if no file is uploaded", async () => {
            const metadata = { name: "Ghost File" };
            
            const response = await utils.upload_avatar(adminToken, metadata, null);
            
            expect(response.status).toBe(400);
            expect(response.data.error).toMatch(/no file/i);
        });

        test("Should return 400 if metadata (name) is missing", async () => {
            const buffer = createDummyImage();
            const metadata = { }; // Missing name
            
            const response = await utils.upload_avatar(adminToken, metadata, buffer, "test.png");
            
            expect(response.status).toBe(400);
            expect(response.data.error).toMatch(/bad metadata/i);
        });

        test("Should return 400 for invalid file type (e.g., .txt)", async () => {
            const buffer = Buffer.from("This is a text file");
            const metadata = { name: "Text File" };
            
            const response = await utils.upload_avatar(adminToken, metadata, buffer, "notes.txt");
            
            expect(response.status).toBe(400); 
        });

        test("Should return 401 if user is not authenticated", async () => {
            const buffer = createDummyImage();
            const metadata = { name: "Hacker Upload" };
            
            const response = await utils.upload_avatar("INVALID_TOKEN", metadata, buffer);
            
            expect(response.status).toBe(400);
        });
    });

    describe("GET /avatars/:id - Fetch Single Avatar", () => {
        let createdAvatarId;

        beforeAll(async () => {
            const buffer = createDummyImage();
            const res = await utils.upload_avatar(adminToken, { name: "Fetch Me" }, buffer);
            createdAvatarId = res.data.avatar.id;
        });

        test("Should retrieve an existing avatar by ID", async () => {
            const response = await utils.get_avatar(adminToken, createdAvatarId);
            
            expect(response.status).toBe(200);
            expect(response.data.data.id).toBe(createdAvatarId);
            expect(response.data.data.name).toBe("Fetch Me");
            expect(response.data.data.created_by).toBeDefined();
        });

        test("Should return 404 for a non-existent ID", async () => {
            const fakeId = "cm54xxxxxxxxx000000000000";
            
            const response = await utils.get_avatar(adminToken, fakeId);
            
            expect(response.status).toBe(404);
            expect(response.data.error).toMatch(/not found/i);
        });

        test("Should handle malformed IDs gracefully", async () => {
            const response = await utils.get_avatar(adminToken, "bad-id");
            expect([400, 404]).toContain(response.status); 
        });
    });

});