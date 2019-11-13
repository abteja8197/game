var wClient, matrix, cellLength, duration, ballId, maxWidth, maxHeight, draw, ballSize, ballsHash = {}, ballCount = 0;

var ballR = null, ballC = null;
var connectionId = null;


window.onload = function () {
  getMatrix();
};

function getMatrix() {
  fetch('/api/get-matrix').then(resp => resp.json()).then(respData => {
    console.log("respData", respData.data);
    matrix = respData.data.walls;
    renderGame();
    getRandomPosition();
    connectSocket();
  });
}

function getRandomPosition() {
  var r = matrix.length - 1;
  var c = matrix[0].length - 1;
  var er = Math.round(Math.random() * r);
  var ec = Math.round(Math.random() * c);
  console.log("r, c", er, ec);
  ballR = er;
  ballC = ec;
  return checkPosition();
}

function checkPosition() {
  let matrixValue = 0;
  // console.log(ballsHash['B' + ballId])
  matrixValue = matrix[ballR][ballC];
  // console.log('matrixValue', matrixValue)
  if (matrixValue === 0 || typeof (matrixValue) === 'object') {
    return true;
  }
  return false;
}

SVG.on(document, 'keyup', function (e) {
  console.log(e);
  if (e.key === "ArrowUp") {
    updateToServer('U')
  } else if (e.key === "ArrowDown") {
    updateToServer('D');
  } else if (e.key === "ArrowLeft") {
    updateToServer('L');
  } else if (e.key === "ArrowRight") {
    updateToServer('R');
  }
});

function checkMove(move) {
  // let matrixValue = 0;
  // if (move === 'U') {
  //   matrixValue = matrix[((ballsHash['B' + ballId].y - cellLength) / cellLength) - 0.5][(ballsHash['B' + ballId].x / cellLength) - 0.5];
  // } else if (move === 'D') {
  //   matrixValue = matrix[((ballsHash['B' + ballId].y + cellLength) / cellLength) - 0.5][(ballsHash['B' + ballId].x / cellLength) - 0.5];
  // } else if (move === 'L') {
  //   matrixValue = matrix[(ballsHash['B' + ballId].y / cellLength) - 0.5][((ballsHash['B' + ballId].x - cellLength) / cellLength) - 0.5];
  // } else if (move === 'R') {
  //   matrixValue = matrix[(ballsHash['B' + ballId].y / cellLength) - 0.5][((ballsHash['B' + ballId].x + cellLength) / cellLength) - 0.5];
  // }
  // if (matrixValue === 0 || typeof (matrixValue) === 'object') {
  //   return true;
  // }
  // return false;
  return true;
}

function update(move, ballId) {
  if (move === 'U' && checkMove('U') && (ballsHash['B' + ballId].y - cellLength) > 0) {
    ballsHash['B' + ballId].ball.animate({ ease: '<', duration }).center(ballsHash['B' + ballId].x, ballsHash['B' + ballId].y - cellLength);
    ballsHash['B' + ballId].y = ballsHash['B' + ballId].y - cellLength;
    console.log(ballsHash);
  } else if (move === 'D' && checkMove('D') && (ballsHash['B' + ballId].y + cellLength) < maxHeight) {
    ballsHash['B' + ballId].ball.animate({ ease: '<', duration }).center(ballsHash['B' + ballId].x, ballsHash['B' + ballId].y + cellLength);
    ballsHash['B' + ballId].y = ballsHash['B' + ballId].y + cellLength;
  } else if (move === 'L' && checkMove('L') && (ballsHash['B' + ballId].x - cellLength) > 0) {
    ballsHash['B' + ballId].ball.animate({ ease: '<', duration }).center(ballsHash['B' + ballId].x - cellLength, ballsHash['B' + ballId].y);
    ballsHash['B' + ballId].x = ballsHash['B' + ballId].x - cellLength;
  } else if (move === 'R' && checkMove('R') && (ballsHash['B' + ballId].x + cellLength) < maxWidth) {
    ballsHash['B' + ballId].ball.animate({ ease: '<', duration }).center(ballsHash['B' + ballId].x + cellLength, ballsHash['B' + ballId].y);
    ballsHash['B' + ballId].x = ballsHash['B' + ballId].x + cellLength;
  }
}

function saveMatrix() {
  for (let height = 0; height < maxHeight; height = height + cellLength) {
    let i = (height / cellLength);
    for (let width = 0; width < maxWidth; width = width + cellLength) {
      let j = (width / cellLength);
      if (typeof (matrix[i][j]) === 'object') {
        matrix[i][j] = 0;
      }
    }
  }

  for (let i = 1; i <= ballCount; i++) {
    matrix[((ballsHash['B' + i].y / cellLength) - 0.5)][((ballsHash['B' + i].x / cellLength) - 0.5)] = { id: i };
  }

  console.log(matrix);
}

function renderGame(isUpdate) {
  cellLength = 40;
  duration = 400;
  maxWidth = cellLength * matrix[0].length;
  maxHeight = cellLength * matrix.length;
  if (!isUpdate) {
    draw = SVG('background').size(maxWidth, maxHeight);
  }
  ballSize = cellLength / 2;
  ballsHash = {};
  for (let height = 0; height < maxHeight; height = height + cellLength) {
    let i = (height / cellLength);
    for (let width = 0; width < maxWidth; width = width + cellLength) {
      let j = (width / cellLength);

      if (matrix[i][j] === 0 || typeof (matrix[i][j]) === 'object') {
        if (!isUpdate) {
          var pathway = draw.rect(cellLength, cellLength);
          pathway.x(width).y(height).fill('#00ff99').stroke('#000');
        }
        if (typeof (matrix[i][j]) === 'object') {
          var ballWidth = width + cellLength / 2, ballHeight = height + cellLength / 2;
          ballCount++;
          ballsHash['B' + matrix[i][j].id] = {
            x: ballWidth,
            y: ballHeight
          };
        }
      } else if (matrix[i][j] == 1) {
        if (!isUpdate) {
          var wall = draw.rect(cellLength, cellLength);
          wall.x(width).y(height).fill('#000').stroke('#000');
        }
      }
    }
  }

  Object.keys(ballsHash).forEach(item => {
    var ball = draw.circle(ballSize);
    ball.center(ballsHash[item].x, ballsHash[item].y).fill('#000');
    ballsHash[item].ball = ball;
  });
}

function updateToServer(move) {
  wClient.send(JSON.stringify({
    actionName: "UPDATE_GAMER",
    actionData: {
      connectionId: connectionId,
      move,
      dtat: "client to server"
    }
  }));
}

function connectSocket() {
  wClient = new WebSocket("ws://localhost:3434", "echo-protocol");
  wClient.onmessage = function(e) {
    try {
      var actionJSON = JSON.parse(e.data);
      console.log("action data", actionJSON.actionName);
      switch (actionJSON.actionName) {
        case "GET_MY_POSITION":
          while(!getRandomPosition()){};
          connectionId = actionJSON.actionData.connectionId;
          ballId = connectionId;
          wClient.send(JSON.stringify({
            actionName: 'SET_MY_POSITION',
            actionData: {
              r: ballR,
              c: ballC
            }
          }));
          break;
        case 'NEW_GAMER':
          var { gammersData } = actionJSON.actionData;
          Object.keys(gammersData).forEach(cKey => {
            var gamer = gammersData[cKey];
             matrix[gamer.r - 0][gamer.c - 0] = {
              id: gamer.connectionId
            };
          });
          renderGame(true);
          break;
        case 'UPDATE_GAMER':
          console.log("client action dattda", actionJSON.actionData)
          var { gamer, move } = actionJSON.actionData;
          update(move, gamer.connectionId);
          break;
        default:
          break;
      }
    } catch(e) {
      //swallow
    }
  };
}