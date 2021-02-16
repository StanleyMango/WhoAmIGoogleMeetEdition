const Game = require('./game');

// const game = new Game();

const player = new Game.Player({ name: 'fw', email: 'abc@google.com', id: '123' });

console.log(player.toString());