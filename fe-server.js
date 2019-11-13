var static = require('node-static');
var fs = require('fs');
var path = require('path');
var WebSocketServer = require('websocket').server;

var gammers = {};
var gammersData = {};
var background = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];
var walls = [[1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 1, 0, 0, 1, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
[0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 1, 1, 1, 0, 1, 1, 1, 0, 0],
[0, 1, 1, 1, 1, 1, 1, 1, 0, 0]
];
var balls = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

function broadCasts(payload) {
    if (payload) {
        Object.keys(gammers).forEach(cKey => {
            gammers[cKey].connection.sendUTF(JSON.stringify(payload));
        });
    }
};

var backgroundLength = background.length - 1;
var backgroundWidth = background[0].length - 1;

function checkMove(data, move) {
    let isWall = false;
    if (!(data.r <= backgroundWidth && data.r > 0 && data.c <= backgroundLength && data.c > 0)) {
        if (move === 'U') {
            isWall = !walls[data.r - 1][data.c];
            if (isWall) {
                gammersData['C' + data.connectionId].r -= 1;
            }
        } else if (move === 'D') {
            isWall = !walls[data.r + 1][data.c];
            if (isWall) {
                gammersData['C' + data.connectionId].r += 1;
            }
        } else if (move === 'L') {
            isWall = !walls[data.r][data.c - 1];
            if (isWall) {
                gammersData['C' + data.connectionId].c -= 1;
            }
        } else if (move === 'R') {
            isWall = !walls[data.r][data.c + 1];
            if (isWall) {
                gammersData['C' + data.connectionId].c += 1;
            }
        }
    }

    return isWall;
}

function initWS(server) {
    let wsServer = new WebSocketServer({
        httpServer: server,
        autoAcceptConnections: false
    });

    wsServer.on('request', function (request) {
        var connection = request.accept('echo-protocol', request.origin);
        connection.on('message', function (message) {
            if (message.type === 'utf8') {
                var datafromClient = JSON.parse(message.utf8Data);
                var { actionData, actionName } = datafromClient;
                var payload = {}, skipBoradCast = false;
                console.log("jlgkus", backgroundLength, backgroundWidth);
                switch (actionName) {
                    case 'SET_MY_POSITION':
                        let r = gammersData['C' + connection.connectionId].r = actionData.r;
                        let c = gammersData['C' + connection.connectionId].c = actionData.c;
                        balls[r][c] = { id: connection.connectionId };
                        payload = {
                            actionName: 'NEW_GAMER',
                            actionData: {
                                gammersData: gammersData
                            }
                        };
                        break;
                    case 'UPDATE_GAMER':
                        if (checkMove(gammersData['C' + connection.connectionId], actionData.move)) {
                            payload = {
                                actionName: 'UPDATE_GAMER',
                                actionData: {
                                    gamer: gammersData['C' + actionData.connectionId],
                                    move: actionData.move,
                                    data: "from server"
                                }
                            };
                        } else {
                            skipBoradCast = true;
                        }
                        break;
                    case 'GET_ME_GUID': 
                      
                        break;
                    case 'SET_MATRIX': 
                        payload = {
                            actionName: 'SET_MATRIX',
                            actionData: {
                                matrix: matrix
                            }
                        }
                        break;
                    default:
                        break;
                }
                console.log('balls', gammersData['C' + connection.connectionId])
                if (!skipBoradCast) {
                    broadCasts(payload);
                }
            }
            else if (message.type === 'binary') {
                console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
                //connection.sendBytes(message.binaryData);
            }
        });
        connection.on('close', function (reasonCode, description) {
            delete gammers['C' + connection.connectionId];
            delete gammersData['C' + connection.connectionId];
            broadCasts();
        });

        if (connection.connected) {
            var connectionId = new Date().getTime() + '' + Math.round(Math.random() * 1000);
            connection.connectionId = connectionId;
            gammers['C' + connectionId] = {
                connection
            };
            gammersData['C' + connectionId] = {
                connectionId: connectionId
            };

            connection.sendUTF(JSON.stringify({
                actionName: 'GET_MY_POSITION',
                actionData: {
                    connectionId: connectionId
                }
            }));
            // broadCasts({
            //     actionName: "NEW_GAMMER"
            // });
        }
    });
}

module.exports = function (options) {
    var { folder, fePort } = options;
    var requestHandler = function (request, response) {
        var body = [];
        if (request.url.indexOf('api') >= 0) {
            request.on('data', function (chunk) {
                body.push(chunk);
            });
        }
        request.addListener('end', function () {
            if (request.method === 'OPTIONS') {
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, x-api-key');
                response.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,PATCH');
                response.writeHead(200, {
                    'Content-Type': 'application/json'
                });
                response.end();

            } else {
                if (request.url.indexOf('/api') >= 0) {
                    response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, x-api-key');
                    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,PATCH');
                    if (request.url.indexOf('/api/get-matrix') >= 0) {
                        response.end(JSON.stringify({
                            data: {
                                background,
                                walls
                            }
                        }));
                    } else {
                        response.end(JSON.stringify({
                            data: ""
                        }));
                    }
                    
                } else {
                    var file = new static.Server('./' + folder, {
                        headers: {
                            gzip: true,
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'GET,POST,DELETE,PATCH',
                            'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-api-key'
                        }
                    });
                    file.serve(request, response, function (err, res) {
                        if (err && (err.status === 404) && request.url.indexOf('.html') < 0) {
                            fs.exists(path.join(__dirname, folder, 'index.html'), (exists) => {
                                if (exists) {
                                    file.serveFile('/index.html', 200, {}, request, response);
                                } else {
                                    response.writeHead(200, { 'content-type': 'text/html' });
                                    response.end(JSON.stringify({
                                        msg: 'Build in prgoresssssss static',
                                        details: buildStatus
                                    }));
                                }
                            });
                        } else {
                            response.writeHead(200, { 'content-type': 'text/html' });
                            response.end('Resource Not Found');
                        }
                    });
                }
            }
        }).resume();
    };

    var server = require('http').createServer(requestHandler).listen(fePort, () => {
        console.log('Server Listining on ' + fePort);
    });

    initWS(server);
};