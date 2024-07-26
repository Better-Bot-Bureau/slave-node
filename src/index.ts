import * as osu from "node-os-utils"
import * as crypto from "crypto"
import BotHandler from "./util/handlers/bot.handler"
const { io } = require("socket.io-client");
const UUID = crypto.randomUUID()
require("dotenv").config()
// Global variables

let missed_heartbeats: number = 0
export const processManager = new BotHandler()
// Socket.io setup

const socket = io(process.env.WSS_URI, { path: "/wss", auth: { type: "Slave", secret: process.env.AUTH_SECRET, UUID: UUID}});

require("./wss")(socket);

let looping: boolean = false

setInterval(async () => {
    if(!looping) return;

    if(missed_heartbeats < 4) {

        missed_heartbeats +=1

    }else if (missed_heartbeats <= 4){

        await processManager.terminateAllProcesses()
        process.exit()

    }
}, 15000)

socket.on("heartbeat", async () => {
    if(looping == false) {
        looping = true
    }
    let bots = await processManager.getBots()

    missed_heartbeats = 0
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

socket.on("terminate", async () => {
    await processManager.terminateAllProcesses()
    process.exit()
})

/*
To-Do:
[] Setup bot hosting 
[X] Finish heartbeat (hosted bots, bot ids,  cpu usage, ram usage)
*/