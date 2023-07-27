import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import path from 'path';
import { fileURLToPath } from 'url';

// определение корневой директории
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEBUG = false;


// Запуск сервера и socket IO
const app = express();
const port = 2001;
const server = createServer(app);
const io = new Server(server, {});


// Переменные для хранения подключений
var socketsList = {};

// const socket = io.sockets;


const Entity = () => {
    let self = {
        x: 250,
        y: 250,
        spdX: 0,
        spdY: 0,
        id: '',
    }

    self.update = () => {
        self.updatePosition();
    }

    self.updatePosition = () => {
        self.x += self.spdX;
        self.y += self.spdY;
    }

    return self;
}


const Player = (id) => {
    let self = Entity();

    self.id = id,
    self.number = Math.floor(10 * Math.random()).toString();
    self.prsDown = false;
    self.prsLeft = false;
    self.prsRight = false;
    self.prsUp = false;
    self.prsAttack = false;
    self.mouseAngle = 0;
    self.maxSpeed = 10;

    let super_update = self.update;
    self.update = () => {
        self.updateSpeed();
        super_update();

        if (self.prsAttack) {
            self.shootBullet(self.mouseAngle);
        }
    };

    self.shootBullet = (angle) => {
        let bullet = Bullet(angle);

        // bullet.x = self.x;
        // bullet.y = self.y;
    };

    self.updateSpeed = () => {
        if (self.prsLeft) {
            self.spdX = -self.maxSpeed;
        } else if (self.prsRight) {
            self.spdX = self.maxSpeed;
        } else {
            self.spdX = 0
        }

        if (self.prsDown) {
            self.spdY = self.maxSpeed;
        } else if (self.prsUp) {
            self.spdY = -self.maxSpeed;
        } else {
            self.spdY = 0;
        }
    }

    Player.list[id] = self;
    
    return self;
};

Player.list = {};

Player.onConnect = (socket) => {
    let player = Player(socket.id);

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
        else if (data.inputId == 'attack') {
            player.prsAttack = data.state;
        }
        else if (data.inputId == 'mouseAngle') {
            player.mouseAngle = data.state;
        }
    });
};

Player.onDisconnect = (socket) => {
    delete Player.list[socket.id];
};

Player.update = () => {
    let pack = [];

    for (let i in Player.list) {
        let player = Player.list[i];

        player.update();

        pack.push({
            x: player.x,
            y: player.y,
            number: player.number
        })
    };

    return pack;
};



const Bullet = (angle) => {
    let self = Entity();
    self.id = Math.random();
    self.spdX = Math.cos(angle/180*Math.PI) * 10;
    self.spdY = Math.sin(angle/180*Math.PI) * 10;

    self.timer = 0;
    self.toRemove = false;

    let super_update = self.update;

    self.update = () => {
        if (self.timer++ > 100) {
            self.toRemove = true;
        }
        super_update();
    }

    Bullet.list[self.id] = self;
}

Bullet.list = {};


Bullet.update = () => {
    let pack = [];

    for (let i in Bullet.list) {
        let bull = Bullet.list[i];

        bull.update();

        pack.push({
            x: bull.x,
            y: bull.y,
        })
    };

    return pack;
};




io.sockets.on('connection', (socket) => {
    console.log('connected to socket io');

    socket.id = Math.random();
    socketsList[socket.id] = socket;

    Player.onConnect(socket);
    
    socket.on('disconnect', () => {
        delete socketsList[socket.id];
        // delete Player.list[socket.id];
        Player.onDisconnect(socket);
        console.log('disconnected from server')
    });

    socket.on('sendMsgToServer', (data) => {
        let playerName = socket.id.toString().slice(2, 7);

        let message = playerName + ': ' + data;

        for (let i in socketsList) {
            socketsList[i].emit('addToChat', message);
        }
    });

    socket.on('evalServer', (data) => {
        if (!DEBUG) {
            return;
        }

        let response = eval(data);

        socket.emit('evalAnswer', response);
    });
});


setInterval(() => {
    // let pack = Player.update();

    let pack = {
        player: Player.update(),
        bullet: Bullet.update()
    }

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

