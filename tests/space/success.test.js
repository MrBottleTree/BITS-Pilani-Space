const utils = require("../utils/testUtils.js");
const image_path = "./cloud/image.png";

const valid_password = "Password@123";

describe("Unit tests", () => {
    test("User can add a space", async () => {
        const email = utils.makeUniqueUsername() + "@gmail.com";
        await utils.signup_user({
            name: "something",
            email,
            password: valid_password,
            role: "USER"
        });

        const signin_response = await utils.signin_user({identifier: email, password: valid_password});

        const access_token = (signin_response).data.data.access_token;

        const map_response = utils.add_map_workflow(image_path);
        const map_id = (await map_response).data.data.map.id;

        const space_response = await utils.addSpace({
            map_id,
            name: "Some user space"
        }, access_token);


        expect(space_response.status).toBe(utils.HTTP_STATUS.CREATED);
        
    });
});