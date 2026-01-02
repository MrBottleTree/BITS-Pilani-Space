import type { User } from "./User";

export class RoomManager {
    rooms: Map<string, User[]> = new Map();
    static instance: RoomManager

    constructor() {
        this.rooms = new Map();
    }

    static getInstance() {
        if(!this.instance){
            this.instance = new RoomManager();
        }
        return this.instance;
    }

    public addUser(space_id: string, user: User){
        if (!this.rooms.has(space_id)){
            this.rooms.set(space_id, []);
        }
        this.rooms.get(space_id)?.push(user);;
        return;
    }

    public broadcast(payload: any, sender: User, space_id: string){
        const users = this.rooms.get(space_id) ?? [];

        for(const user of users){
            if(user.id !== sender.id){
                user.send(payload);
            }
        }
    }

    public removeUser(user: User, space_id: string){
        if(!this.rooms.has(space_id)) return;

        this.rooms.set(space_id, this.rooms.get(space_id)?.filter(u=>u.id!==user.id)?? []);
        return;
    }
}