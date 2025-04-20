import React, { useState, useEffect } from "react";
import "./App.css";
import { socket } from './socket';
import SoloGame from "./components/soloGame"; 
import PvPGame from "./components/pvpGame"; 

const wizards = [
  {
    id: "fire-mage",
    name: "Fire Mage",
    img: "/images/fire-mage.png",
    spell: "/images/fire-mage-spell.png",
    gif: "/images/fire-mage-casting.gif",
    cast: "/images/fire-mage-cast.png",
    element: "🔥",
    quote: "\"Fire, fire, light the fire\"",
    description: "The fire mage deals extra damage for every remaining attempt left after successfully casting a spell."
  },
  {
    id: "ice-mage",
    name: "Ice Mage",
    img: "/images/ice-mage.png",
    spell: "/images/ice-mage-spell.png",
    gif: "/images/ice-mage-casting.gif",
    cast: "/images/ice-mage-cast.png",
    element: "❄️",
    quote: "\"Chillin' out with the crew in the school yard\"",
    description: "The ice mage temporarily freezes opponent’s after successfully casting a spell."
  },
  {
    id: "nature-mage",
    name: "Nature Mage",
    img: "/images/nature-mage.png",
    spell: "/images/nature-mage-spell.png",
    gif: "/images/nature-mage-casting.gif",
    cast: "/images/nature-mage-cast.png",
    element: "🌼",
    quote: "\"Return to Mother Nature\"",
    description: "The nature mage heals their HP after successfully casting a spell."
  },
  {
    id: "lightning-mage",
    name: "Lightning Mage",
    img: "/images/lightning-mage.png",
    spell: "/images/lightning-mage-spell.png",
    gif: "/images/lightning-mage-casting.gif",
    cast: "/images/lightning-mage-cast.png",
    element: "⚡",
    quote: "\"UNLIMITED POWER!\"",
    description: "The lightning mage deals extra damage based on the remaining time after successfully casting a spell."
  },
  {
    id: "death-mage",
    name: "Death Mage",
    img: "/images/death-mage.png",
    spell: "/images/death-mage-spell.png",
    gif: "/images/death-mage-casting.png",
    cast: "/images/death-mage-cast.png",
    element: "💀",
    quote: "\"...\"",
    description: "The death mage halves enemy player's current time after successfully casting a spell."
  },/*
  { 
    id: "ocean-mage",
    name: "Ocean Mage",
    img: "/images/ocean-mage.png",
    spell: "/images/ocean-mage-spell.png",
    gif: "/images/ocean-mage-casting.gif",
    cast: "/images/ocean-mage-cast.png",
    element: "🔱",
    quote: "\"A\"",
    description: "The ocean mage deals extra base damage after casting a spell."
  } */
];

export default function MainMenu() {
  const [selectedWizard, setSelectedWizard] = useState(wizards[0]);
  const [username, setUsername] = useState("Guest" + Math.floor(Math.random() * 100000));
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [gameMode, setGameMode] = useState(null); // "solo" | "pvp" | null
  const [roomId, setRoomId] = useState("");
  const [inputRoomId, setInputRoomId] = useState("");
  
  const handleExit = () => { // Function to reset game mode
    if (gameMode === "pvp") {  socket.emit('leave', roomId, () => {});  }
    setGameMode(null);
    setRoomId("");
  };

  useEffect(() => {
    if (gameMode === "pvp" && !roomId) {
      socket.emit('createRoom', username, selectedWizard, (newCode) => {
        setRoomId(newCode);
      });
    }
  }, [gameMode, roomId, username, selectedWizard]);

  const handleJoinLobby = () => {
    socket.emit("joinRoom", inputRoomId, username, selectedWizard, (response) => {
      if (response.success) {
        setRoomId(inputRoomId);
        setGameMode("pvp");
        setShowJoinModal(false);
      } else {
        alert(response.message || "Failed to join room.");
      }
    });
  };

  if (gameMode === "solo") { 
    return <SoloGame username={username} selectedWizard={selectedWizard} onExit={handleExit}/>; 
  }
  // PVP
  if (gameMode === "pvp" && roomId) {
    socket.emit('getEnemy', roomId, () => {}); 
    return <PvPGame username={username} selectedWizard={selectedWizard} onExit={handleExit} roomId={roomId} />;
  }
  // Future join PVE
  // if (gameMode === "pve") {  <PvEGame username={username} selectedWizard={selectedWizard} onExit={handleExit} />; }

  return (
    <div className="main-menu">
      <h1 className="title">Wordle Spell Wars</h1>

      <div className="menu-container"> {}
        <div className="panel how-to-play">
          <h2>How To Play</h2>
          <ul>
            <li>Choose a Wizard</li>
            <li>Figure out the word to cast a spell</li>
            <li>Spells inflict damage on your enemy</li>
            <li>Failing to get the word after running out of time or attempts will result in the spell to fizzle and the player to take damage</li>
            <li>Different Wizards have different effects when casting their spell!</li>
          </ul>
        </div>

        {}
        <div className="panel user-panel">
          <label>Username:</label>
          <input
            type="text"
            value={username} maxLength="12"
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={() => setGameMode("solo")}>Practice</button>
          <button onClick={() => setGameMode("pvp")}>Create Lobby</button>
          <button onClick={() => setShowJoinModal(true)}>Join Lobby</button>
        </div>

        {}
        <div className="panel wizard-panel">
          <h2>Select a Wizard!</h2>
          <div className="wizard-options">
            {wizards.map((wizard) => (
              <img
                key={wizard.id}
                src={wizard.img}
                alt={wizard.name}
                className={
                  selectedWizard.id === wizard.id ? "wizard selected" : "wizard"
                }
                onClick={() => setSelectedWizard(wizard)}
              />
            ))}
          </div>

          <div className="wizard-summary">
            <p className="quote">{selectedWizard.quote}</p>
            <p>{selectedWizard.description}</p>
          </div>
        </div>
      </div>
      {showJoinModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Enter Room Code</h2>
            <input
              type="text"
              value={inputRoomId}
              onChange={(e) => setInputRoomId(e.target.value)}
              placeholder="Room Code"
            />
            <div className="modal-buttons">
              <button className = "modal-enter" onClick={handleJoinLobby}>Enter</button>
              <button className = "modal-cancel" onClick={() => setShowJoinModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}