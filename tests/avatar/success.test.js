const utils = require("../utils/testUtils.js");

const valid_password = "Password@123";
const image_path = "./cloud/image.png";

describe("Unit tests", () => {
    describe("POST", () => {
        test("Admin can upload avatar", async () => {
            const email = `${utils.makeUniqueUsername()}@something.com`;
            await utils.signup_user({
                name: "Test",
                email,
                password: valid_password,
                role: "ADMIN"
            });

            const response = await utils.signin_user({identifier: email, password: valid_password});
            const access_token = response.data.data.access_token;

            const image_response = await utils.uploadFileFromPath(image_path, access_token);

            const image_key = image_response.data.data.key;
            expect(image_key).toBeDefined();

            const avatar_resposne = await utils.upload_avatar(access_token, image_key, name="dog image");

            expect(avatar_resposne.status).toBe(utils.HTTP_STATUS.OK);
            const resp_data = avatar_resposne.data;
            expect(resp_data.message).toBe('Avatar added.');
            expect(resp_data.data).toBeDefined();
            expect(resp_data.data.avatar).toBeDefined();
            expect(resp_data.data.avatar.id).toBeDefined();
            const created_avatar = resp_data.data.avatar;

            expect(created_avatar.name).toBe('dog image');
            expect(created_avatar.image_key).toBe(image_key);
            expect(created_avatar.created_at).toBeDefined();
        });
    });

    describe("GET", () => {
        let avatarId1;
        let avatarId2;

        beforeAll(async () => {
            const email = `${utils.makeUniqueUsername()}@something.com`;
            await utils.signup_user({
                name: "Test",
                email,
                password: valid_password,
                role: "ADMIN"
            });

            const response = await utils.signin_user({identifier: email, password: valid_password});
            const access_token = response.data.data.access_token;

            const image_response = await utils.uploadFileFromPath(image_path, access_token);

            const image_key = image_response.data.data.key;
            const avatar_resposne1 = await utils.upload_avatar(access_token, image_key, name="dog image");

            avatarId1 = avatar_resposne1.data.data.avatar.id;
            const avatar_resposne2 = await utils.upload_avatar(access_token, image_key, name="dog image");
            avatarId2 = avatar_resposne2.data.data.avatar.id;
        });

        test("Anyone can get a specific avatar", async () => {
            const response = await utils.get_avatar(avatarId1);

            expect(response.status).toBe(utils.HTTP_STATUS.OK);
            expect(response.data).toBeDefined();
            expect(response.data.message).toBe("Avatar found.");

            const avatar1 = response.data.data.avatar;

            expect(avatar1).toBeDefined();
            expect(avatar1.id).toBeDefined();
            expect(avatar1.id).toBe(avatarId1);
            expect(avatar1.name).toBeDefined();
            expect(avatar1.image_key).toBeDefined();
            expect(avatar1.updated_at).toBeDefined();
            const response2 = await utils.get_avatar(avatarId2);

            expect(response2.status).toBe(utils.HTTP_STATUS.OK);
            expect(response2.data).toBeDefined();
            expect(response2.data.message).toBe("Avatar found.");
            
            const avatar12 = response2.data.data.avatar;

            expect(avatar12).toBeDefined();
            expect(avatar12.id).toBeDefined();
            expect(avatar12.id).toBe(avatarId2);
            expect(avatar12.name).toBeDefined();
            expect(avatar12.image_key).toBeDefined();
            expect(avatar12.updated_at).toBeDefined();
        });

        test("Anyone can get the list of all avatars", async () => {
            const response = await utils.get_all_avatar();
            expect(response.status).toBe(utils.HTTP_STATUS.OK);
            expect(response.data.data.avatars).toBeDefined();
            expect(response.data.data.count).toBeDefined();
        });
    });
});