const express = require("express");
const app = express();
const http = require("http");
const session = require("express-session");
const socketio = require("socket.io");

const server = http.createServer(app);
const io = socketio(server);

const path = require("path")




//Set static folder
app.use(express.static(path.join(__dirname, 'public')))

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Render page
app.get('/', function(req, res) {
    res.render('index');
});

const PORT = 3200 || process.env.PORT;

//start server
server.listen(PORT, ()=>{
    console.log(`Server is running on PORT ${PORT}`);
})