class Player {
  get hangoutsId() {
    throw new Error('Method not implemented');
  }

  get name() {
    throw new Error('Method not implemented');

  }

  get groupId() {
    throw new Error('Method not implemented');
  }

  onSendNewState() {
    throw new Error('Method not implemented');
  }

  sendNewState(newState) {
    this.onSendNewState(newState);
  }

  onDisconnect() {
    throw new Error('Method not implemented');
  }

  onDisconnected() {
    throw new Error('Method not implemented');
  }

  disconnected() {
    this.onDisconnected();
  }

  disconnect(reason) {
    this.onDisconnect(reason);
    this.disconnected();
  }

  onRequestStateUpdate() {
    throw new Error('Method not implemented');
  }

  requestStateUpdate(newState) {
    this.onRequestStateUpdate(newState, this);
  }

  toString() {
    return JSON.stringify({ id: this.id, hangoutsId: this.hangoutsId, name: this.name, groupId: this.groupId });
  }
}

const ErrorCodes = {
  INVALID_EMAIL: 0,
  INVALID_NAME: 1,
  INVALID_ID: 2,
};

class PlayerError extends Error {
  constructor(code, ...other) {
    super(...other);
    this.code = code;
  }
}

class PlayerInformationError extends PlayerError {
  static ExpectedErrorCodes = Object.freeze([
    ErrorCodes.INVALID_EMAIL,
    ErrorCodes.INVALID_NAME,
    ErrorCodes.INVALID_ID,
  ]);
};

const Errors = {
  PlayerError,
  PlayerInformationError,
  Codes: ErrorCodes,
};

module.exports = {
  Player,
  Errors
};
