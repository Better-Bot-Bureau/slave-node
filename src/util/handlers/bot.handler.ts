
import path from "node:path"
import { processStatus } from "../../types/enums"
const terminate = require("terminate")
import {exec} from "node:child_process"


export default class BotHandler {

    private bots: {process_id: number | unknown, token: string, userid: string, status: processStatus}[] = []
    private bot_root: string = path.join(__dirname, "../../../bot_template")

    constructor() {
        this.bots = []
    }

    public async getBots(): Promise<typeof this.bots> {
        return this.bots;
    }

    public async addBot(userid: string, token: string): Promise<void | Error> {
        let index = this.bots.findIndex(o => o.userid == userid)
        if(index !== -1) return new Error("Bot already added to node")
        this.bots.push({process_id: null, token: token, userid: userid, status: processStatus.DEAD})    
    }

    public async startBot(userid: string): Promise<void | Error> {
        try {

            let index = this.bots.findIndex(o => o.userid == userid)
            if(index == -1) return new Error("No bot with Userid found in bots array")

            let bot = this.bots[index]
            if(bot.token == null || "") return new Error("No bot token")

            await this.spawnProcess(this.bot_root, {TOKEN: bot.token, DATABASE_DIALECT: "sqlite"}) 

        }catch(err){
            return err as Error
        }
    }

    public async stopBot(userid: string): Promise<void | Error> {
        try {
            
            let index = this.bots.findIndex(o => o.userid == userid)
            if(index == -1) return new Error("No bot with Userid found in bots array")

            let bot = this.bots[index]
            if(bot.process_id == null || "") return new Error("No processID for this bot")

            await this.terminateProcess(bot.process_id)

        }catch(err){
            return err as Error
        }
    }

    public async restartBot(userid: string): Promise<void> {
        await this.stopBot(userid)
        await this.startBot(userid)
    }

    public async terminateAllProcesses(): Promise<void> {
        for(const bot of this.bots) {
            if(bot.process_id == null || "") continue
            await this.terminateProcess(bot.process_id)
        }
    }

    private async terminateProcess(pid: number | unknown): Promise<void | Error> {
        try {
            let index = this.bots.findIndex(o => o.process_id == pid)
            if(index == -1) return new Error("PID not found in bots array")

            await terminate(pid)
            this.bots[index].process_id = null
            this.bots[index].status = processStatus.DEAD
        }catch (err) {
            return err as Error
        }
    }

    private async spawnProcess(path: string, env_vars: {TOKEN: string, DATABASE_DIALECT: string}): Promise<void | Error> {
        try {
            let index = this.bots.findIndex(o => o.token == env_vars.TOKEN)
            if(index == -1) return new Error("Bot not found in array")

            let process = exec("node " + path, {env: env_vars})
            this.bots[index].process_id = process.pid
            this.bots[index].status = processStatus.HEALTHY
        }catch (err) {
            return err as Error
        }
    }
}