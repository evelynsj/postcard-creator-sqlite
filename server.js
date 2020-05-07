// server.js
// where your node app starts

// include modules
const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const fs = require("fs");
const sql = require("sqlite3").verbose();

//======================== BUILDING DATABASE ===============================
const postcardTbl = new sql.Database("postcards.db");

const verifyDB =
    "SELECT name FROM sqlite_master WHERE type='table' AND name='Postcard'";
postcardTbl.get(verifyDB, (err, val) => {
    if (err) {
        console.log("Error verifying database", err);
    } else if (!val) {
        console.log("No database file - creating one");
        createPostcardTable();
    } else {
        console.log("Database file found", val);
    }
});

const createPostcardTable = () => {
    const cmd =
        "CREATE TABLE Postcard ( id INTEGER PRIMARY KEY, image TEXT, font TEXT, background TEXT, message TEXT, url TEXT UNIQUE)";
    postcardTbl.run(cmd, (err, _) => {
        if (err) {
            console.log("Database creation failure", err.message);
        } else {
            console.log("Created database");
        }
    });
};

//======================== UTIL FUNCTION ===============================
const generateQueryString = () => {
    let result = "";
    let characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i <= 22; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );
    }
    return result;
};

//======================== REQUEST HANDLING ===============================

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + "/images");
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});
// let upload = multer({dest: __dirname+"/assets"});
let upload = multer({ storage: storage });

// begin constructing the server pipeline
const app = express();

// Serve static files out of public directory
app.use(express.static("public"));

// Also serve static files out of /images
app.use("/images", express.static("images"));

// Handle GET request to base URL with no other route specified
// by sending creator.html, the main page of the app
app.get("/", function (request, response) {
    response.sendFile(__dirname + "/public/creator.html");
});

// Next, the the two POST AJAX queries

// Handle a post request to upload an image.
app.post("/upload", upload.single("newImage"), function (request, response) {
    console.log(
        "Recieved",
        request.file.originalname,
        request.file.size,
        "bytes"
    );
    if (request.file) {
        // file is automatically stored in /images,
        // even though we can't see it.
        // We set this up when configuring multer
        response.end("recieved " + request.file.originalname);
    } else throw "error";
});

// Handle a post request containing JSON
app.use(bodyParser.json());
// gets JSON data into req.body
app.post("/saveDisplay", function (req, res) {
    // SHARE POSTCARD
    console.log(req.body);
    const image = req.body.image;
    const background = req.body.color;
    const font = req.body.font;
    const message = req.body.message;
    const url = generateQueryString()

    const insert =
        "INSERT INTO Postcard (image, background, font, message, url) VALUES (?,?,?,?,?)";
    postcardTbl.run(insert, image, background, font, message, url, function (err) {
        if (err) {
            console.log("DB insert error", err.message);
        } else {
            console.log("Insert successful at row id", this.lastID);
            res.send(url);
        }
    });
});

app.get("/showPostcard", (req, res) => {
    const url = req.query.id
    const getData = `SELECT image, font, background, message FROM Postcard WHERE url='${url}'`;
    postcardTbl.get(getData, (err, val) => {
        if (err) {
            console.log("Error", err)
        } else {
            console.log("Success", val)
            res.json(val)
        }
    })
})

// The GET AJAX query is handled by the static server, since the
// file postcardData.json is stored in /public

// listen for requests :)
var listener = app.listen(process.env.PORT || 3000, function () {
    console.log(
        "Your app is listening on port " + listener.address().port || 3000
    );
});
