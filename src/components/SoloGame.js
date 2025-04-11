import React, { useEffect, useState, useCallback } from "react";
import "./SoloGame.css";
import wordList from "../data/wordList.json";

const MAX_ATTEMPTS = 6;
const WORD_LENGTH = 5;
const STARTING_HP = 100;
const STARTING_TIME = 60;

function generateWord(wordList) {
  return wordList[Math.floor(Math.random() * wordList.length)].toUpperCase();
}

export default function SoloGame({ selectedWizard, username, onExit }) {
  const [board, setBoard] = useState(Array(MAX_ATTEMPTS).fill("").map(() => Array(WORD_LENGTH).fill("")));
  const [colors, setColors] = useState(Array(MAX_ATTEMPTS).fill("").map(() => Array(WORD_LENGTH).fill("")));
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [targetWord, setTargetWord] = useState(generateWord(wordList));
  const [hp, setHP] = useState(STARTING_HP);
  const [timer, setTimer] = useState(STARTING_TIME);
  const [message, setMessage] = useState("...");
  const [gameOver, setGameOver] = useState(false);
  const [incorrectRows, setIncorrectRows] = useState([]);
  const [spellVisible, setSpellVisible] = useState(false);
  const [spellExploded, setSpellExploded] = useState(false);
  const [fizzleTriggered, setFizzleTriggered] = useState(false);
  const [spellsCast, setSpellsCast] = useState(0);
  const [empowering, setEmpowering] = useState(false);
  
  console.log(targetWord);

  const resetRound = useCallback((success) => {
    if (hp <= 20 && !success) {
      setGameOver(true);
      setMessage("Game Over!");
      return;
    }
    setTimer(STARTING_TIME);
    setCurrentAttempt(0);
    setCurrentLetterIndex(0);
    setBoard(Array(MAX_ATTEMPTS).fill("").map(() => Array(WORD_LENGTH).fill("")));
    setColors(Array(MAX_ATTEMPTS).fill("").map(() => Array(WORD_LENGTH).fill("")));
    setIncorrectRows([]);
    setSpellVisible(false);
    setSpellExploded(false);
    setFizzleTriggered(false);
    setTargetWord(generateWord(wordList));
  }, [hp]);

  const handleFizzle = useCallback(() => {
    setMessage("Spell Fizzled! Cast a New One!");
    setHP((prev) => Math.max(prev - 20, 0));
    setTimeout(() => resetRound(false), 500);
  }, [resetRound]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver) return;
      const key = e.key.toUpperCase();
      if (key === "BACKSPACE") {
        handleBackspace();
      } else if (key === "ENTER") {
        handleSubmit();
      } else if (/^[A-Z]$/.test(key) && currentLetterIndex < WORD_LENGTH) {
        handleLetterInput(key);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  useEffect(() => {
    if (gameOver || fizzleTriggered) return;
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [gameOver, fizzleTriggered]);
  
  useEffect(() => { // Trigger Fizzle ONCE when timer hits 0
    if (timer <= 0 && !gameOver && !fizzleTriggered) {
      setFizzleTriggered(true);
      handleFizzle();
    }
  }, [timer, gameOver, fizzleTriggered, handleFizzle]);

  useEffect(() => {
    if (!spellVisible) return;
    const explodeTimeout = setTimeout(() => {
      setSpellExploded(true);
    }, 750); // spell travel time
  
    const cleanupTimeout = setTimeout(() => {
      setSpellVisible(false);
      setSpellExploded(false);
      resetRound(true);
    }, 750 + 425); 

    return () => {
      clearTimeout(explodeTimeout);
      clearTimeout(cleanupTimeout);
    };
  }, [spellVisible, resetRound]);

  const handleLetterInput = (letter) => {
    const newBoard = [...board];
    newBoard[currentAttempt][currentLetterIndex] = letter;
    setBoard(newBoard);
    setCurrentLetterIndex((prev) => prev + 1);
  };

  const handleBackspace = () => {
    if (currentLetterIndex === 0) return;
    const newBoard = [...board];
    newBoard[currentAttempt][currentLetterIndex - 1] = "";
    setBoard(newBoard);
    setCurrentLetterIndex((prev) => prev - 1);
  };

  const handleSubmit = () => {
    const guess = board[currentAttempt].join("");
    if (guess.length < WORD_LENGTH) {
      setMessage("Not enough letters!");
      return;
    }

    const newColors = Array(WORD_LENGTH).fill("gray");
    const targetLetters = targetWord.split("");

    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guess[i] === targetWord[i]) {
        newColors[i] = "green";
        targetLetters[i] = null;
      }
    }

    for (let i = 0; i < WORD_LENGTH; i++) {
      if (newColors[i] === "green") continue;
      const index = targetLetters.indexOf(guess[i]);
      if (index !== -1) {
        newColors[i] = "yellow";
        targetLetters[index] = null;
      }
    }

    const newColorBoard = [...colors];
    newColorBoard[currentAttempt] = newColors;
    setColors(newColorBoard);

    if (guess === targetWord) {
      setEmpowering(true);
      /*
      setSpellVisible(true);
      //applyWizardEffect();
      setMessage(`Spell Casted! ${selectedWizard.element}`);
      setSpellsCast((prev) => prev + 1);
      */
      setTimeout(() => {
        setEmpowering(false);
        setSpellVisible(true);
        setMessage(`Spell Successfully Casted! ${selectedWizard.element}`);
        setSpellsCast((prev) => prev + 1);
      }, 600); // Adjust time to match your animation
    } else {
      setIncorrectRows([...incorrectRows, currentAttempt]);
      if (currentAttempt + 1 === MAX_ATTEMPTS) {
        handleFizzle();
      } else {
        setCurrentAttempt((prev) => prev + 1);
        setCurrentLetterIndex(0);
      }
    } 
  };

  /*
  const applyWizardEffect = () => {
    if (selectedWizard === "fire") {
      const bonusDamage = (MAX_ATTEMPTS - currentAttempt - 1) * 5;
      setMessage(`🔥 Fire Bonus: +${bonusDamage} damage!`);
      setTimeout(() => {
        setHP((prev) => Math.max(prev - 20 - bonusDamage, 0));
      }, 500);
    } else if (selectedWizard === "ice") {
      setMessage("❄️ Ice Bonus: +10s!");
      setTimer((prev) => prev + 10);
    } else if (selectedWizard === "nature") {
      setMessage("🌿 Nature Bonus: +10 HP!");
      setHP((prev) => Math.min(prev + 10, STARTING_HP));
    } else {
      setHP((prev) => Math.max(prev - 20, 0));
    }
  };
  */
  
  return (
    <div className="solo-game-container">
      <div className="spell-counter">Spells Casted: {spellsCast}</div>
      <button className="exit" onClick={onExit}>Exit</button>
      <div className="game-box">
        <div className="status-header">
          <p className="username">{username} - {hp} HP</p>
          <div className ="banner">
            <img src={`${selectedWizard.img}`} alt="Wizard" className="wizard-icon" />
            <img
              src={spellExploded ? "./images/explode.png" : selectedWizard.spell} alt="Wizard-spell"
              className={`wizard-spell ${spellVisible ? "spell-active" : ""}`}
              style={{ visibility: spellVisible || spellExploded ? "visible" : "hidden" }}
            />
            <img src={`./images/dummy.png`} alt="dummy" className="training-dummy" />
          </div>
          <div className="timer-bar-container">
            <div className="timer-bar" style={{ width: `${(timer / STARTING_TIME) * 100}%` }} />
          </div>
        </div>
  
        <div className="wordle-board">
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className="wordle-row">
              {row.map((letter, colIndex) => (
                <div
                  key={colIndex}
                  className={`wordle-tile ${colors[rowIndex][colIndex]}`}
                >
                  {letter}
                </div>
              ))}
              <span
                className={`row-element ${empowering && rowIndex >= currentAttempt ? "converge-element" : ""}`}>
                {incorrectRows.includes(rowIndex) ? "❌" : selectedWizard.element}
              </span>
            </div>
          ))}
        </div>
  
        <p className="message">{message}</p>
      </div>
    </div>
  );
}  