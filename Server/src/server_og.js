#!/usr/bin/env node
var WebSocketServer = require('websocket').server;
var http = require('http');

// var server = http.createServer(function(request, response) {
//     console.log((new Date()) + ' Received request for ' + request.url);
//     response.writeHead(404);
//     response.end();
// });
// server.listen(8080, function() {
//     console.log((new Date()) + ' Server is listening on port 8080');
// });

// wsServer = new WebSocketServer({
//     httpServer: server,
//     // You should not use autoAcceptConnections for production
//     // applications, as it defeats all standard cross-origin protection
//     // facilities built into the protocol and the browser.  You should
//     // *always* verify the connection's origin and decide whether or not
//     // to accept it.
//     autoAcceptConnections: false
// });

// function originIsAllowed(origin) {
//   // put logic here to detect whether the specified origin is allowed.
//   return true;
// }

// wsServer.on('request', function(request) {
//     if (!originIsAllowed(request.origin)) {
//       // Make sure we only accept requests from an allowed origin
//       request.reject();
//       console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
//       return;
//     }
    
//     var connection = request.accept('echo-protocol', request.origin);
//     console.log((new Date()) + ' Connection accepted.');
//     connection.on('message', function(message) {
//         if (message.type === 'utf8') {
//             console.log('Received Message: ' + message.utf8Data);
//             connection.sendUTF(message.utf8Data);
//         }
//         else if (message.type === 'binary') {
//             console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
//             connection.sendBytes(message.binaryData);
//         }
//     });
//     connection.on('close', function(reasonCode, description) {
//         console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
//     });
// });


var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    acceptConnect(request);
});

function acceptConnect(request) {
  const connection = request.accept('play-who-am-i', request.origin);
  let userData, meetingId;
  console.log((new Date()) + ' Connection accepted.');
  connection.on('message', function(message) {
    let result = {};
    const { action, data } = JSON.parse(message.utf8Data);
    switch(action) {
      case 'JOIN':
        userData = data.userData;
        meetingId = data.meetingId;
        addUserToGame(meetingId, userData);
        break;
      case 'NEXT_TURN':
        completeUserTurn(meetingId, userData);
        break;
      default:
        connection.sendUTF(JSON.stringify({ action: 'ERROR', data: 'Unkown Action!' }));
        connection.close();
        return;
    }
    connection.sendUTF(JSON.stringify(games[meetingId].getGameState()));
  });
  connection.on('close', function(reasonCode, description) {
      console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
      removeUserFromGame(meetingId, userData);
  });
}

const whoAmICharacters = [
  {
    img: 'https://upload.wikimedia.org/wikipedia/commons/d/dc/Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg',
    name: 'Steve Jobs',
  },
  {
    img: 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Tim_Cook_%282017%2C_cropped%29.jpg',
    name: 'Tim Cook',
  },
  {
    img: 'https://investors.redfin.com/system/files-encrypted/styles/nir_person_large_bio_pic/encrypt/nasdaq_kms/people/2018/03/21/19-50-56/glenn-kelman-450x563.png?itok=QWJkWjNa',
    name: 'Glenn Kelman',
  },
  {
    img: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Bill_Gates_2018.jpg',
    name: 'Bill Gates',
  },
  {
    img: 'https://upload.wikimedia.org/wikipedia/commons/8/85/Elon_Musk_Royal_Society_%28crop1%29.jpg',
    name: 'Elon Musk',
  },
  {
    img: 'https://upload.wikimedia.org/wikipedia/commons/6/6c/Jeff_Bezos_at_Amazon_Spheres_Grand_Opening_in_Seattle_-_2018_%2839074799225%29_%28cropped%29.jpg',
    name: 'Jeff Bezos',
  },
  {
    img: 'https://upload.wikimedia.org/wikipedia/commons/1/18/Mark_Zuckerberg_F8_2019_Keynote_%2832830578717%29_%28cropped%29.jpg',
    name: 'Mark Zuckerberg',
  },
  {
    img: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Susan_Wojcicki_%2829393944130%29_%28cropped%29.jpg',
    name: 'Susan Wojcicki',
  },
  {
    img: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Enabling_eCommerce-_Small_Enterprises%2C_Global_Players_%2839008130265%29_%28cropped%29.jpg',
    name: 'Jack Ma',
  },
  {
    img: 'https://upload.wikimedia.org/wikipedia/commons/7/78/MS-Exec-Nadella-Satya-2017-08-31-22_%28cropped%29.jpg',
    name: 'Satya Nadella',
  }
];
const games = [];

function removeUserFromGame(gameId, userData) {
  if (!games[gameId]) return;

  const game = games[gameId];

  if (game.onlinePlayers[userData.email]) {
    const currentPlayer = game.onlinePlayers[userData.email];
    currentPlayer.webIds = currentPlayer.webIds.filter(id => id !== userData.id);
    if (currentPlayer.webIds.length === 0) {
      game.offlinePlayers[userData.email] = game.onlinePlayers[userData.email];
      delete game.onlinePlayers[userData.email];
    }
  } else {
    console.error(`The user ${JSON.stringify(userData)} asked to be removed from a game but was not in a game`)
  }
}

function isItThisUsersTurn(gameId, userData) {
  return games[gameId].onlinePlayers[userData.email].webIds.indexOf(userData.id) > 0;
}

function emitGameOver(gameId, userData) {

}

function completeUserTurn(gameId, userData) {
  if (!games[gameId] || !isItThisUsersTurn(gameId, userData)) {
    console.error(`The user ${JSON.stringify(userData)} asked to go to the next players turn when it's not their turn`);
    return;
  }

  const game = games[gameId];

  const currentPlayer = game.onlinePlayers[userData.email];
  currentPlayer.guessesRemaining -= 1;
  const sortedEmails = Object.keys(game.onlinePlayers).filter(k => game.onlinePlayers[k].guessesRemaining > 0).sort();
  if (sortedEmails < 0) {
    emitGameOver(gameId, userData);
  } else {
    const current = sortedEmails.indexOf(userData.email);
    game.currentPlayer = sortedEmails[(current + 1) % sortedEmails.length];
  }
}

function addUserToGame(gameId, userData) {
  if (!games[gameId]) {
    games[gameId] = {
      offlinePlayers: {},
      onlinePlayers: {},
      currentTurn: userData.email,
      _nextPerson: 0,
      getRndPerson: function() {
        return whoAmICharacters[this._nextPerson++];
      },
      getGameState: function() {
        const playerToPlayerStateReducer = (result, player) => {
          const playerState = player.webIds.map(id => ({
            ids,
            guessesRemaining: player.guessesRemaining,
            myTurn: this.currentTurn === id,
          }));
          return result.concat(playerState);
        };

        return {
          offlinePlayers: Object.keys(this.offlinePlayers).reduce(playerToPlayerStateReducer, []),
          onlinePlayers: Object.keys(this.onlinePlayers).reduce(playerToPlayerStateReducer, []),
        };
      },
    };
  }

  const game = games[gameId];
  let currentPlayer;

  if (game.offlinePlayers[userData.email]) {
    currentPlayer = game.onlinePlayers[userData.email] = game.offlinePlayers[userData.email];
    delete game.offlinePlayers[userData.email];
  } else if (!game.onlinePlayers[userData.email]) {
    currentPlayer = game.onlinePlayers[userData.email] = {
      email: userData.email,
      name: userData.name,
      guessPerson: game.getRndPerson(),
      webIds: [],
      guessesRemaining: 20,
    };
  } else {
    currentPlayer = game.onlinePlayers[userData.email];
  }

  currentPlayer.webIds.push(userData.id);
  game.offlinePlayers[userData.email];
}


/*

(() => {
  openMeetingParticipantsMenu();
  return retrieveUserData();

  function openMeetingParticipantsMenu() {
    document.querySelector('div[data-tab-id="1"]').click();
  }

  function mapPersonListItemToPersonObject(participantMenuElm) {
    return {
      id: participantMenuElm.getAttribute('data-participant-id'),
      name: participantMenuElm.querySelector('div:first-child span:first-child').innerText,
    };
  }

  function retrieveUserData() {
    return mapPersonListItemToPersonObject(
      document.querySelector('div[role="list"] div[role="listitem"]')
    );
  }
})();

{id: "spaces/EUVOyXg0ikwB/devices/8a801e1e-e5dd-46af-97ee-835eebb475e3", name: "Stanley Mugo"}
{id: "spaces/EUVOyXg0ikwB/devices/a5fa9f3f-e0f3-46ed-89e0-74daca1343ee", name: "Stanley Mugo"}

*/