import { WebSocketServer } from 'ws';
import url from 'url';
import jwt from "jsonwebtoken";
import { JWT_SECRET } from './config.js';
import { User } from './User.js';

const wss = new WebSocketServer({ port: 3001 });

wss.on('connection', function connection(ws, req) {
    const parsed_url = url.parse(req.url || "", true);
    const token = parsed_url.query.token as string;
    if(!token){
        ws.close();
        return;
    }

    let user: User;
    let decoded;

    try{
        decoded = jwt.verify(token, JWT_SECRET) as { user_id: string, handle: string };
        console.log(decoded.handle+' connected.');
        user = new User(ws, decoded.user_id);
        user.initHandlers();
    }

    catch{
        ws.close();
    }

    ws.on('error', console.error);

    ws.on('close', () => {
        user?.destroy();
    })
    console.log("Sending messages to user "+decoded!.handle)
    ws.send(`Authenticated as ${decoded?decoded.handle:"UNKNOWN"}`);
});