import { WebSocket } from "ws";
import { InitHandlerSchema, JoinSchema, MoveSchema, OutgoingMessage } from "@repo/types";
import { get_parsed_error_message } from "@repo/helper";
import { RoomManager } from "./RoomManager.js";
import { client } from "@repo/db/client";

export class User {
    private space_id?: string;
    private x: number;
    private y: number;

    constructor(private ws: WebSocket, public id: string) {
        this.x = 0;
        this.y = 0;
    }

    initHandlers() {
        this.ws.on("message", async (data) => {
            const parsed_data = InitHandlerSchema.safeParse(JSON.parse(data.toString()));
            if(!parsed_data.success) {
                this.send({
                    type: "ERROR",
                    payload: {
                        message: "Invalid Data Format",
                        details: get_parsed_error_message(parsed_data)
                    }
                });
                return this.ws.close();
            }

            switch (parsed_data.data?.type) {
                case "JOIN":
                    const join_data = JoinSchema.safeParse(parsed_data.data.payload);
                    if(!join_data.success) {
                        this.send({
                            type: "ERROR",
                            payload: {
                                message: "Invalid Data Format",
                                details: get_parsed_error_message(join_data)
                            }
                        });
                        return this.ws.close();
                    }
                    const space_id = join_data.data.space_id;
                    this.space_id = space_id;
                    let db_response;
                    try{
                        db_response = await client.space.findUnique({ where: {id: space_id}, select: {
                            id: true,
                            map: {
                                select: {
                                    height: true,
                                    width: true
                                }
                            }
                        }});

                        if(!db_response) return this.ws.close();

                        if(db_response.id !== space_id) return this.ws.close();

                    }
                    catch{
                        this.send({type: "ERROR"});
                        return this.ws.close();
                    }

                    const current_map = db_response.map;
                    if(!current_map) return this.ws.close()

                    RoomManager.getInstance().addUser(space_id, this);

                    this.x = Math.floor(Math.random() * current_map.width);
                    this.y = Math.floor(Math.random() * current_map.height);
                    
                    this.send({
                        type: "JOINED",
                        payload: {
                            spawn: {
                                x: this.x,
                                y: this.y
                            },
                            user_ids: RoomManager.getInstance().rooms.get(space_id)?.map(u => u.id)
                        }
                    });
                    RoomManager.getInstance().broadcast({
                        type: "USER-JOINED",
                        payload: {
                            user_id: this.id,
                            x: this.x,
                            y: this.y
                        }
                    }, this, space_id);
                    return;
                case "MOVE":
                    const move_data = MoveSchema.safeParse(JSON.parse(data.toString()));
                    if(!move_data.success){
                        return this.ws.close();
                    }
                    const moveX = move_data.data.x;
                    const moveY = move_data.data.y;
                    const xDistance = Math.abs(moveX - this.x);
                    const yDistance = Math.abs(moveY - this.y);

                    if((xDistance==1 && yDistance==0)||(xDistance==0&&yDistance==1)){
                        this.x = moveX;
                        this.y = moveY;
                        RoomManager.getInstance().broadcast({
                            type: "MOVE",
                            payload: {
                                user_id: this.id,
                                x: this.x,
                                y: this.y
                            }
                        }, this, this.space_id!);
                        return;
                    }

                    this.send({
                        type: "MOVE-REJECTED",
                        payload: {
                            x: this.x,
                            y: this.y
                        }
                    });
            }
        });
    }

    destroy() {
        RoomManager.getInstance().broadcast({
            type: "USER-LEAVE",
            payload: {user_id: this.id}
        }, this, this.space_id!);
        RoomManager.getInstance().removeUser(this, this.space_id!);
    }

    send(payload: OutgoingMessage) {
        this.ws.send(JSON.stringify(payload));
    }
}