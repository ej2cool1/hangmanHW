// HangmanGame.js
import './App.css';
import React from 'react';
import LetterBox from './LetterBox';
import SingleLetterSearchbar from './SingleLetterSearchBar';

const pics = [
  'noose.png',
  'upperBody.png',
  'upperandlowerbody.png',
  '1arm.png',
  'botharms.png',
  '1leg.png',
  'Dead.png',
];

const words = [
  'Morehouse',
  'Spelman',
  'Basketball',
  'Table',
  'Museum',
  'Excellent',
  'Fun',
  'React',
];

class HangmanGame extends React.Component {
  state = {
    wordList: [],
    curWord: 0,
    lifeLeft: 0,
    usedLetters: [],
    revealedLetters: [],
    gameWon: false,
    gameLost: false,

    // player/login state
    currentPlayer: null, // { playerName, wins, losses, winPercentage? }
    isLoggedIn: false,
    showLogin: true,
    loginInput: '',
    // IMPORTANT: default to your API port
    apiBase: process.env.REACT_APP_API_BASE || 'http://localhost:3001',
  };

  componentDidMount() {
    // Restore player from localStorage if present
    const saved = localStorage.getItem('hangman_current_player');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p && p.playerName) {
          this.setState({
            currentPlayer: p,
            isLoggedIn: true,
            showLogin: false,
          });
        }
      } catch (e) {
        console.error('Failed to parse saved player', e);
      }
    }
    this.startNewGame();
  }

  // ---------- LOGIN / PLAYER LOGIC -----------------------------------------

  handleLoginInputChange = (e) => {
    this.setState({ loginInput: e.target.value });
  };

  handleLogin = async () => {
    const name = (this.state.loginInput || '').trim();
    if (!name) {
      alert('Please enter a name');
      return;
    }

    try {
      // 1) Try GET /player?playerName=NAME
      const query = new URLSearchParams({ playerName: name }).toString();
      const resp = await fetch(`${this.state.apiBase}/player?${query}`);

      if (resp.ok) {
        const data = await resp.json();
        if (data && data.playerName) {
          // existing player found
          this.setState({
            currentPlayer: data,
            isLoggedIn: true,
            showLogin: false,
            loginInput: '',
          });
          localStorage.setItem(
            'hangman_current_player',
            JSON.stringify(data)
          );
          return;
        }
      }

      // 2) If not found (or non-OK), create new player with POST /player
      const createResp = await fetch(`${this.state.apiBase}/player`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: name, wins: 0, losses: 0 }),
      });

      if (!createResp.ok) {
        throw new Error(`Failed to create player (status ${createResp.status})`);
      }

      const created = await createResp.json();
      this.setState({
        currentPlayer: created,
        isLoggedIn: true,
        showLogin: false,
        loginInput: '',
      });
      localStorage.setItem(
        'hangman_current_player',
        JSON.stringify(created)
      );
    } catch (err) {
      console.error('Login/create error', err);
      alert('There was an error contacting the server. Check the console.');
    }
  };

  logout = () => {
    localStorage.removeItem('hangman_current_player');
    this.setState({
      currentPlayer: null,
      isLoggedIn: false,
      showLogin: true,
    });
  };

  // ---------- GAME LOGIC ---------------------------------------------------

  startNewGame = () => {
    const wordList = words;
    if (wordList.length === 0) return;

    const randomIndex = Math.floor(Math.random() * wordList.length);
    const newWord = wordList[randomIndex];

    this.setState({
      wordList,
      curWord: randomIndex,
      lifeLeft: 0,
      usedLetters: [],
      revealedLetters: Array(newWord.length).fill(false),
      gameWon: false,
      gameLost: false,
    });
  };

  guess = (letter) => {
    const {
      curWord,
      wordList,
      usedLetters,
      lifeLeft,
      revealedLetters,
      gameWon,
      gameLost,
    } = this.state;

    if (gameWon || gameLost) return;

    const word = wordList[curWord]?.toLowerCase();
    if (!word) return;

    const lowerLetter = (letter || '').toLowerCase();
    if (!lowerLetter) return;

    // Avoid duplicates in used letters
    let newUsedLetters = usedLetters;
    if (!usedLetters.includes(lowerLetter)) {
      newUsedLetters = [...usedLetters, lowerLetter];
    }

    let newRevealed = [...revealedLetters];
    let newLife = lifeLeft;

    if (word.includes(lowerLetter)) {
      // Reveal all positions where this letter occurs
      for (let i = 0; i < word.length; i++) {
        if (word[i] === lowerLetter) {
          newRevealed[i] = true;
        }
      }
    } else {
      // Wrong guess → move to next hangman image (up to last)
      newLife = Math.min(pics.length - 1, lifeLeft + 1);
    }

    const allRevealed =
      !!word &&
      newRevealed.length === word.length &&
      newRevealed.every((v) => v === true);

    const lost = newLife === pics.length - 1;

    // Update state then check end-of-game result
    this.setState(
      {
        usedLetters: newUsedLetters,
        revealedLetters: newRevealed,
        lifeLeft: newLife,
        gameWon: allRevealed,
        gameLost: lost,
      },
      () => {
        if (this.state.gameWon) {
          this.handleGameOver('win');
        } else if (this.state.gameLost) {
          this.handleGameOver('loss');
        }
      }
    );
  };

  // ---------- GAME OVER → UPDATE PLAYER (Dynamo via API) -------------------

  handleGameOver = async (result) => {
    const { currentPlayer, apiBase } = this.state;
    if (!currentPlayer || !currentPlayer.playerName) {
      // Not logged in — nothing to update
      return;
    }

    // Optimistic update (update UI first)
    const updated = { ...currentPlayer };
    if (result === 'win') {
      updated.wins = (updated.wins || 0) + 1;
    } else {
      updated.losses = (updated.losses || 0) + 1;
    }

    const total = (updated.wins || 0) + (updated.losses || 0);
    updated.winPercentage =
      total > 0 ? Math.round((updated.wins / total) * 100) : 0;

    this.setState({ currentPlayer: updated });
    localStorage.setItem(
      'hangman_current_player',
      JSON.stringify(updated)
    );

    // Then PUT to backend to persist in Dynamo
    try {
      const resp = await fetch(`${apiBase}/player`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: updated.playerName,
          wins: updated.wins,
          losses: updated.losses,
        }),
      });

      if (!resp.ok) {
        console.error('PUT /player failed', await resp.text());
      }
    } catch (err) {
      console.error('Failed to PUT player update', err);
    }
  };

  // ---------- RENDER -------------------------------------------------------

  render() {
    const {
      wordList,
      curWord,
      lifeLeft,
      revealedLetters,
      usedLetters,
      gameWon,
      gameLost,
      isLoggedIn,
      showLogin,
      loginInput,
      currentPlayer,
    } = this.state;

    const word = wordList[curWord];

    const winPct =
      currentPlayer && typeof currentPlayer.winPercentage !== 'undefined'
        ? currentPlayer.winPercentage
        : currentPlayer &&
          ((currentPlayer.wins || 0) || (currentPlayer.losses || 0))
        ? Math.round(
            ((currentPlayer.wins || 0) /
              ((currentPlayer.wins || 0) + (currentPlayer.losses || 0))) *
              100
          )
        : 0;

    return (
      <div
        data-testid="hangman-game"
        style={{ textAlign: 'center', padding: '20px' }}
      >
        {/* Header showing player info */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            {isLoggedIn && currentPlayer ? (
              <div>
                <strong data-testid="player-name">
                  {currentPlayer.playerName}
                </strong>
                <div data-testid="player-stats">
                  Wins: {currentPlayer.wins} | Losses:{' '}
                  {currentPlayer.losses} | Win%: {winPct}%
                </div>
              </div>
            ) : (
              <div data-testid="no-player">Not logged in</div>
            )}
          </div>

          <div>
            {isLoggedIn ? (
              <button onClick={this.logout}>Logout</button>
            ) : null}
          </div>
        </div>

        {/* Hangman image */}
        <img
          src={`${process.env.PUBLIC_URL}/${pics[lifeLeft]}`}
          alt="hangman"
          data-testid="hangman-image"
          style={{ width: '200px', marginTop: '12px' }}
        />

        {/* New game button */}
        <div style={{ marginTop: '12px' }}>
          <button data-testid="new-game-btn" onClick={this.startNewGame}>
            New Game
          </button>
        </div>

        {/* Word display */}
        <div
          data-testid="word-container"
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '20px',
            flexWrap: 'wrap',
          }}
        >
          {word &&
            word.split('').map((letter, i) => (
              <LetterBox
                key={i}
                letter={revealedLetters[i] ? letter : ''}
                isVisible={true}
                boxStyle={{
                  backgroundColor: 'lightblue',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                }}
                letterStyle={{
                  color: 'white',
                  fontSize: '30px',
                  fontWeight: 'bold',
                }}
              />
            ))}
        </div>

        {/* Single-letter guess input */}
        <div style={{ marginTop: '20px' }}>
          <SingleLetterSearchbar onSearch={this.guess} />
        </div>

        {/* Used letters */}
        <p data-testid="used-letters" style={{ marginTop: '10px' }}>
          Used Letters: {usedLetters.join(', ')}
        </p>

        {/* Win/Lose messages */}
        {gameWon && (
          <p
            data-testid="win-message"
            style={{
              color: 'green',
              fontSize: '24px',
              fontWeight: 'bold',
              marginTop: '15px',
            }}
          >
            You Won!
          </p>
        )}

        {gameLost && (
          <p
            data-testid="lose-message"
            style={{
              color: 'red',
              fontSize: '24px',
              fontWeight: 'bold',
              marginTop: '15px',
            }}
          >
            You Lose! The word was: {word}
          </p>
        )}

        {/* Login form (hidden after login) */}
        {showLogin && (
          <div style={{ marginTop: '20px' }} data-testid="login-form">
            <input
              aria-label="player-name-input"
              type="text"
              placeholder="Enter name"
              value={loginInput}
              onChange={this.handleLoginInputChange}
            />
            <button
              data-testid="login-btn"
              onClick={this.handleLogin}
            >
              Login / Create
            </button>
          </div>
        )}
      </div>
    );
  }
}

export default HangmanGame;
