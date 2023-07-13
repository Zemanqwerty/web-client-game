import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";

import path from 'path';
import { fileURLToPath } from 'url';


const app = express();
const port = 2001;
const server = createServer(app);
const io = new Server(server, {})

var socketsList = {};

// const socket = io.sockets;


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


io.sockets.on('connection', (socket) => {
    console.log('connected to socket io');

    socket.id = Math.random();
    socket.x = 0;
    socket.y = 0;
    socket.number = '' + Math.floor(10 * Math.random())

    socketsList[socket.id] = socket;
    
    socket.on('disconnect', () => {
        delete socketsList[socket.id];
    });
});


setInterval(() => {
    let pack = [];

    for (let i in socketsList) {
        let sockClient = socketsList[i];

        sockClient.x++;
        sockClient.y++;

        pack.push({
            x: sockClient.x,
            y: sockClient.y,
            number: sockClient.number
        })
    };

    for (let i in socketsList) {
        let sockClient = socketsList[i];
        sockClient.emit('newPosition', pack)
    };
}, 1000 / 25);





app.get('/', (req, res) => {
    res.sendFile(__dirname + '/client/index.html');
});

app.use('/client', express.static(__dirname + '/client'));

server.listen(port, () => {
    console.log('app listen on port ' + port);
})

