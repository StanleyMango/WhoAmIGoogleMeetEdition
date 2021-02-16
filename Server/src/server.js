const bunyan = require('bunyan');
const WebSocketServer = require('ws').Server;
const { Errors: PlayerErrors } = require('./player');
const Game = require('./game');
const games = new Map();
const log = bunyan.createLogger({ name: "myapp" });

function findGameByMeetingId(meetingId) {
  return (typeof meetingId === 'string' && games.get(meetingId)) || null;
}

function removeGameByMeetingId(meetingId) {
  games.delete(meetingId);
}

function createGameByMeetingId(meetingId) {
  const game = new Game();
  games.set(meetingId, game);
  return game;
}

function addPlayerToGame(message, connection) {
  const { userData, meetingId } = JSON.parse(message);
  const player = new Game.Player(userData);
  let game = findGameByMeetingId(meetingId);

  if (game === null) {
    game = createGameByMeetingId(meetingId);
  }

  if (game) {
    player.onSendNewState = data => {
      connection.send(JSON.stringify({ action: 'update', data }));
    };
    player.onDisconnect = () => {
      connection.close();
    };
    game.addPlayer(player);
    log.info(`Player added ${player.toString()} to game meeting ${meetingId}`);
    game.onEndGame = () => {
      removeGameByMeetingId(meetingId);
      log.info(`Ended game ${meetingId} do to all of the players leaving`);
    }
    connection.on('close', () => {
      log.info(`Connection closed for player ${player.toString()} in meeting ${meetingId}`);
      player.disconnected();
    });
    return player;
  }
}

function acceptConnect(connection) {
  let player = null;
  log.info((new Date()) + ' Connection accepted.');

  connection.on('message', message => {
    if (player !== null) {
      try {
        player.requestStateUpdate(JSON.parse(message || ''));
      } catch (e) {
        log.error(e);
        connection.send(JSON.stringify({ error: { code: -1, message: 'Unknown exception occurred' } }));
      }
    } else {
      try {
        // Expect: {userData: {email: string, hangoutsId: string, name: string}, meetingId: string}
        player = addPlayerToGame(message || '', connection);
        if (!player) {
          throw new Error(`Unable to create player with message: '${message}'`);
        }
      } catch (e) {
        if (e instanceof PlayerErrors.PlayerError) {
          connection.send(JSON.stringify({ error: { code: e.code, message: e.message } }));
        } else {
          connection.send(JSON.stringify({ error: { code: -1, message: 'Unknown exception occurred' } }));
        }
        log.error(e);
        connection.terminate();
      }
    }
  });
}

class Server {
  #port;

  constructor(port) {
    if (!Number.isInteger(port)) {
      throw TypeError(`Illegal port provided '${port}'`);
    }

    this.#port = port;
  }

  start() {
    return new Promise(resolve => {
      this.wsServer = new WebSocketServer({ port: this.#port }, () => {
        log.info((new Date()) + ` Server is listening on port ${this.#port}`);
        resolve();
      });

      this.wsServer.on('connection', (ws, req) => {
        acceptConnect(ws);
      });
    });
  }

  stop() {
    return new Promise((resolve, reject) => {
      try {
        this.wsServer.close(resolve);
      } catch (e) {
        reject(e);
      }
    });
  }

  get port() {
    return this.#port;
  }

  get url() {
    return `ws://localhost:${this.#port}/`
  }
}

if (process.argv[2]) {
  const serverPort = Number.parseFloat(process.argv[2], 10);
  if (Number.isInteger(serverPort)) {
    const server = new Server(serverPort);
    server.start();
  }
}

module.exports = Server;