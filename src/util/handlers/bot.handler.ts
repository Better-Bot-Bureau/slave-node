
import path from "node:path"

const terminate = require("terminate")
import {exec, spawn} from "node:child_process"
import type { processStatus } from "../../types/enums"


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
        this.bots.push({process_id: null, token: token, userid: userid, status: 2})    
   
    }

    public async removeBot(userid: string): Promise<void | Error> {
        let index = this.bots.findIndex(o => o.userid == userid)
        if(index !== -1) return new Error("Bot does not exist")
        this.bots.splice(index, 1)    
    }

    public async startBot(userid: string): Promise<void | Error> {
        try {

            let index = this.bots.findIndex(o => o.userid == userid)
            if(index == -1) return new Error("No bot with Userid found in bots array")

            let bot = this.bots[index]
            if(bot.token == null || "") return new Error("No bot token")
            await this.spawnProcess({TOKEN: bot.token, ID: bot.userid, DATABASE_DIALECT: "sqlite"}) 
          
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
            this.bots[index].status = 2
        }catch (err) {
            return err as Error
        }
    }

    private async spawnProcess( env_vars: {TOKEN: string, ID: string, DATABASE_DIALECT: string}): Promise<void | Error> {
        try {
            let index = this.bots.findIndex(o => o.token == env_vars.TOKEN)
            if(index == -1) return new Error("Bot not found in array")
          
            
            let process2 = spawn('node', [path.join(this.bot_root, 'src/shard.js')], {cwd: this.bot_root , env: env_vars})
           
            this.bots[index].process_id = process2.pid
            this.bots[index].status = 0
        }catch (err) {
            console.log(err)
            return err as Error
        }
    }
}