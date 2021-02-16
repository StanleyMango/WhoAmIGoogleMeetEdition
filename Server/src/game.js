// [Will NOT Do] TODO:
// Make a webpage that that uses this [Forget that]
//  - Group ID will be a timestamp stored in local storage or cookies
//  - Meeting ID will be an input
//  - Duplicate names will be allowed

const { Player: AbstractPlayer, Errors: PlayerErrors } = require('./player');

const GameStatuses = Object.freeze({
  CONFIGURING: 0,
  PLAYING: 1,
  COMPLETED: 2,
});

const GameActions = Object.freeze({
  END_TURN: 0,
});

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

class WhoAmIPlayer extends AbstractPlayer {
  #name;
  #email;
  #hangoutsId;
  isOnline = false;

  constructor({ email, hangoutsId, name } = {}) {
    super();
    if (typeof email !== 'string') {
      throw new PlayerErrors.PlayerInformationError(PlayerErrors.Codes.INVALID_EMAIL, `Email must be as string not ${typeof email}`);
    } else if (!email.match(/([a-zA-Z]|\d|\.)+@gmail.com$/)) {
      throw new PlayerErrors.PlayerInformationError(PlayerErrors.Codes.INVALID_EMAIL, `Email must be in the format ([a-zA-Z]|\d|\.)+@gmail.com: received '${email}'`);
    }

    if (typeof hangoutsId !== 'string') {
      throw new PlayerErrors.PlayerInformationError(PlayerErrors.Codes.INVALID_ID, `Id must be as string not ${typeof id}`);
    } else if (hangoutsId.length <= 0) {
      throw new PlayerErrors.PlayerInformationError(PlayerErrors.Codes.INVALID_ID, 'Id can not be empty');
    }

    if (typeof name !== 'string') {
      throw new PlayerErrors.PlayerInformationError(PlayerErrors.Codes.INVALID_NAME, `Name must be as string not ${typeof name}`);
    } else if (name.length <= 0) {
      throw new PlayerErrors.PlayerInformationError(PlayerErrors.Codes.INVALID_NAME, 'Name can not be empty');
    }

    this.#email = email;
    this.#hangoutsId = hangoutsId;
    this.#name = name;
  }

  get hangoutsId() { return this.#hangoutsId; }
  get name() { return this.#name; }
  get groupId() { return this.#email; }
}

class PlayerManager {
  #onlinePlayerInstanceCount = 0;
  #playerInstances = new Map();
  #guessesRemainingCount;
  #id;
  isMyTurn = false;

  constructor(id, numOfStartingGuesses, character) {
    this.#guessesRemainingCount = numOfStartingGuesses;
    this.#id = id;
    // this.#handleStateUpdateRequest = this.#handleStateUpdateRequest.bind(this);
    this.character = character;
  }

  kick() {
    for (const playerInstance of this.#playerInstances.values()) {
      playerInstance.disconnect();
    }
  }

  addPlayerInstance(instance) {
    if (this.#playerInstances.has(instance.id)) {
      const existingInstance = this.#playerInstances.get(instance.id);
      existingInstance.onRequestStateUpdate = null;
      existingInstance.onDisconnected = null;
      existingInstance.disconnect();
    }
    this.#playerInstances.set(instance.id, instance);
    this.#onlinePlayerInstanceCount += 1;
    instance.isOnline = true;
    instance.onRequestStateUpdate = this.#handleStateUpdateRequest;
    instance.onDisconnected = () => {
      this.#onlinePlayerInstanceCount -= 1;
      instance.isOnline = false;
      if (this.#onlinePlayerInstanceCount === 0 && this.isMyTurn) {
        this.endTurn();
      }
      this.onPlayerStateChange();
    };
    this.onPlayerStateChange();
  }

  get canHaveATurn() {
    return this.#onlinePlayerInstanceCount > 0 && this.#guessesRemainingCount > 0;
  }

  get state() {
    const result = {
      character: this.character,
      guessesRemainingCount: this.#guessesRemainingCount,
      players: {},
    };
    if (this.isMyTurn) {
      result.isMyTurn = true;
    }
    for (const playerInstance of this.#playerInstances.values()) {
      result.players[playerInstance.id] = {
        id: playerInstance.id,
        name: playerInstance.name,
        isOnline: playerInstance.isOnline,
        hangoutsId: playerInstance.hangoutsId,
      };
    }
    return result;
  }

  #handleStateUpdateRequest = (newState) => {
    if (typeof newState !== 'object') {
      throw new TypeError(`Invalid state type: "${typeof newState}"`);
    }

    if (typeof newState.action !== 'number') {
      throw new TypeError(`Invalid action provided: "${typeof newState.action}"`);
    }

    switch (newState.action) {
      case GameActions.END_TURN:
        if (!this.isMyTurn) {
          throw new Error(`Player ${this.toString()} tried to end their turn when it is not their turn`);
        }
        this.#guessesRemainingCount -= 1;
        this.endTurn();
        break;
      default:
        throw new Error(`Unknown action Provided "${newState.action}"`);
    }
  }

  toString() {
    let result = {
      isMyTurn,
      id: this.#id,
      guessesRemainingCount: this.#guessesRemainingCount,
      onlinePlayerInstanceCount: this.#onlinePlayerInstanceCount,
      instance: [],
    };
    if (this.#playerInstances.length) {
      for (const instance of this.#playerInstances) {
        return result.instance.push(instance);
      }
    }
    return JSON.stringify(result);
  }

  get guessesRemainingCount() {
    return this.#guessesRemainingCount;
  }

  onPlayerStateChange() {
    throw new Error('Method not implemented');
  }

  endTurn() {
    this.isMyTurn = false;
    this.onEndTurn();
  }

  onEndTurn() {
    throw new Error('Method not implemented');
  }

  sendNewState(state) {
    for (const playerInstance of this.#playerInstances.values()) {
      playerInstance.sendNewState(state);
    }
  }
}

class Game {
  static Player = WhoAmIPlayer;
  #currentTurn = -1; // Index of `this.#playerManagersArray`
  #playerManagersArray = [];
  #playerManagers = new Map();
  #status = GameStatuses.PLAYING;
  #playerIdIncrementCounter = 0;
  #startingGuessCount = 2;

  _nextPerson = 0; // TODO, better character picker
  getRndPerson() {
    return whoAmICharacters[this._nextPerson++];
  }

  addPlayer(player) {
    if (player === null) {
      throw new TypeError('Player can not be null');
    } else if (!(player instanceof Game.Player)) {
      throw new TypeError('Player is an invalid type');
    }

    let playerManager;
    if (this.#playerManagers.has(player.groupId)) {
      playerManager = this.#playerManagers.get(player.groupId);
    } else {
      playerManager = new PlayerManager(player.groupId, this.#startingGuessCount, this.getRndPerson()); // TODO, better character picker
      playerManager.onPlayerStateChange = this.#update.bind(this);
      playerManager.onEndTurn = this.#updateNextTurn.bind(this);
      if (this.#currentTurn === -1) {
        playerManager.isMyTurn = true;
        this.#currentTurn = 0;
      }
      this.#playerManagers.set(player.groupId, playerManager);
      this.#playerManagersArray.push(playerManager);
    }

    player.id = this.#playerIdIncrementCounter++;
    playerManager.addPlayerInstance(player);
  }

  #nextTurnIndex() {
    let nextPlayer = (this.#currentTurn + 1) % this.#playerManagersArray.length;
    const cycleDetectionTopIndex = nextPlayer;

    do {
      if (this.#playerManagersArray[nextPlayer].canHaveATurn) {
        return nextPlayer;
      }
      nextPlayer = (nextPlayer + 1) % this.#playerManagersArray.length;
    } while (nextPlayer !== cycleDetectionTopIndex);

    return -1;
  }

  onEndGame() {
    throw new Error('Method not implemented');
  }

  endGame() {
    for (const playerManager of this.#playerManagers.values()) {
      playerManager.kick();
    }
    this.onEndGame();
  }

  #updateNextTurn() {
    let nextPlayer = this.#nextTurnIndex();
    if (this.#currentTurn !== -1) {
      this.#playerManagersArray[this.#currentTurn].isMyTurn = false;
    }
    if (nextPlayer === -1) {
      this.#status = GameStatuses.COMPLETED;
      this.#currentTurn = -2;
      this.#update();
      this.endGame();
      return;
    } else {
      this.#playerManagersArray[nextPlayer].isMyTurn = true;
    }
    this.#currentTurn = nextPlayer;
    this.#update();
  }

  #update() {
    if (this.#status === GameStatuses.COMPLETED) {
      for (const playerManager of this.#playerManagers.values()) {
        playerManager.sendNewState({ status: this.#status });
      }
    } else if (this.#status === GameStatuses.PLAYING) {
      const currentState = {
        startingGuessCount: this.#startingGuessCount,
        status: this.#status,
        playerGroups: [],
      };
  
      for (const playerManager of this.#playerManagers.values()) {
        currentState.playerGroups.push(playerManager.state);
      }
  
      for (const playerManager of this.#playerManagers.values()) {
        playerManager.sendNewState(currentState);
      }
    }
  }
}

module.exports = Game;