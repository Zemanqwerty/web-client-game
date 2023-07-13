import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";

import path from 'path';
import { fileURLToPath } from 'url';


const app = express();
const port = 2001;
const server = createServer(app);
const io = new Server(server, {});

var socketsList = {};
var playersList = {};

// const socket = io.sockets;


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const Player = (id) => {
    let self = {
        x: 250,
        y: 250,
        number: Math.floor(10 * Math.random()).toString(),
        prsUp: false,
        prsDown: false,
        prsRight: false,
        prsLeft: false,
        maxSpeed: 10,
    }

    self.updatePosition = () => {
        if (self.prsUp) {
            self.y -= self.maxSpeed;
        }
        if (self.prsDown) {
            self.y += self.maxSpeed;
        }
        if (self.prsRight) {
            self.x += self.maxSpeed;
        }
        if (self.prsLeft) {
            self.x -= self.maxSpeed;
        }
    }

    return self;
};


io.sockets.on('connection', (socket) => {
    console.log('connected to socket io');

    socket.id = Math.random();
    // socket.x = 0;
    // socket.y = 0;
    // socket.number = '' + Math.floor(10 * Math.random())

    let player = Player(socket.id);

    playersList[socket.id] = player;
    socketsList[socket.id] = socket;

    socket.on('KeyPress', (data) => {
        if (data.inputId == 'right') {
            player.prsRight = data.state;
        }
        else if (data.inputId == 'left') {
            player.prsLeft = data.state;
        }
        else if (data.inputId == 'up') {
            player.prsUp = data.state;
        }
        else if (data.inputId == 'down') {
            player.prsDown = data.state;
        }
    })
    
    socket.on('disconnect', () => {
        delete socketsList[socket.id];
        delete playersList[socket.id];
    });
});


setInterval(() => {
    let pack = [];

    for (let i in playersList) {
        let player = playersList[i];

        player.updatePosition();

        pack.push({
            x: player.x,
            y: player.y,
            number: player.number
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

