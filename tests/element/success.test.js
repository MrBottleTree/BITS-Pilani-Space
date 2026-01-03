const utils = require("../utils/testUtils.js");
const valid_password = "Password@123";
const image_path = "./cloud/image.png";

async function signup_and_signin(){
    const email = `${utils.makeUniqueUsername()}@something.com`;
    await utils.signup_user({
        name: "Test",
        email,
        password: valid_password,
        role: "ADMIN"
    });

    const response = await utils.signin_user({ identifier: email, password: valid_password });
    return response;
}

describe("Unit tests", () => {
    test("Can add element", async () => {
        const signin_response = await signup_and_signin();

        const access_token = signin_response.data.data.access_token;
        expect(access_token).toBeDefined();

        const image_response = await utils.uploadFileFromPath(image_path, access_token);

        expect(image_response.status).toBe(utils.HTTP_STATUS.OK);
        const image_key = image_response.data.data.key;
        expect(image_key).toBeDefined();

        const element_response = await utils.addElement({
            name: "Test",
            image_key,
            height: 10,
            width: 20,
            static: true
        }, access_token);

        expect(element_response.status).toBe(utils.HTTP_STATUS.CREATED);

        const added_element = element_response.data;

        expect(added_element.message).toBe('Element created.');
        expect(added_element.data).toBeDefined();

        const element_data = added_element.data.element;

        expect(element_data.id).toBeDefined();

        expect(element_data.image_key).toBe(image_key);
        expect(element_data.static).toBe(true);
        expect(element_data.height).toBe(10);
        expect(element_data.width).toBe(20);
        expect(element_data.updated_at).toBeDefined();
    });

    test("Can view the added element", async () => {
        const signin_response = await signup_and_signin();

        const access_token = signin_response.data.data.access_token;
        expect(access_token).toBeDefined();

        const image_response = await utils.uploadFileFromPath(image_path, access_token);

        expect(image_response.status).toBe(utils.HTTP_STATUS.OK);
        const image_key = image_response.data.data.key;
        expect(image_key).toBeDefined();

        const element_response = await utils.addElement({
            name: "Test",
            image_key,
            height: 10,
            width: 20,
            static: true
        }, access_token);

        expect(element_response.status).toBe(utils.HTTP_STATUS.CREATED);

        const all_elements = await utils.getElement();

        expect(all_elements.status).toBe(utils.HTTP_STATUS.OK);
        const element_data = all_elements.data.data;
        expect(element_data).toBeDefined();

        expect(element_data.elements).toBeDefined();
        expect(element_data.elements).toContainEqual({
            id: element_response.data.data.element.id,
            image_key,
            name: "Test",
            static: true,
        });
    });
});