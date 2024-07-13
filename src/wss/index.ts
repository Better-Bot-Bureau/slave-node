import * as fs from "fs"
import * as path from "path"
import { Socket } from "socket.io-client"

module.exports = (socket: Socket) => {
    async function scan(root: string, dir: string) {
        const files = fs.readdirSync(path.join(`${__dirname}/.././${root}`, dir) )
        for (const file of files) {
            const stat = fs.lstatSync(path.join(`${__dirname}/.././${root}`, dir, file) )
           
            if (stat.isDirectory() ) {
                scan(root, path.join(dir, file) )
            } else {
                let event =  require(path.join(`${__dirname}/.././${root}`, dir, file) )
                
                if(event.once) {
                    socket.once(event.name, (args:any) => {event.Callback(args, socket) } )
                } else {
                    socket.on(event.name, (args:any) => {event.Callback(args, socket) } )
                }
            }
        }
    }
    
    (()=> {
        scan("wss", "events")
    })()
}