import { Socket } from "socket.io-client";
import {processManager} from "../../index"

module.exports = {
    name: "add_bot",
    Callback: (args: {userid: string, token: string}, socket: Socket) => {
        processManager.addBot(args.userid, args.token)
    }
}