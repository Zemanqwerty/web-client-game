import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";

import path from 'path';
import { fileURLToPath } from 'url';


const app = express();
const port = 2001;
const server = createServer(app);
const io = new Server(server, {})

// const socket = io.sockets;


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


io.sockets.on('connection', (socket) => {
    console.log('connected to socket io');

    socket.on('happy', (data) => {
        console.log(data.message);
    });

    socket.emit('serverMsg', {
        message: 'message from server'
    })
});





app.get('/', (req, res) => {
    res.sendFile(__dirname + '/client/index.html');
});

app.use('/client', express.static(__dirname + '/client'));

server.listen(port, () => {
    console.log('app listen on port ' + port);
})

