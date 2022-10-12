const express = require('express');
 
const fs = require('fs');
 
const path = require('path');
 
const { exec } = require('child_process');
 
var list = "";
 
var listFilePath = 'public/uploads/' + Date.now() + 'list.txt';
 
var outputFilePath = Date.now() + 'output.mp4';
 
const bodyParser = require('body-parser');
 
const multer = require('multer');
 
const app = express();

const https = require('https');
  
var dir = 'public';
var subDirectory = 'public/uploads';
 
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
 
    fs.mkdirSync(subDirectory);
 
}
 
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/uploads');
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
 
const videoFilter = function(req, file, cb) {
    // Accept videos only
    if (!file.originalname.match(/\.(mp4)$/)) {
        req.fileValidationError = 'Only video files are allowed!';
        return cb(new Error('Only video files are allowed!'), false);
    }
    cb(null, true);
};
 
var upload = multer({storage:storage,fileFilter:videoFilter});
 
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(express.static('public'));
 
 
const PORT = process.env.PORT || 3000;
 
app.get('/',(req,res) => {
 
    res.sendFile(__dirname + "/index.html");
 
})
 
app.post('/merge',upload.array('files',1000),(req,res) => {
 
    list = "";
    // console.log('file.path ', file.path);
    if(req.files){
        
        req.files.forEach(file => {
            list += `file ${file.filename}`;
            list += "\n";
            
        });
 
        var writeStream = fs.createWriteStream(listFilePath);
 
        writeStream.write(list);
 
        writeStream.end();
 
        exec(`ffmpeg -safe 0 -f concat -i ${listFilePath} -c copy ${outputFilePath}`, (error, stdout, stderr) => {
          
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            else{
                console.log("videos are successfully merged");


                fs.readFile(outputFilePath, function (err, data) {
                    const request = https.request('https://content.dropboxapi.com/2/files/upload', {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer sl.BRCHCb1bra6wVSWMuQPcjaFcsf1nVPh-W3vQzSYg3pJh8kGHpRpqPSsmdPXPfxSiaXNIoatQWTjSB1yQ9fnNKb46p07DlsojtmUtvA0R9oJOy0Oo5xpNVAwvbPxxNKuoclOlPbo_8cSO',
                            'Dropbox-API-Arg': JSON.stringify({
                                'path': `/test/${outputFilePath}`,
                                'mode': 'overwrite',
                                'autorename': true, 
                                'mute': false
                            }),
                            'Content-Type': 'application/octet-stream',
                        }
                    }, (res) => {
                        console.log("statusCode: ", res.statusCode);
                        console.log("headers: ", res.headers);
                
                        res.on('data', function(d) {
                            process.stdout.write(d);
                        });
                    });
                    request.on('error', error => {
                        console.error(error)
                      })
                    request.write(data);
                    request.end();
                });

                
                res.download(outputFilePath,(err) => {
                if(err) throw err
 
                req.files.forEach(file => {
                    console.log('------- ', file);
                    fs.unlinkSync(file.path);             
                });
 
                fs.unlinkSync(listFilePath);
                fs.unlinkSync(outputFilePath);
 
            });
        }
            
        });
    }
});
 
app.listen(PORT,() => {
    console.log(`App is listening on Port ${PORT}`)
});