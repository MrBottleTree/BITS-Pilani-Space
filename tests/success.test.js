const utils = require("./utils/testUtils.js");

const valid_password = "Password@123";
const image_path = "./utils/image.png";
const roles = ['USER', 'ADMIN']

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

describe("Admin Unit tests", () => {
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

describe("Auth Unit tests", () => {
    test.each(roles)("Signup works", async (role) => {
        const email = `${utils.makeUniqueUsername()}@something.com`;
        const response = await utils.signup_user({
            name: "Test",
            email,
            password: valid_password,
            role
        });

        expect(response.status).toBe(utils.HTTP_STATUS.CREATED);
        const data = response.data;
        expect(data).toBeDefined();
        expect(data.message).toBe('User Created.');
        expect(data.data).toBeDefined();
        expect(data.data.user).toBeDefined();
        expect(data.data.user.id).toBeDefined();
        expect(data.data.user.handle).toBeDefined();
        expect(data.data.user.role).toBe(role);
        expect(data.data.user.name).toBe("Test");
        expect(data.data.user.email).toBe(email);
    });

    test.each(roles)("Signin works", async (role) => {
        const email = `${utils.makeUniqueUsername()}@something.com`;
        await utils.signup_user({
            name: "Test",
            email,
            password: valid_password,
            role
        });

        const response = await utils.signin_user({identifier: email, password: valid_password});
        expect(response.status).toBe(utils.HTTP_STATUS.OK);

        const data = response.data;

        expect(data).toBeDefined();
        expect(data.message).toBe('Refresh token created.');
        
        expect(data.data.user).toBeDefined();
        expect(data.data.access_token).toBeDefined();
        expect(data.data.expires_in).toBeDefined();

        const user = data.data.user;

        expect(user.id).toBeDefined();
        expect(user.handle).toBeDefined();
        expect(user.name).toBe("Test");
        expect(user.email).toBe(email);
        expect(user.role).toBe(role);

        // get that refresh token
        expect(response.headers['set-cookie']).toBeDefined();
        expect(
            response.headers['set-cookie'].some(h => h.includes('refresh_token='))
        ).toBe(true);
    });

    test.each(roles)("Refresh works", async (role) => {
        const email = `${utils.makeUniqueUsername()}@something.com`;
        await utils.signup_user({
            name: "Test",
            email,
            password: valid_password,
            role
        });

        const response = await utils.signin_user({identifier: email, password: valid_password});
        const access_token = response.data.data.access_token;
        const refresh_token = response.headers['set-cookie'].find(c => c.startsWith('refresh_token=')).split('=')[1].split(';')[0];

        expect(access_token).toBeDefined();
        expect(refresh_token).toBeDefined();

        const refresh_response = await utils.refresh_token(refresh_token);
        expect(refresh_response.status).toBe(utils.HTTP_STATUS.OK);
        expect(refresh_response.data.message).toBe('Access Token refreshed.');
        expect(refresh_response.data.data).toBeDefined();
        expect(refresh_response.data.data.access_token).toBeDefined();
        expect(refresh_response.data.data.expires_in).toBeDefined();
    });

    test.each(roles)("Signout works", async (role) => {
        const email = `${utils.makeUniqueUsername()}@something.com`;
        await utils.signup_user({
            name: "Test",
            email,
            password: valid_password,
            role
        });
        const response = await utils.signin_user({identifier: email, password: valid_password});
        const refresh_token = response.headers['set-cookie'].find(c => c.startsWith('refresh_token=')).split('=')[1].split(';')[0];

        const signout_response = await utils.signout_user(refresh_token);
        expect(signout_response.status).toBe(utils.HTTP_STATUS.NO_CONTENT);
    });
});

describe("Avatar Unit tests", () => {
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

describe("Cloud Unit tests", () => {
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

describe("Element Unit tests", () => {
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

describe("Map Unit tests", () => {
    test("Creation of map", async () => {
        let elements = [];
        const email = utils.makeUniqueUsername() + "something@gmail.com";
        await utils.signup_user({
            email,
            password: valid_password,
            name: "Test user",
            role: "ADMIN"
        });

        const signin_response = await utils.signin_user({identifier: email, password: valid_password});

        for(let x = 0; x<4; x++){
            const image_key = (await utils.uploadFileFromPath(image_path, signin_response.data.data.access_token)).data.data.key;
            elements.push((await utils.addElement({
                name: "something",
                image_key,
                height: 1,
                width: 1,
                static: false
            }, signin_response.data.data.access_token)).data.data.element.id);
        };
        const thumbnail_key = (await utils.uploadFileFromPath(image_path, signin_response.data.data.access_token)).data.data.key;

        let default_elements = [];
        for(let x = 0; x<2; x++){
            default_elements.push({
                element_id: elements.at(Math.floor(Math.random() * 3)),
                x: Math.floor(Math.random() * 99),
                y: Math.floor(Math.random() * 199),
                scale: 1,
                rotation: 0
            });
        }

        const payload = {
            name: "Default map",
            height: 100,
            width: 200,
            thumbnail_key,
            default_elements
        };

        const map_response = await utils.addMap(payload, signin_response.data.data.access_token);
        
        expect(map_response.status).toBe(utils.HTTP_STATUS.CREATED);
    });
});

describe("Space Unit tests", () => {
    test("User can add a space", async () => {
        const email = utils.makeUniqueUsername() + "@gmail.com";
        await utils.signup_user({
            name: "something",
            email,
            password: valid_password,
            role: "USER"
        });

        const signin_response = await utils.signin_user({identifier: email, password: valid_password});

        const admin_email = utils.makeUniqueUsername() + "@gmail.com";
        await utils.signup_user({
            name: "something",
            email: admin_email,
            password: valid_password,
            role: "ADMIN"
        });

        const a_signin_response = await utils.signin_user({identifier: admin_email, password: valid_password});

        const access_token = signin_response.data.data.access_token;

        const map_response = utils.add_map_workflow(image_path, a_signin_response.data.data.access_token);
        const map_id = (await map_response).data.data.map.id;

        const space_response = await utils.addSpace({
            map_id,
            name: "Some user space"
        }, access_token);


        expect(space_response.status).toBe(utils.HTTP_STATUS.CREATED);
        
    });
});

describe("Websocket Unit tests", () => {
    test("Connect web socket", async () => {
        ws = new WebSocket(utils.WEBSOCKET_URL);
        const connection_promise = new Promise((resolve, reject) => {
            ws.onopen = resolve('connected');
            ws.onerror = resolve('rejected');
        });

        const websocket_response = await connection_promise;
        expect(websocket_response).toBe('connected');
    });
});