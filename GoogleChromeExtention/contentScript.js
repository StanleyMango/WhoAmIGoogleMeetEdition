(() => {
  const GameStatuses = Object.freeze({
    NEVER_PLAYED: -1,
    CONFIGURING: 0,
    PLAYING: 1,
    COMPLETED: 2,
    DISCONNECTED: 3,
  });

  const GameActions = Object.freeze({
    END_TURN: 0,
  });
  
  const whoAmIGame = new WhoAmIGame();
  whoAmIGame.start();

  function WhoAmIGame() {
    this.isPlaying = () => { return props.status !== GameStatuses.DISCONNECTED; };
    this.stop = () => { socket.close(); };

    let props;
    let state;
    let userData;
    let connectionOpened;
    let tilesParentElm;
    let tilesParentObserver;
    let renderAnimationFrameId;
    let tileElmsObserver;

    this.start = () => {
      props = {
        status: GameStatuses.DISCONNECTED,
      };
      state = {
        hangoutsIdToPG: new Map(),
        myTurn: false,
      }
      if (!isInAMeeting()) {
        alert('Please join a meeting first');
        return;
      }
      if (!userData) {
        openMeetingParticipantsMenu();
        userData = retrieveUserData();
      }
      connectionOpened = false;
      tilesParentElm = null;
      tilesParentObserver = null;
      renderAnimationFrameId = null;
      tileElmsObserver = new Map();

      // Create WebSocket connection.
      const socket = new WebSocket('ws://localhost:8080', 'play-who-am-i');

      // Connection opened
      socket.addEventListener('open', function (event) {
        connectionOpened = true;
        socket.send(JSON.stringify({
          userData, // email, hangoutsId, name
          meetingId: getMeetingId(),
        }));
      });
      
      // Listen for messages
      socket.addEventListener('message', function (event) {
        try {
          const { action, data, error } = JSON.parse(event.data);
          if (error) {
            console.error(error);
            alert(`Leaving the game. A unexpected error occurred when talking to the server: ${error.message}`);
            socket.close();
          }
      
          switch(action) {
            case 'update':
              setProps(data);
              break;
          }
        } catch (error) {
          console.error(error);
          alert(`Leaving the game. Encountered an error occurred with the extension: ${error}`);
          socket.close();
        }
      });

      // Listen for errors
      socket.addEventListener('error', function () {
        if (!connectionOpened) {
          alert('Failed to establish a connection with the game server!');
        } else {
          alert('Game ended due to error');
        }
      });

      // Listen for disconnection
      socket.addEventListener('close', function () {
        setProps({ status: GameStatuses.DISCONNECTED });

        if (connectionOpened) {
          alert('Disconnected from game');
        }

        const statusElm = document.querySelector('.smWhoAmIStatus');
        if (statusElm) document.body.removeChild(statusElm);

        for (const [elm, childObserver] of tileElmsObserver.entries()) {
          let tileWhoAmIElm = elm.querySelector('.smTileElm');
          if (tileWhoAmIElm) {
            elm.removeChild(tileWhoAmIElm);
          }
          childObserver.disconnect();
        }
        if (tilesParentObserver) {
          tilesParentObserver.disconnect();
        }
      });
    }

    function endTurn() {
      socket.send(JSON.stringify({ action: GameActions.END_TURN }));
    }

    function parentObserverCallback(mutationsList) {
      for (const mutation of mutationsList) {
        for (const childElm of mutation.addedNodes) {
          addObserverForChildElm(childElm);
        }
        for (const childElm of mutation.removedNodes) {
          const childObserver = tileElmsObserver.get(childElm);
          if (!childObserver) continue;
          tileElmsObserver.delete(childElm);
          childObserver.disconnect();
        }
      }
    }

    function childObserverCallback(mutationsList) {
      for (const mutation of mutationsList) {
        const tileWhoAmIElm = Array.prototype.find.call(mutation.removedNodes,
          nodeElm => nodeElm.classList.contains('smTileElm'));
        if (tileWhoAmIElm) {
          mutation.target.appendChild(tileWhoAmIElm);
        } else if (mutationsList.type === 'attributes' && mutationsList.attributeName === 'data-initial-participant-id') {
          renderTile(mutation.target);
        }
      }
    }

    function addObserverForChildElm(childElm) {
      const childObserver = new MutationObserver(childObserverCallback);
      childObserver.observe(childElm, {attributes: true, childList: true});
      tileElmsObserver.set(childElm, childObserver);
    }

    function getOrCreatElm(parentElm, childElmClassName, type, callback) {
      if (!parentElm) debugger;
      let childElm = parentElm.querySelector(`.${childElmClassName}`);
      if (childElm) return childElm;

      childElm = document.createElement(type);
      childElm.className = childElmClassName;
      if (callback) {
        callback(childElm);
      }
      parentElm.appendChild(childElm);
      return childElm;
    }

    function renderTile(elm) {
      let tileWhoAmIElm = elm.querySelector('.smTileElm');

      const { player, group } = state.hangoutsIdToPG.get(elm.getAttribute('data-initial-participant-id')) || {};

      if (!player) {
        if (tileWhoAmIElm) {
          elm.removeChild(tileWhoAmIElm);
        }
        return;
      }

      tileWhoAmIElm = getOrCreatElm(elm, 'smTileElm', 'div');
      const characterNameElm = getOrCreatElm(tileWhoAmIElm, 'smTileCharacterName', 'span');

      if (characterNameElm.innerText !== group.character.name) {
        characterNameElm.innerText = `${group.character.name} (${group.guessesRemainingCount}/${props.startingGuessCount})`;
      }

      if (player.isOnline) {
        tileWhoAmIElm.classList.add('smTileOnline');
        tileWhoAmIElm.classList.remove('smTileOffline');
      } else {
        tileWhoAmIElm.classList.remove('smTileOnline');
        tileWhoAmIElm.classList.add('smTileOffline');
      }
    
      if (group.isMyTurn) {
        tileWhoAmIElm.classList.add('smTileMyTurn');
      } else {
        tileWhoAmIElm.classList.remove('smTileMyTurn');
      }
    }

    function requestRender() {
      if (renderAnimationFrameId === null) {
        renderAnimationFrameId = requestAnimationFrame(() => {
          renderAnimationFrameId = null;
          render();
        });
      }
    }

    function getMyStatus() {
      if (state.hangoutsIdToPG && state.hangoutsIdToPG.has(userData.hangoutsId)) {
        const { group } = state.hangoutsIdToPG.get(userData.hangoutsId);
        return {
          myTurn: !!group.isMyTurn,
          guessesRemainingStr: `${group.guessesRemainingCount}`,
        };
      } else {
        return {
          myTurn: false,
          guessesRemainingStr: '-',
        };
      }
    }

    function render() {
      if (props.status === GameStatuses.COMPLETED) {
        alert('The game has ended.\nThanks for playing!');
        socket.close();
        return;
      } else if (props.status === GameStatuses.PLAYING) {
        if (tilesParentElm === null) {
          tilesParentElm = document.querySelector('[data-initial-participant-id]').parentElement;
          tilesParentObserver = new MutationObserver(parentObserverCallback);
          tilesParentObserver.observe(tilesParentElm, {childList: true}); // Child added or removed
          for (const childElm of tilesParentElm.children) {
            addObserverForChildElm(childElm);
          }
        }

        for (const child of tilesParentElm.children) {
          renderTile(child);
        }
      
        const statusElm = getOrCreatElm(document.body, 'smWhoAmIStatus', 'div');
        const guessesRemainingElm = getOrCreatElm(statusElm, 'smRemainingGuesses', 'div');
        const myState = getMyStatus();
        guessesRemainingElm.innerText = `Guesses Remaining: ${myState.guessesRemainingStr}/${props.startingGuessCount}`;
        if (myState.myTurn) {
          statusElm.classList.add('smMyTurn');
        } else {
          statusElm.classList.remove('smMyTurn');
        }

        getOrCreatElm(statusElm, 'smLeaveBtn', 'button', elm => {
          elm.innerText = 'Leave';
          elm.onclick = () => {
            this.stop();
          };
        });

        const endTurnBtn = getOrCreatElm(statusElm, 'smEndTurnBtn', 'button', elm => {
          elm.innerText = 'End Turn';
          elm.onclick = () => {
            endTurn();
          };
        });
        endTurnBtn.disabled = !myState.myTurn;
      }
    }

    function setProps(newProps) {
      if (newProps.playerGroups) {
        const hangoutsIdToPG = new Map();
        for (const playerGroup of newProps.playerGroups) {
          for (const player of Object.values(playerGroup.players)) {
            hangoutsIdToPG.set(player.hangoutsId, { player, group: playerGroup });
          }
        }
        setState({ hangoutsIdToPG });
      }
      props = {...props, ...newProps};
      // console.log('Props Updated', props);
      requestRender();
    }
    
    function setState(newState) {
      state = {...state, ...newState};
      // console.log('State Updated', props);
      requestRender();
    }

    function getEmail() {
      // const globalVars = window[Object.keys(window).filter(k => k.match(/_global_data$/))];
      const globalVars = JSON.parse(([...document.scripts].filter(k => k.innerHTML.match(/_global_data =/)))[0].innerHTML.match(/(\{.+);$/)[1]);
      return Object.values(globalVars)
        .filter(v => typeof v === 'string' && v.match(/([a-zA-Z]|\d|\.)+@gmail.com$/))[0];
    }

    function mapPersonListItemToPersonObject(participantMenuElm) {
      return {
        hangoutsId: participantMenuElm.getAttribute('data-participant-id'),
        name: participantMenuElm.querySelector('div:first-child span:first-child').innerText,
      };
    }
    
    function isInAMeeting() {
      return !!(document.body.querySelector('[data-unresolved-meeting-id][__is_owner]')
        && document.querySelector('div[data-tab-id="1"]'));
    }

    function getMeetingId() {
      return window.location.pathname.match(/[a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{3}/)[0];
    }

    function openMeetingParticipantsMenu() {
      document.querySelector('div[data-tab-id="1"]').click();
    }

    function retrieveUserData() {
      return {
        email: getEmail(),
        ...mapPersonListItemToPersonObject(document.querySelector('div[role="list"] div[role="listitem"]')),
      };
    }
  }

  chrome.runtime.onMessage.addListener(
    function(request, _, sendResponse) {
      if (request.query ==='code status') {
        sendResponse({status: whoAmIGame.isPlaying() ? GameStatuses.PLAYING : GameStatuses.DISCONNECTED});
      } else if (request.query === 'play again' && !whoAmIGame.isPlaying()) {
        whoAmIGame.start();
        sendResponse();
      } else if (request.query === 'stop game' && whoAmIGame.isPlaying()) {
        whoAmIGame.stop();
      }
    }
  );

})();
