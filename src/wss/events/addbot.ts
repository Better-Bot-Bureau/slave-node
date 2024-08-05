import { Socket } from "socket.io-client";
import {processManager} from "../../index"

module.exports = {
    name: "add_bot",
    Callback: async (args: {userid: string, token: string}, socket: Socket) => {
       await processManager.addBot(args.userid, args.token)
        let e = await processManager.startBot(args.userid)
     
    }
}