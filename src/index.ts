import { processStatus } from "./types/enums";
import * as osu from "node-os-utils"
const { io } = require("socket.io-client");
import * as crypto from "crypto"
const UUID = crypto.randomUUID()
require("dotenv").config()

// Global variables
export let bots: {process_id: string, token: string, userid: string, status: processStatus}[] = []


// Socket.io setup

const socket = io("http://localhost:8081", { path: "/wss", auth: { type: "Slave", secret: process.env.AUTH_SECRET, UUID: UUID}});

require("./wss")(socket);

socket.on("heartbeat", async (arg: any) => {
    console.log("heartbeat")
    let bot_ids: string[] = []

    for (const bot of bots) {
        bot_ids.push(bot.userid)
    }

    let return_data = {
        cpu: Number((await osu.cpu.usage()).toFixed(1)), 
        mem: Number(((await osu.mem.used()).usedMemMb / 1000).toFixed(1)), 
        total_bots: Number(bots.length), 
        bots: bot_ids, 
        uptime: Number(process.uptime().toFixed(0)), 
        timestamp: Date.now()
    }
    
    socket.emit("heartbeat", return_data)
})




/*
To-Do:
[] Setup bot hosting 
[X] Finish heartbeat (hosted bots, bot ids,  cpu usage, ram usage)
*/