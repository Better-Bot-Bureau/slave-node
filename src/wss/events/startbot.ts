import { Socket } from "socket.io-client";
import {processManager} from "../../index"

module.exports = {
    name: "start_bot",
    Callback: (args: {userid: string}, socket: Socket) => {
        processManager.startBot(args.userid)
    }
}