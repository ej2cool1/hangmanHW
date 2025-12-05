import { render, screen, fireEvent } from '@testing-library/react';
import HangmanGame from './HangmanGame';

// Mocking LetterBox so tests focus only on HangmanGame logic
jest.mock('./LetterBox', () => ({ letter, boxStyle, letterStyle }) => (
  <div data-testid="letter-box" style={boxStyle}>
    <span style={letterStyle}>{letter}</span>
  </div>
));

// Mock SingleLetterSearchBar to expose buttons for specific guesses
jest.mock('./SingleLetterSearchBar', () => ({ onSearch }) => (
  <div>
    {/* Used as a correct guess when we force the word to contain 'A' */}
    <button data-testid="guess-btn" onClick={() => onSearch('A')}>
      Guess A
    </button>
    {/* 7 guaranteed-wrong letters for all words in the list */}
    {['D', 'G', 'J', 'Q', 'V', 'W', 'Y'].map((ltr, idx) => (
      <button
        key={ltr}
        data-testid={`wrong-btn-${idx}`}
        onClick={() => onSearch(ltr)}
      >
        Guess {ltr}
      </button>
    ))}
  </div>
));

describe('HangmanGame Component', () => {
  test('renders the New Game button and hangman image', () => {
    render(<HangmanGame />);
    expect(screen.getByTestId('new-game-btn')).toBeInTheDocument();
    expect(screen.getByTestId('hangman-image')).toBeInTheDocument();
  });

  test('starts a new game and displays used letters after a guess (user interactivity)', () => {
    render(<HangmanGame />);
    fireEvent.click(screen.getByTestId('new-game-btn'));
    fireEvent.click(screen.getByTestId('guess-btn'));

    const usedLetters = screen.getByTestId('used-letters');
    expect(usedLetters.textContent.toLowerCase()).toContain('a');
  });

  test('reveals a correct guess without losing a life', () => {
    // Force the random word index to be 7 → "React"
    // words = ["Morehouse", "Spelman", "Basketball", "Table", "Museum", "Excellent", "Fun", "React"];
    const mathSpy = jest.spyOn(global.Math, 'random').mockReturnValue(0.875); // floor(0.875 * 8) = 7

    render(<HangmanGame />);
    fireEvent.click(screen.getByTestId('new-game-btn'));

    const imgBefore = screen.getByTestId('hangman-image').getAttribute('src');

    // Guess 'A' which is in "React" → correct guess
    fireEvent.click(screen.getByTestId('guess-btn'));

    const imgAfter = screen.getByTestId('hangman-image').getAttribute('src');
    // Life should NOT change for a correct guess → same image
    expect(imgAfter).toBe(imgBefore);

    // At least one letter box should now show 'A'
    const letterBoxes = screen.getAllByTestId('letter-box');
    const lettersShown = letterBoxes.map((box) => box.textContent.toLowerCase());
    expect(lettersShown).toContain('a');

    mathSpy.mockRestore();
  });

  test('shows image changes when an incorrect guess is made', () => {
    render(<HangmanGame />);
    fireEvent.click(screen.getByTestId('new-game-btn'));

    const imgBefore = screen.getByTestId('hangman-image').getAttribute('src');

    // Click first wrong button once → wrong guess
    fireEvent.click(screen.getByTestId('wrong-btn-0'));

    const imgAfter = screen.getByTestId('hangman-image').getAttribute('src');
    expect(imgBefore).not.toEqual(imgAfter);
  });

  test('displays lose message when lives run out (status showing lives lost)', async () => {
    render(<HangmanGame />);
    fireEvent.click(screen.getByTestId('new-game-btn'));

    // 7 different wrong guesses → reach last hangman stage
    const wrongBtnIds = [
      'wrong-btn-0',
      'wrong-btn-1',
      'wrong-btn-2',
      'wrong-btn-3',
      'wrong-btn-4',
      'wrong-btn-5',
      'wrong-btn-6',
    ];

    wrongBtnIds.forEach((id) => {
      fireEvent.click(screen.getByTestId(id));
    });

    expect(await screen.findByTestId('lose-message')).toBeInTheDocument();
  });
});
