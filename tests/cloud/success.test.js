const utils = require("../utils/testUtils.js");
const valid_password = "Password@123";
const image_path = "./cloud/image.png";

describe("Unit tests", () => {
    test("Can upload to cloud", async () => {
        const email = utils.makeUniqueUsername() + '@example.com';
        await utils.signup_user({name:"awdawd", email: email, password: valid_password, role:"ADMIN"});
        const signin_resp = await utils.signin_user({identifier: email, password: valid_password});
        const access_token = signin_resp.data.data.access_token;

        const response = await utils.uploadFileFromPath(image_path, access_token);
        expect(response.status).toBe(utils.HTTP_STATUS.OK);
        expect(response.data.message).toBeDefined();
        expect(response.data.data).toBeDefined();

        expect(response.data.message).toBe('Uploaded to cloud.');
        expect(response.data.data).toBeDefined();
        expect(response.data.data.key).toBeDefined();
    });
});