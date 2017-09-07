'use strict';

const TIMERS = require('./timers.js');
const CDSTRINGS = require('./cdStrings.js');
const USERS = require('./users.js');
const POINTS = require('./points.js');
const DB = require('./database.js');

async function serve(channel, userstate, client, message) {

  try {

    let db = await DB.db;
    let gameState = TIMERS.showTimers()[channel].chickenDinner;
    let userID = userstate['user-id'];
    let amount = Math.abs(parseInt(message[1]));
    let hasEnoughPoints = POINTS.hasEnoughPoints(db, channel, userID, amount);

    if (!hasEnoughPoints || gameState.state === 'in-progress') {
      return false;
    } else if (gameState.cooldown === true) {
      client.say(channel, 'The plane is currently refueling. !chickendinner ' + 
      'will be available again at the top of the hour!');
    } else if (gameState.state === 'lobby') {
      this.lobby(userstate, amount, gameState);
    } else {
      this.prepare(channel, userstate, client, amount, gameState);
    }

  } catch (err) {
    console.log(err);
  }

}

async function prepare(channel, userstate, client, amount, gameState) {

  try {
    gameState = this.changeState(gameState, 'lobby');
    gameState = this.resetPot(gameState);

    this.lobby(userstate, 100, gameState);

    client.say(channel, `@${userstate['display-name']} has challenged ` + 
    'everyone to a "!chickendinner"! The battle begins in 5 minutes!');
  } catch (err) {
    console.log(err);
  }

}

async function lobby(userstate, amount, gameState) {
  addToPot(amount, gameState);

  return gameState;

}

function addToPot(amount, gameState) {
  gameState.pot.total += amount;

  return gameState;
}

function changeState(gameState, status) {
  gameState.state = status;

  return gameState;
}

function resetPot(gameState) {
  gameState.pot.total = 0;
  
  return gameState;
}

module.exports = {
  serve,
  prepare,
  lobby,
  changeState,
  resetPot
};