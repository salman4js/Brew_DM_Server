const express = require("express");
const upload = require("express-fileupload");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const pathModule = require("path");

// Importing path module!
const path = require('path');

// Utilizing MiddleWares
const app = express();
app.use(cors());
app.use(upload()); // Documents importing package!
app.use(bodyParser.json());

// CORS issue with NGROK~
app.use(function(req, res, next) {
res.header("Access-Control-Allow-Origin", "*"); // update to match 
res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
next();
});

// API endpoint to get folder names
app.post('/folders', (req, res) => {
  const folderPath = path.join(__dirname, req.body.folder);
  try{
    const data = fs.readdirSync(req.body.folder)
      .map(file => {
        const status = fs.statSync(pathModule.join(req.body.folder, file))
        return{
          name: file,
          directory: status.isDirectory()
        }
      })
      .sort((a, b) => {
        if (a.directory === b.directory) {
          return a.name.localeCompare(b.name)
        }
        return a.directory ? -1 : 1
      })
      
    // Everything goes well...
    res.status(200).json({
      success: true,
      message: data
    })
    
  } catch(err){
      res.status(422).json({
        success: false,
        message: "Error when reading the content!"
      })
    }
});

// Create folder in the destination!
app.post("/createfolder", function(req,res){
  console.log(req.body.pathName);
    const folderName = req.body.pathName;
    // Performing folder creation!
    try {
      if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName);
        res.status(200).json({
          success: true,
          message: `Folder Created Successfully!`
        })
      } else {
        res.status(200).json({
          success: true,
          message: "Folder Already Exists!"
        })
      }
    } catch (err) {
      res.status(409).json({
        success: false,
        message: "Some Internal error occured!"
      })
    }
})

// Handling Upload Request - Temp!
app.post("/upload", function(req,res){
  // When a file has been uploaded
  if (req.files && Object.keys(req.files).length !== 0) {
    
    // Uploaded path
    const uploadedFile = req.files.uploadFile;
      
    // Upload path
    const uploadPath = __dirname
        + "/content/" + req.body.pathName + uploadedFile.name;
        
    // Only upload if the file doesn't already exists!
    if(!fs.existsSync(uploadPath)){
      // To save the file using mv() function
      uploadedFile.mv(uploadPath, function (err) {
        if (err) {
          console.log(err);
          res.send("Failed !!");
        } else res.send("Successfully Uploaded !!");
      });
    } else {
      res.status(409).json({
        success: false,
        message: "Content already exisits!"
      })
    }
  } else res.send("No file uploaded !!");
})

// Handling Download Request from the client 
app.post("/download", function(req,res,next){
  const filePath = req.body.filePath;
  // Send the file to the client!
  res.download(filePath);
})


// Test Route to check the server connection // TODO : Delete Later!
app.get("/cabinets", function(req,res,next){
  res.status(200).json({
    success: true,
    message: "Hey there, boss"
  })
})

// Running the server!
app.listen(3200, () => {
  console.log("Server is running!");
})