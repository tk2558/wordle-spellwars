import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import "./gameplay.css";
import wordList from "../data/wordList.json";
import { socket } from '../socket';

const MAX_ATTEMPTS = 6;
const WORD_LENGTH = 5;
const STARTING_HP = 100;
const STARTING_TIME = 60;
const ENEMY_HP = 100;

function generateWord(wordList) {
  return wordList[Math.floor(Math.random() * wordList.length)].toUpperCase();
}

export default function PvPGame({ selectedWizard, username, onExit, roomId }) {
  const [board, setBoard] = useState(Array(MAX_ATTEMPTS).fill("").map(() => Array(WORD_LENGTH).fill("")));
  const [colors, setColors] = useState(Array(MAX_ATTEMPTS).fill("").map(() => Array(WORD_LENGTH).fill("")));
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [targetWord, setTargetWord] = useState(generateWord(wordList));

  const [enemyhp, setEnemyHP] = useState(ENEMY_HP);
  const [opponentUsername, setOpponentUsername] = useState(null);
  const [opponentReady, setOpponentReady] = useState(false);
  const [enemyWizardImage, setEnemyWizardImage] = useState("./images/loading.png");
  const [enemyWizardImageMini, setEnemyWizardImageMini] = useState("./images/training.png");
  const imgRef = useRef(null);

  const [hp, setHP] = useState(STARTING_HP);
  const [timer, setTimer] = useState(STARTING_TIME);
  const [message, setMessage] = useState("...");
  const [gameOver, setGameOver] = useState(false);
  const [incorrectRows, setIncorrectRows] = useState([]);

  const [spellVisible, setSpellVisible] = useState(false);
  const [spellExploded, setSpellExploded] = useState(false);
  const [fizzleTriggered, setFizzleTriggered] = useState(false);
  const [letterStatuses, setLetterStatuses] = useState({}); 

  const [empowering, setEmpowering] = useState(false);
  const elementRefs = useRef([]);
  const wizardRef = useRef(null);
  const gameBoxRef = useRef(null);

  const bgmRef = useRef(null);
  const empowerSound = useRef(null);
  const explodeSound = useRef(null);
  const fizzleSound = useRef(null);

  const [ready, setReady] = useState(false);
  const [gameStart, setGameStart] = useState(false);
  const readyBtnRef = useRef(null);
  const msgRef = useRef(null);

  //const [players, setPlayers] = useState([]);

  const handleReady = () => { // Function to reset game mode
    socket.emit('setPlayerReady', ready, roomId, () => {}); 
    setReady((prev) => !prev);
  };

  const keyboardRows = useMemo(() => [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ["Enter", 'Z','X','C','V','B','N','M', '✖️']
  ], []);
  
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
    setLetterStatuses({});
    setEnemyHP(ENEMY_HP);

    if (success) {
      elementRefs.current.forEach((el) => {
        if (!el) return;
        const wizardRect = wizardRef.current.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const dx = wizardRect.left - elRect.left;
        const dy = wizardRect.top - elRect.top;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        el.style.opacity = "1";
      });
      wizardRef.current.src = `${selectedWizard.gif}`
    }
  }, [hp, selectedWizard]);

  const triggerDamageAnimation = () => {
    if (!gameBoxRef.current) return;
    gameBoxRef.current.classList.remove('takeDMG');
    void gameBoxRef.current.offsetWidth; 
    gameBoxRef.current.classList.add('takeDMG');
    gameBoxRef.current.addEventListener('animationend', () => {
      gameBoxRef.current.classList.remove('takeDMG');
    }, { once: true });
  };

  const handleFizzle = useCallback(() => {
    setMessage("Spell Fizzled! Cast a New One!");
    fizzleSound.current.play();
    setHP((prev) => Math.max(prev - 20, 0));
    triggerDamageAnimation();
    setTimeout(() => resetRound(false), 500);
  }, [resetRound, fizzleSound]);

  useEffect(() => { // Keyboard
    if (!gameStart) { return; }
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

  useEffect(() => { // Socket
    socket.emit('getEnemy', roomId, () => {}); 
    socket.on('opponentInfo', (enemy) => {
      console.log(enemy);
      setOpponentUsername(enemy.username);
      setEnemyWizardImage(enemy.wizard.img);
      setEnemyWizardImageMini(enemy.wizard.cast);
      imgRef.current.style.display = 'inline';
    });

    socket.on('opponentReady', (ready) => { setOpponentReady(ready); });

    socket.on('bothPlayersReady', () => {
      console.log("GAME STARTED!")
      readyBtnRef.current.style.display = 'none';
      msgRef.current.style.display = 'inline';
      setGameStart(true);
    });

    return () => {
      socket.off('opponentInfo');
      socket.off('opponentReady');
      socket.off('opponentUnready');
      socket.off('bothPlayersReady');
    };
  }, [roomId]);

  useEffect(() => { // Sound Effects
    empowerSound.current = new Audio('./audio/empower.wav');
    explodeSound.current = new Audio('./audio/explosion.wav');
    fizzleSound.current = new Audio('./audio/fizzle.wav');
    fizzleSound.current.volume = .1;
  }, [empowerSound, explodeSound, fizzleSound]);

  useEffect(() => { // Timer
    if (gameOver || fizzleTriggered || spellVisible || !gameStart) return;
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
  }, [gameOver, fizzleTriggered, spellVisible, gameStart]);
  
  useEffect(() => { // Trigger Fizzle ONCE when timer hits 0
    if (timer <= 0 && !gameOver && !fizzleTriggered) {
      setFizzleTriggered(true);
      handleFizzle();
    }
  }, [timer, gameOver, fizzleTriggered, handleFizzle]);

  useEffect(() => { // Spell Casted
    if (!spellVisible) return;
    const explodeTimeout = setTimeout(() => {
      setSpellExploded(true);
      explodeSound.current.play();
      // if (selectedWizard.id === "fire-mage") {setEnemyHP((prev) => prev - 100);} // Test
      setEnemyHP((prev) => prev - 20);
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
  }, [spellVisible, resetRound, explodeSound, selectedWizard]);

  useEffect(() => { // Empower Spell
    if (empowering) {
      elementRefs.current.forEach((el) => {
        if (!el) return; // el.textContent === "❌" to get remaining attempts
        const wizardRect = wizardRef.current.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
  
        const dx = wizardRect.left - elRect.left;
        const dy = wizardRect.top - elRect.top;

        el.style.transform = `translate(${dx}px, ${dy}px)`;
        el.style.opacity = "0";
      });
      empowerSound.current.play();
    }
  }, [empowering, empowerSound]);

  useEffect(() => { // BGM
    bgmRef.current = new Audio('./audio/bgm.wav');
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.05; 
    bgmRef.current.play().catch((e) => {console.log(e);});
    return () => { // reset when exiting solo
      bgmRef.current.pause();
      bgmRef.current.currentTime = 0; 
    };
  }, [bgmRef]);

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
    const newStatuses = { ...letterStatuses };
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
        newStatuses[guess[i]] = 'correct';
        targetLetters[i] = null;
        continue;
      }
      const index = targetLetters.indexOf(guess[i]);
      if (index !== -1) {
        newColors[i] = "yellow";
        targetLetters[index] = null;
        if (newStatuses[guess[i]] === 'correct') { continue; } else { newStatuses[guess[i]] = 'present'} ;
      }
      else { newStatuses[guess[i]] = 'absent'; }
    }

    const newColorBoard = [...colors];
    newColorBoard[currentAttempt] = newColors;
    setColors(newColorBoard);
    setLetterStatuses(newStatuses);

    if (guess === targetWord) {
      setEmpowering(true);
      wizardRef.current.src = `${selectedWizard.cast}`
      setTimeout(() => {
        setEmpowering(false);
        setSpellVisible(true);
        setMessage(`Spell Successfully Casted! ${selectedWizard.element}`);
      }, 600);
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
  
  return (
    <div className="solo-game-container">
      <div className="game-header">
        <div className="spell-counter">Room Id: {roomId}</div>
        <button className="exit" onClick={onExit}>Leave</button>
      </div>
      <div className = "game-container">
        <div className="game-box">
          <div className="status-header">
            <p className="username" ref={gameBoxRef}>{username} - {hp} HP</p>
            <p className="readyBtn" ref={readyBtnRef} style={{ backgroundColor: ready ? '#6aaa64' : '#444' }} onClick={handleReady}>Ready</p>
            <p className="message" ref={msgRef} style={{ display: `none`}}>{message}</p>
            <div className ="banner">
              <img src={`${selectedWizard.gif}`} alt="Wizard" className="wizard-icon" ref={wizardRef}/>
              <img
                src={spellExploded ? "./images/explode.png" : selectedWizard.spell} alt="Wizard-spell"
                className={`wizard-spell ${spellVisible ? "spell-active" : ""}`}
                style={{ visibility: spellVisible || spellExploded ? "visible" : "hidden" }}
              />
              <img src={ enemyWizardImageMini } ref={imgRef} alt="dummy" className="training-dummy" style={{ display: `none`, transform: `ScaleX(-1)` }}/>
            </div>
            <div className="timer-bar-container">
              <div className={`timer-bar ${timer <= 10 ? "danger" : timer <= 30 ? "warning" : ""}`} style={{ width: `${(timer / STARTING_TIME) * 100}%` }} />
            </div>
          </div>
          <div className="wordle-board">
            {board.map((row, rowIndex) => (
              <div key={rowIndex} className="wordle-row">
                {row.map((letter, colIndex) => (
                  <div
                    key={colIndex}
                    className={`wordle-tile ${colors[rowIndex][colIndex]}`}>
                    {letter}
                  </div>
                ))}
                <span
                  ref={(el) => (elementRefs.current[rowIndex] = el)}
                  className={`row-element ${empowering && rowIndex > currentAttempt ? "empowering-icon" : ""}`}>
                  {incorrectRows.includes(rowIndex) ? "❌" : selectedWizard.element}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="info-container">
          <h2> {gameStart ? `${opponentUsername} - ${ENEMY_HP} HP` :  
          opponentUsername ? `${opponentUsername} - ${opponentReady ? "Ready" : "Not Ready"}` : "Waiting for another player..."
          }
          </h2>
          <img src={enemyWizardImage} alt="Enemy-Dummy" className="enemy-image" style={{ transform: `ScaleX(-1)` }}/>
          <img src="./images/explode.png" alt="Enemy-explode" className="explosion" 
          style={{ visibility: spellExploded ? "visible" : "hidden" }}/>
          <div className="enemy-health-bar">
            <div className="enemy-hp" style={{ width: `${(enemyhp/ ENEMY_HP) * 100}%` }}></div>
          </div>
          <hr className="divider" />
          <div className="keyboard-preview">
            {keyboardRows.map((row, rowIndex) => (
              <div key={rowIndex} className="keyboard-row">
                {row.map((letter) => (
                  <button
                    key={letter}
                    className={`key ${letterStatuses[letter] || ''}`}
                    disabled>
                    {letter}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}  