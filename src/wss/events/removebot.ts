import { Socket } from "socket.io-client";
import {processManager} from "../../index"

module.exports = {
    name: "remove_bot",
    Callback: async (args: {userid: string}, socket: Socket) => {
        await processManager.removeBot(args.userid)
    }
}