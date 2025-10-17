import './App.css';
import React from 'react';
import LetterBox from './LetterBox';
import SingleLetterSearchbar from './SingleLetterSearchBar';

const pics = ['noose.png', 'upperBody.png', 'upperandlowerbody.png', '1arm.png', 'botharms.png', '1leg.png', 'Dead.png'];
const words = ["Morehouse", "Spelman", "Basketball", "Table", "Museum", "Excellent", "Fun", "React"];

class HangmanGame extends React.Component {
  state = {
    wordList: [],
    curWord: 0,
    lifeLeft: 0,
    usedLetters: [],
    revealedLetters: [],
    gameWon: false,
    gameLost: false
  };

  componentDidMount() {
    this.setState({ wordList: words });
  }

  startNewGame = () => {
    const randomIndex = Math.floor(Math.random() * words.length);
    const newWord = words[randomIndex];
    this.setState({
      curWord: randomIndex,
      lifeLeft: 0,
      usedLetters: [],
      revealedLetters: Array(newWord.length).fill(false),
      gameWon: false,
      gameLost: false
    });
  };

  guess = (letter) => {
    const { curWord, wordList, usedLetters, lifeLeft, revealedLetters, gameWon, gameLost } = this.state;
    if (gameWon || gameLost) return;
    
    const word = wordList[curWord]?.toLowerCase();
    const lowerLetter = letter.toLowerCase();

    if (!word || usedLetters.includes(lowerLetter)) return;

    let newUsedLetters = [...usedLetters, lowerLetter];
    let newRevealed = [...revealedLetters];
    let newLife = lifeLeft;

    if (word.includes(lowerLetter)) {
      for (let i = 0; i < word.length; i++) {
        if (word[i].toLowerCase() === lowerLetter) newRevealed[i] = true;
      }
    } else {
      newLife = Math.min(pics.length - 1, lifeLeft + 1);
    }

    const allRevealed = newRevealed.length > 0 && newRevealed.every(val => val === true);
    const lost = newLife === pics.length - 1;

    this.setState({
      usedLetters: newUsedLetters,
      revealedLetters: newRevealed,
      lifeLeft: newLife,
      gameWon: allRevealed,
      gameLost: lost
    });
  };

  render() {
    const { wordList, curWord, lifeLeft, revealedLetters, usedLetters, gameWon, gameLost } = this.state;
    const word = wordList[curWord];

    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <img src={`${process.env.PUBLIC_URL}/${pics[lifeLeft]}`} alt="hangman" style={{ width: '200px' }} />
        <div>
          <button onClick={this.startNewGame}>New Game</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>
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
                  borderRadius: '8px'
                }}
                letterStyle={{
                  color: 'white',
                  fontSize: '30px',
                  fontWeight: 'bold'
                }}
              />
            ))}
        </div>

        <div style={{ marginTop: '20px' }}>
          <SingleLetterSearchbar onSearch={this.guess}></SingleLetterSearchbar>
        </div>

        <p style={{ marginTop: '10px' }}>Used Letters: {usedLetters.join(', ')}</p>

        {gameWon && (
          <p style={{ color: 'green', fontSize: '24px', fontWeight: 'bold', marginTop: '15px' }}>
            You Won!
          </p>
        )}

        {gameLost && (
          <p style={{ color: 'red', fontSize: '24px', fontWeight: 'bold', marginTop: '15px' }}>
            You Lose! The word was: {word}
          </p>
        )}
      </div>
    );
  }
}

export default HangmanGame;
