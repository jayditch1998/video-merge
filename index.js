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
// app.use(bodyParser());
app.use(express.static('public'));
 
 
const PORT = process.env.PORT || 3000;
 
app.get('/',(req,res) => {
 
    res.sendFile(__dirname + "/index.html");
 
})
 
app.post('/merge',(req,res) => {
// app.post('/merge',upload.array('files',1000),(req,res) => {
 
    list = "";
    const files = [];
    // if(req.files){
    if(req.body){
        
        // req.files.forEach(file => {
        //     files.push(file.path);
        //     list += `file ${file.filename}`;
        //     list += "\n";
            
        // });
 
        var writeStream = fs.createWriteStream(listFilePath);
 
        writeStream.write(list);
 
        writeStream.end();
        
        const link1 = req.body.link1.replace('?dl=0', '?raw=1');
        const link2 = req.body.link2.replace('?dl=0', '?raw=1');
        const token = req.body.token;
        const path = req.body.path;

        console.log(`merging ${link1} and ${link2}  ...`);
 
        // exec(`ffmpeg -safe 0 -f concat -i ${listFilePath} -c copy ${outputFilePath} -y`, (error, stdout, stderr) => {
        exec(`ffmpeg -i ${link1} -i ${link2} -filter_complex "[0:v:0]scale=1920:1080[c1]; [1:v:0]scale=1920:1080[c2], [c1] [0:a:0] [c2] [1:a:0] concat=n=2:v=1:a=1 [v] [a]" -map "[v]" -map "[a]" ${outputFilePath} -y`, (error, stdout, stderr) => {
          
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            else{
                res.download(outputFilePath,(err) => {
                if(err) throw err
                console.log("videos are successfully merged");
 
                // req.files.forEach(file => {
                //     console.log('------- ', file);
                //     fs.unlinkSync(file.path);             
                // });

                fs.unlinkSync(listFilePath);
                fs.unlinkSync(outputFilePath);
 
            });
            const functionss = (data => {

            });
            fs.readFile(outputFilePath,  function (err, data) {
                const request = https.request('https://content.dropboxapi.com/2/files/upload', {
                // const request = https.request('https://content.dropboxapi.com/2/files/get_thumbnail_v2', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,

                        'Dropbox-API-Arg': JSON.stringify({
                            'path': `${path}/${outputFilePath}`,
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
        }
            
        });
    }
});
 
app.listen(PORT,() => {
    console.log(`App is listening on Port ${PORT}`)
});