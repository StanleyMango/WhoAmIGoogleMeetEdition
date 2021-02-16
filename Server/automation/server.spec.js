const WebSocket = require('ws');
const Server = require('../src/server');

const GameStates = Object.freeze({
  CREATING: 0,
  PLAYING: 1,
  COMPLETED: 2,
});
const DEFAULT_MEETING_ID = 'abc-defg-hij';
let testingPort = 2300;

describe('The server', () => {
  let server, clients;

  function createClient(clientInitData = {}) {
    const client = new MockClient({
      ...createClientInfo(clients.length),
      ...clientInitData,
    });
    clients.push(client);
    return client;
  }

  beforeEach(async () => {
    server = await createAndStartServer();
    clients = [];
  });

  afterEach(async () => {
    for (const client of clients) {
      await client.forceClose();
    }
    await server.stop();
  });

  describe('Lets the first user', () => {
    it('Join a new game', async () => {
      const meetingId = 'abc-defg-hij';
      const client = createClient({ meetingId });
      await client.joinGame(server);
    });
  });

  describe('After the first user joins a new game', () => {
    it('Starts a new game', async () => {
      const client = createClient({ meetingId: DEFAULT_MEETING_ID });
      await client.joinGame(server);
      const message = await client.nextMessage();

      expect(message).toEqual({
        action: 'update',
        data: {
          state: GameStates.PLAYING,
          playerGroups: [expectedPlayerGroup(10, true)],
        },
      });

      expect(Object.values(message.data.playerGroups[0].players)).toEqual([{
        id: expect.anything(),
        name: client.name,
        isOnline: true,
        hangoutsId: client.hangoutsId,
      }]);
    });
  });

  describe('When a second user joins the game', () => {
    it('Lets both users know that they are all in the game', async () => {
      const client1 = createClient({ meetingId: DEFAULT_MEETING_ID });
      const client2 = createClient({ meetingId: DEFAULT_MEETING_ID });
      await client1.joinGame(server);
      await client2.joinGame(server);

      const expectedMessage = {
        action: 'update',
        data: {
          state: GameStates.PLAYING,
          playerGroups: [
            expectedPlayerGroup(10, true),
            expectedPlayerGroup(10),
          ],
        },
      };

      await client1.nextMessage();
      const client1Message = await client1.nextMessage();
      const client2Message = await client2.nextMessage();
      expect(client1Message).toEqual(expectedMessage);
      expect(client2Message).toEqual(expectedMessage);

      const client1Players = client1Message.data.playerGroups
        .map(group => Object.values(group.players));

      const client2Players = client2Message.data.playerGroups
        .map(group => Object.values(group.players));

      const expectedPlayers = [
        [{
          id: expect.anything(),
          name: client1.name,
          isOnline: true,
          hangoutsId: client1.hangoutsId,
        }],
        [{
          id: expect.anything(),
          name: client2.name,
          isOnline: true,
          hangoutsId: client2.hangoutsId,
        }]
      ];
      expect(client1Players).toEqual(expectedPlayers);
      expect(client2Players).toEqual(expectedPlayers);
    });
  });

  describe('When a user leaves the game', () => {
    it('Notifies other users of the offline user', async () => {
      const client1 = createClient({ meetingId: DEFAULT_MEETING_ID });
      const client2 = createClient({ meetingId: DEFAULT_MEETING_ID });
      await client1.joinGame(server);
      await client2.joinGame(server);
      client1.forceClose();

      const expectedMessage = {
        action: 'update',
        data: {
          state: GameStates.PLAYING,
          playerGroups: [
            expectedPlayerGroup(10),
            expectedPlayerGroup(10, true),
          ],
        },
      };
      await client2.nextMessage();
      await client2.nextMessage();
      const client2Message = await client2.nextMessage();
      expect(client2Message).toEqual(expectedMessage);

      const client2Players = client2Message.data.playerGroups
        .map(group => Object.values(group.players).concat({ isMyTurn: group.isMyTurn }));

      const expectedPlayers = [
        [
          {
            id: expect.anything(),
            name: client1.name,
            isOnline: false,
            hangoutsId: client1.hangoutsId,
          },
          { isMyTurn: undefined,}
        ],
        [
          {
            id: expect.anything(),
            name: client2.name,
            isOnline: true,
            hangoutsId: client2.hangoutsId,
          },
          { isMyTurn: true,}
        ]
      ];
      expect(client2Players).toEqual(expectedPlayers);
    });
  });

  describe('When a user marks their turn as complete', () => {
    it('Gives the next user gets their turn', () => {});
  });

  describe('When a user who left the game returns', () => {
    describe('With a new hangoutsId', () => {
      it('They are added to the same group', () => {
      });
    });
    describe('With a the same hangoutsId', () => {
      it('They are added to the same group', () => {
      });
    });
  });
});

async function createAndStartServer() {
  const maxFindAddressRetries = 10;
  let server;
  for (let i = 0; i < maxFindAddressRetries; i++) {
    try {
      server = new Server(testingPort + i);
      await server.start();
      break;
    } catch (e) {
      testingPort += 1;
      if(err.errno === 'EADDRINUSE' && i !== maxFindAddressRetries - 1) {
        continue;
      }
      throw e;
    }
  }
  return server;
}

function createClientInfo(i) {
  const name = `stan.${i}`;
  return {
    name,
    email: `${name}@gmail.com`,
    hangoutsId: `${name}/${i}`,
  };
};

function expectedPlayerGroup(guessesRemainingCount, isMyTurn) {
  return {
    guessesRemainingCount,
    players: expect.any(Object),
    ...(isMyTurn ? { isMyTurn: true } : {}),
    character: expect.objectContaining({
      img: expect.any(String),
      name: expect.any(String),
    }),
  };
}

class LinearPromise {
  constructor() {
    this.promise = new Promise(resolve => {
      if (this.resolver) {
        resolve();
      } else {
        this.resolver = resolve;
      }
    });
  }

  resolve() {
    if (this.resolver) {
      this.resolver();
    } else {
      this.resolver = true;
    }
  }
}

class MockClient {
  messages = [];
  nexMessage = new LinearPromise();

  constructor({ name, email, hangoutsId, meetingId }) {
    this.name = name;
    this.email = email;
    this.hangoutsId = hangoutsId;
    this.meetingId = meetingId;
  }

  joinGame(server) {
    return new Promise((resolve) => {
      this.socket = new WebSocket(server.url);
      this.socket.on('open', () => {
        this.socket.send(JSON.stringify({
          userData: {
            name: this.name,
            email: this.email,
            hangoutsId: this.hangoutsId,
          },
          meetingId: this.meetingId,
        }));
        resolve();
      });
      
      this.socket.on('message', data => {
        this.messages.push(data);
        this.nexMessage.resolve();
        this.nexMessage = new LinearPromise();
      });
    });
  }

  nextMessage() {
    return new Promise(resolve => {
      if (this.messages.length) {
        resolve(JSON.parse(this.messages.shift()));
      } else {
        this.nexMessage.promise.then(() => {
          resolve(JSON.parse(this.messages.shift()));
        });
      }
    });
  }

  close() {
    return new Promise(resolve => {
      this.socket.on('close', resolve)
      this.socket.close(0, 'Test Run');
    });
  }

  forceClose() {
    return new Promise(resolve => {
      this.socket.terminate();
      this.nexMessage = null;
      resolve();
    });
  }
}