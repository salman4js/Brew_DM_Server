const express = require("express");
const upload = require("express-fileupload");
const bodyParser = require("body-parser");
const cors = require("cors");

// Importing path module!
const path = require('path');

// Utilizing MiddleWares
const app = express();
app.use(upload()); // Documents importing package!
app.use(bodyParser.json());
app.use(cors());

// API endpoint to get folder names
app.get('/folders', (req, res) => {
  const fs = require('fs');
  const folderPath = path.join(__dirname, req.body.folder);
  
  // Read the folder names in the content directory
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error(err);
      return res.status(200).json({
        success: false,
        message: "Error reading files"
      })
    }

    // Send the folder names as a JSON response
    res.status(200).json({
      success: true,
      message: files
    })
  });
});

// Handling Upload Request - Temp!
app.post("/upload", function(req,res){
  // When a file has been uploaded
  if (req.files && Object.keys(req.files).length !== 0) {
    
    // Uploaded path
    const uploadedFile = req.files.uploadFile;
  
    // Upload path
    const uploadPath = __dirname
        + "/content/" + uploadedFile.name;
  
    // To save the file using mv() function
    uploadedFile.mv(uploadPath, function (err) {
      if (err) {
        console.log(err);
        res.send("Failed !!");
      } else res.send("Successfully Uploaded !!");
    });
  } else res.send("No file uploaded !!");
})

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