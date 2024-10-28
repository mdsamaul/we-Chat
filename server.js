const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app);
const io = new Server(server);
const users = {};

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => res.sendFile(__dirname + "/public/index.html"));

io.on('connection', (socket) => {
    socket.on('joinGroup', (username, groupName) => {
        socket.join(groupName);
        socket.username = username;
        socket.groupName = groupName;
        users[username + "_" + groupName] = username;
        io.to(groupName).emit('updateUsers', Object.values(users));
        socket.emit('groupMessage', { user: "Server", message: `Welcome ${username} to ${groupName}` });
    });

    // Handle group message broadcasting
    socket.on('groupMessage', (msg) => {
        socket.to(socket.groupName).emit('groupMessage', msg);
    });

    // Handle image upload
    socket.on('uploadImage', (data, username) => {
        socket.broadcast.to(socket.groupName).emit('publishImage', { data, username });
    });

    // Handle file upload (document)
    socket.on('uploadFile', (data, username, fileName) => {
        socket.broadcast.to(socket.groupName).emit('publishFile', { data, username, fileName });
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        delete users[socket.username + "_" + socket.groupName];
        io.to(socket.groupName).emit('updateUsers', Object.values(users));
    });
});

server.listen(5000, () => console.log("Server running at http://localhost:5000"));
