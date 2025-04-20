# Wordle-SpellWars

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).
The purpose of this project was to create a game based on the mechanics of Wordle with a theme of Wizards casting spells.

## Gameplay

Players choose a type of Elemental Wizard to play as and solve Wordle puzzles to cast spells.\
Each Wizard has different effect upon casting spells.

In PvP mode: 2 Players will continously cast spells to damage each other until one Player hits 0 hp\
Failing to cast a spell by either not figuring out the right word or running out time will cause the spell to fizzle.
When a spell fizzles it, the spellcaster will take recoil damage

### Single Player && Multi Player:
To use run the application use command `npm start` to concurrently run `cd client -> npm start` and `cd sever -> node . `
After running both, host must forward ports 3000 and 3001 in public visibility 

For Single-player, you can play practice mode infinitely against a training dummy

For Multi-player, players can create a lobby and other players may join lobbies to play against each other

### Main Menu
![Main Menu](client\public\screenshots\Main-Menu.JPG)

### Practice Mode
![Solo Practice Mode](client\public\screenshots\Practice-Mode.JPG)

### Lobby Mulitplayer (Waiting for Another player to join)
![Lobby](client\public\screenshots\Lobby.JPG)