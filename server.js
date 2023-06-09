const express = require("express");
const upload = require("express-fileupload");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const pathModule = require("path");

// Importing properties file!
const properties = require("./properties/properties.json");

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

// Regex String for add version
var regexExp = /--version[0-9]/;

// API endpoint to get folder names
app.post('/folders', (req, res) => {
  const folderPath = path.join(__dirname, req.body.folder);
  try{
    const data = fs.readdirSync(req.body.folder)
      .map(file => {
        const status = fs.statSync(pathModule.join(req.body.folder, file));
        const versionStr = file.slice(-10);
        const isMatch = checkRegex(versionStr, regexExp);
        const modified = checkModified(folderPath, file);
        return{
          name: file,
          directory: status.isDirectory(),
          addVersion: isMatch,
          modified: modified
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

// Check regexExp
function checkRegex(string, regexExp){
  return regexExp.test(string);
}

// Check Modified!
function checkModified(path, file){
  let modifiedBy = path + "/" + file;
  const props = properties[modifiedBy];
  if(props !== undefined){
    return props;
  } else {
    return "Not Provided"
  }
}


// Endpoint to get all the versions for the requested document
app.post("/addversion-files", function(req,res,next){
  const folderPath = path.join(__dirname, req.body.folder);
  try{
    const data = fs.readdirSync(req.body.folder)
      .map(file => {
        const status = fs.statSync(pathModule.join(req.body.folder, file));
        const fileName = file.match(/^([^-]*)/)[1]; // Extracting the filename and 
        // Version number from the document!
        const version = file.replace(fileName + "--" + "");
        return{
          name: checkFileName(fileName, req.body.fileName), // Helper Function to verify the fileName from the client!
          directory: status.isDirectory(),
          version: version.split("undefined")[1], // Getting the version return undefined followed by version number.
          // Ignoring the 'undefined' by using split!
          modified: checkModified(folderPath, file)
        }
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
})

// File Name helper function for add version!
function checkFileName(fileName, clientName){
  if(clientName.includes(fileName)){
    return fileName;
  }
}


// Create folder in the destination!
app.post("/createfolder", function(req,res){
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


// Handling Upload Request!
app.post("/upload", function(req,res){
  // When a file has been uploaded
  if (req.files && Object.keys(req.files).length !== 0) {
    
    // File Properties
    let uploadedFile = req.files.uploadFile;
      
    // Upload path for normal upload
    let uploadPath = __dirname
        + "/content/" + req.body.pathName + uploadedFile.name;
        
    const value = addProperties(uploadPath, req.body.username); // Adding properties to the properties.json file!
    if(value){
      // Only upload if the file doesn't already exists and add version is not enabled yet.
        if(!fs.existsSync(uploadPath)){
          // Trigger the helper function!
          const resp = uploadFileContent(uploadedFile, uploadPath);
          if(resp){
            res.status(200).json({
              success: true,
              message: "File Uploaded"
            })
          } else {
            res.status(409).json({
              success: false,
              message: "Failed to upload the file!"
            })
          }
        } else {
          res.status(201).json({
            success: true,
            message: "Content already exisits",
            bodyText: "Do you want to add version to this file?"
          })
        }
      } else res.send("No file uploaded !!");
    }
})

// Get file data for the code editor!
app.post("/getfiledata", function(req,res,next){
  try{
    const data = fs.readFileSync(req.body.filePath, 'utf-8');
    res.status(200).json({
      success: true,
      message: data
    })
  } catch(err){
    res.status(401).json({
      success: false,
      message: "Some internal error occured!"
    })
  }
})

// Add Properties helper function!
function addProperties(path, username){
  
    const data = fs.readFileSync('./properties/properties.json', 'utf-8');
    const propertyData = JSON.parse(data)
    
    // Add New Property Now!
    propertyData[`${path}`] = username;
      
    fs.writeFile('./properties/properties.json', JSON.stringify(propertyData), err => {
      if(err){
        return false;
      } 
    })
    return true;
}

// Add Version get modifiedBy helper function!
function getModifiedByVersion(filePath){
  return properties[filePath];
}


// Perform Add Version!
app.post("/addversion-fileupload", function(req,res,next){
  
  // File Properties
  let uploadedFile = req.files.uploadFile;
  
  // Check how many times the files has been added to the add version in the folderPath!
  const occurences = fs.readdirSync("content/" + req.body.pathName.slice(0, -1));
  
  var count = 0; 
  for (number of occurences){
    if(number.includes(uploadedFile.name)){
      if(checkRegex(number, regexExp)){
        count ++;
      }
    }
  }
  
  // Form the upload path!
  const uploadPath = __dirname + "/content/" + req.body.pathName + uploadedFile.name;
  const renamePath =  __dirname + "/content/" + req.body.pathName + uploadedFile.name + `--version${count}`;
  
  const modifiedUser = getModifiedByVersion(uploadPath);  
  
  fs.rename(uploadPath, renamePath, function(err){
    if(err){
      console.error("Error in rename", err);
    } 
        
    // Add renamed value with the modified Username to the properties.json
    addProperties(renamePath, modifiedUser);
    
    // Continue with the add version functionality!
    const result = uploadFileContent(uploadedFile, uploadPath);
    if(result){
      res.status(200).json({
        success: true,
        message: "File uploaded in add version Successfully!"
      })
    } else {
      res.status(409).json({
        success: false,
        message: "Failed to do add version!"
      })
    }
  }) 
})

// Helper function for uploading the file into the server!
function uploadFileContent(uploadedFile, uploadPath){
  // To save the file using mv() function
  var result = true;
  uploadedFile.mv(uploadPath, function (err) {
    if(err){
      result = false;
    } 
  });
  
  return result;
}

// Handling Download Request from the client 
app.post("/download", function(req,res,next){
  const filePath = req.body.filePath;
  // Send the file to the client!
  res.download(filePath);
})

// Delete files handler!
app.post("/deletefile", function(req,res,next){
  const filePath = req.body.filePath;
  fs.unlinkSync(filePath); // Delete the file in the provided path!
  res.status(200).json({
    success: true,
    message: "File deleted successfully!"
  })
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