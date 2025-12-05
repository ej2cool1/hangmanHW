import { render, screen } from '@testing-library/react';
import LetterBox from './LetterBox';

describe('LetterBox Component', () => {
  test('renders the letter when visible', () => {
    render(
      <LetterBox
        letter="A"
        isVisible={true}
        boxStyle={{ backgroundColor: 'lightblue' }}
        letterStyle={{ color: 'yellow' }}
      />
    );

    // Letter should be there and visible
    const letterSpan = screen.getByText('A');
    expect(letterSpan).toBeInTheDocument();
    expect(letterSpan).toHaveStyle('visibility: visible');
    expect(letterSpan).toHaveStyle('color: yellow');
  });

  test('hides the letter when isVisible is false', () => {
    render(
      <LetterBox
        letter="B"
        isVisible={false}
        boxStyle={{ backgroundColor: 'lightblue' }}
        letterStyle={{ color: 'red' }}
      />
    );

    // The span is still in the DOM, but visually hidden via CSS
    const letterSpan = screen.getByText('B');
    expect(letterSpan).toBeInTheDocument();
    expect(letterSpan).toHaveStyle('visibility: hidden');
  });

  test('updates letter and styles when props change (using rerender)', () => {
    const { rerender } = render(
      <LetterBox
        letter="X"
        isVisible={true}
        boxStyle={{ backgroundColor: 'lightblue' }}
        letterStyle={{ color: 'white' }}
      />
    );

    // Initial render assertions
    let box = screen.getByTestId('letter-box');
    let letterSpan = screen.getByText('X');

    expect(box).toHaveStyle('background-color: lightblue');
    expect(letterSpan).toHaveStyle('color: white');
    expect(letterSpan).toHaveStyle('visibility: visible');

    // 🔁 This mirrors the "rerender" pattern from the tutorial
    rerender(
      <LetterBox
        letter="Z"
        isVisible={true}
        boxStyle={{ backgroundColor: 'pink' }}
        letterStyle={{ color: 'black', fontSize: '40px' }}
      />
    );

    // Now we should see Z instead of X
    expect(screen.queryByText('X')).toBeNull();
    const newSpan = screen.getByText('Z');
    const newBox = screen.getByTestId('letter-box');

    // Styles should reflect the *new* props
    expect(newBox).toHaveStyle('background-color: pink');
    expect(newSpan).toHaveStyle('color: black');
    expect(newSpan).toHaveStyle('font-size: 40px');
  });
});
