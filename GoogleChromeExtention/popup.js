const GameStatuses = Object.freeze({
  NEVER_PLAYED: -1,
  CONFIGURING: 0,
  PLAYING: 1,
  COMPLETED: 2,
  DISCONNECTED: 3,
});

let playGame = document.getElementById('playGame');
let gameStatus;

// chrome.storage.sync.get('color', function (data) {
//   playGame.style.backgroundColor = data.color;
//   playGame.setAttribute('value', data.color);
// });

function askOpenPageOrTimeout(message, waitMs) {
  return new Promise(resolve => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (waitMs) setTimeout(resolve, waitMs);
      chrome.tabs.sendMessage(tabs[0].id, message, resolve);
    });
  });
}

function injectGameCodeIntoOpenPage() {
  return new Promise(resolve => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.insertCSS(
        tabs[0].id,
        { file: './contentScript.css' }
      );
      chrome.tabs.executeScript(
        tabs[0].id,
        { file: './contentScript.js' }
      );
      resolve();
    });
  });
}

askOpenPageOrTimeout({ query: 'code status' }, 200)
  .then(response => {
    if (!response || !Object.values(GameStatuses).includes(response.status)) {
      gameStatus = GameStatuses.NEVER_PLAYED;
    } else {
      gameStatus = response.status;
    }
  
    if (gameStatus === GameStatuses.PLAYING) {
      playGame.innerText = 'Leave';
    }
    playGame.disabled = false;
  });

playGame.onclick = function () {
  let gameStartedPromise;
  if (gameStatus === GameStatuses.PLAYING) {
    gameStartedPromise = askOpenPageOrTimeout({ query: 'stop game' });
  } else {
    gameStartedPromise = gameStatus === GameStatuses.NEVER_PLAYED
      ? injectGameCodeIntoOpenPage()
      : askOpenPageOrTimeout({ query: 'play again' });
  }

  gameStartedPromise.then(window.close);
};