const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

const buildPath = path.join(__dirname, "/Allinone/build");

// Serve static files from the React app
app.use(express.static(buildPath));

// Catch-all handler to serve the React app for any unknown routes
app.get("/*", (req, res) => {
    res.sendFile(
        path.join(buildPath, "index.html"),
        (err) => {
            if (err) {
                res.status(500).send(err);
            }
        }
    );
});

// WebSocket handling with socket.io
io.on("connection", (socket) => {
    console.log('We are connected');

    socket.on("chat", (chat) => {
        io.emit('chat', chat);
    });

    socket.on('disconnect', () => {
        console.log('disconnected');
    });
});

// Start the server
server.listen(1000, () => console.log('Listening to port 1000'));
