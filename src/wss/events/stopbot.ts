import { Socket } from "socket.io-client";
import {processManager} from "../../index"

module.exports = {
    name: "stop_bot",
    Callback: (args: {userid: string}, socket: Socket) => {
        processManager.stopBot(args.userid)
    }
}