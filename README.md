# Wordle-SpellWars

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).
The purpose of this project was to create a game based on the mechanics of Wordle with a theme of Wizards casting spells.

## Gameplay

Players choose a type of Elemental Wizard to play as and solve Wordle puzzles to cast spells.\
Each Wizard has different effect upon casting spells.

In PvP mode: 2 Players will continously cast spells to damage each other until one Player hits 0 hp\
Failing to cast a spell by either not figuring out the right word or running out time will cause the spell to fizzle.
When a spell fizzles it, the spellcaster will take recoil damage

### Single Player `cd client -> npm start`
Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

You can play practice mode this way and play infinitely against a training dummy

### Multi Player `cd client -> npm start, cd server -> node .`
Accessing multiplayer requires the user to run both the client and server files 
After running both, host must forward ports 3000 and 3001 in public visibility 

*replace export const socket = io('http://localhost:3001'); in socket.js with

export const socket = io('${forward_port_3001_url}', {
    path: '/socket.io',           
    transports: ['websocket'],    
    secure: true,                 
  });

When these conditions are filled, other players may create and join lobbies to play against each other