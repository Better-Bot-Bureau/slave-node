import { Socket } from "socket.io-client";
import {processManager} from "../../index"

module.exports = {
    name: "restart_bot",
    Callback: (args: {userid: string}, socket: Socket) => {
        processManager.restartBot(args.userid)
    }
}