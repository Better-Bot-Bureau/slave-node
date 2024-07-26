import { Socket } from "socket.io-client"
import { pipeline } from "node:stream/promises";
import fs from "node:fs";
import path from "node:path";
import { open } from "yauzl"
import { Transform } from "node:stream"

let oc2: any
import("@octokit/rest").then((mod) => {
  oc2 = mod.Octokit
});

module.exports = {
    name: "pull_bot_files",
    once: false,
    Callback: async (args: any, socket: Socket) => {

      let templateDir = path.join(__dirname, "../../../bot_template")
      fs.stat(templateDir, (err) => {
        if(err == null) {
          fs.rmSync(templateDir, {recursive: true, force: true})
        }
      })

      const octokit = new oc2({
        auth: args.auth_token
      });
      
      const request = await octokit.request('GET /repos/{owner}/{repo}/zipball/{ref}', {
        request: {
          parseSuccessResponseBody: false
        },
        owner: 'Better-Bot-Bureau',
        repo: 'bot-template',
        ref: 'main'
      });
      
      let data:any = request.data
      let path2zip = path.join(__dirname, "../../../", "repo.zip")

      await pipeline(
        data,
        fs.createWriteStream(path2zip)
      );

    
      open(path2zip, {lazyEntries: true}, handleZipFile)
      let gotdir:boolean = false
      let renamedir:string
      function mkdirp(dir:string, cb:any) {
        if(gotdir == false) {
          gotdir = true
          renamedir = dir.split("/")[0]

        }

        if (dir === ".") return cb();
        fs.stat(dir, function(err) {
          if (err == null) return cb(); // already exists
      
          var parent = path.dirname(dir);
          mkdirp(parent, function() {
            fs.mkdir(dir, cb);
          });
        });
      }

      function handleZipFile(err:any, zipfile:any) {
        if (err) throw err;
      
        // track when we've closed all our file handles
        var handleCount = 0;
        function incrementHandleCount() {
          handleCount++;
        }
        function decrementHandleCount() {
          handleCount--;
          if (handleCount === 0) {
            console.log("all input and output handles closed");
            let rootDir: string = path.join(__dirname, "../../../")
            let renamePath: string = path.join(rootDir, renamedir)
            let newName: string = path.join(rootDir, "bot_template")
            fs.rm(path.join(rootDir, "repo.zip"),(err) => {
              if(err) console.log(err)
            })

            fs.renameSync(renamePath, newName)
          }
        }
      
        incrementHandleCount();
        zipfile.on("close", function() {
          console.log("closed input file");
          decrementHandleCount();
        });
      
        zipfile.readEntry();
        zipfile.on("entry", function(entry:any) {
          if (/\/$/.test(entry.fileName)) {
            // directory file names end with '/'
            mkdirp(entry.fileName, function() {
              if (err) throw err;
              zipfile.readEntry();
            });
          } else {
            // ensure parent directory exists
            mkdirp(path.dirname(entry.fileName), function() {
              zipfile.openReadStream(entry, function(err:any, readStream:any) {
                if (err) throw err;
                // report progress through large files
                var byteCount = 0;
                var totalBytes = entry.uncompressedSize;
                var lastReportedString = byteCount + "/" + totalBytes + "  0%";
          
                function reportString(msg:any) {
                  var clearString = "";
                  for (var i = 0; i < lastReportedString.length; i++) {
                    clearString += "\b";
                    if (i >= msg.length) {
                      clearString += " \b";
                    }
                  }
            
                  lastReportedString = msg;
                }
                // report progress at 60Hz
                var progressInterval = setInterval(function() {
                  reportString(byteCount + "/" + totalBytes + "  " + ((byteCount / totalBytes * 100) | 0) + "%");
                }, 1000 / 60);
                var filter = new Transform();
                filter._transform = function(chunk, encoding, cb) {
                  byteCount += chunk.length;
                  cb(null, chunk);
                };
                filter._flush = function(cb) {
                  clearInterval(progressInterval);
               
                  
                  cb();
                  zipfile.readEntry();
                };
      
                // pump file contents
                var writeStream = fs.createWriteStream(entry.fileName);
                incrementHandleCount();
                writeStream.on("close", decrementHandleCount);
                readStream.pipe(filter).pipe(writeStream);
              });
            });
          }
        });
      }
    }
}