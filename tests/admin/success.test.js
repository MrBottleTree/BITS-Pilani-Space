const utils = require("../utils/testUtils.js");

const valid_password = "Password@123";

describe("Unit tests", () => {
    test("Batch deletion works", async() => {
        const email1 = utils.makeUniqueUsername() + '@something.com';
        const email2 = utils.makeUniqueUsername() + '@something.com';
        const email3 = utils.makeUniqueUsername() + '@something.com';
        const email4 = utils.makeUniqueUsername() + '@something.com';

        const res_1 = await utils.signup_user({name: "awdawd", email: email1, password: valid_password, role: "USER"})
        const res_2 = await utils.signup_user({name: "awdawd", email: email2, password: valid_password, role: "USER"})
        // This is an admin
        const res_3 = await utils.signup_user({name: "awdawd", email: email3, password: valid_password, role: "ADMIN"})

        const admin_signup = await utils.signup_user({name: "awdawd", email: email4, password: valid_password, role: "ADMIN"})

        const admin_signin = await utils.signin_user({identifier: email4, password: valid_password});

        const user_ids_to_delete = [
            res_1.data.data.user.id,
            res_2.data.data.user.id,
            res_3.data.data.user.id,
        ];

        const access_token = admin_signin.data.data.access_token;

        const deletion_response = await utils.batch_delete_users(access_token, {
            password: valid_password,
            user_ids: user_ids_to_delete
        });

        expect(deletion_response.status).toBe(utils.HTTP_STATUS.OK);
        const res_data = deletion_response.data;

        expect(res_data).toBeDefined();
        expect(res_data.message).toBe('Users deleted.');
        expect(res_data.data).toBeDefined();
        expect(res_data.data.requested_count).toBe(3);
        expect(res_data.data.deleted_count).toBe(2); // admins cant delete another admin
        expect(res_data.data.deleted_ids.length).toBe(2);
        expect(res_data.data.deleted_ids).toContain(user_ids_to_delete[0]);
        expect(res_data.data.deleted_ids).toContain(user_ids_to_delete[1]);
    });
});