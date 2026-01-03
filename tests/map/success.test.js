const utils = require("../utils/testUtils.js");
const image_path = "./cloud/image.png";

describe("Unit tests", () => {
    test("Creation of map", async () => {
        let elements = [];
        for(let x = 0; x<4; x++){
            elements.push((await utils.add_element_workflow(image_path)).data.data.element.id);
        };
        const image_upload = await utils.uploadFileFromPath(image_path);
        const thumbnail_key = image_upload.data.data.key;

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

        const map_response = await utils.addMap(payload);
        
        expect(map_response.status).toBe(utils.HTTP_STATUS.CREATED);
    });
});