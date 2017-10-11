'use strict';

const TIMERS = require('./timers.js');
const CDSTRINGS = require('./cdStrings.js');
const USERS = require('./users.js');
const POINTS = require('./points.js');
const DB = require('./database.js');

async function serve(channel, userstate, client, message) {

  try {

    let db = await DB.getDB();
    let gameState = TIMERS.showTimers()[channel].chickenDinner;
    let userID = userstate['user-id'];
    let amount = Math.abs(parseInt(message[1]));
    let hasEnoughPoints = await POINTS.hasEnoughPoints(
      db, channel, userID, amount
    );

    if (!hasEnoughPoints || gameState.state === 'in-progress' || amount < 1) {
      return false;
    } else if (gameState.state === 'lobby') {
      this.lobby(channel, userstate, amount, gameState);
    } else if (gameState.cooldown === true) {
      client.say(channel, 'The plane is currently refueling. !chickendinner ' + 
      'will be available again at the top of the hour!');
    } else {
      this.prepare(channel, userstate, client, amount, gameState);
    }

  } catch (err) {
    console.log(err);
  }

}

async function prepare(channel, userstate, client, amount, gameState) {

  gameState = this.changeState(gameState, 'lobby');
  gameState = this.resetPot(gameState);
  gameState.participants = [];
  gameState.cooldown = true;

  this.lobby(channel, userstate, amount, gameState);

  client.say(channel, `@${userstate['display-name']} has challenged ` + 
  'everyone to a "!chickendinner"! The battle begins in 5 minutes!');

  gameState.timer(
    this.halfWayPreparation.bind(this, channel, client, gameState), 
    150000
  );

}

async function lobby(channel, userstate, amount, gameState) {

  let playerParticipating = playerAlreadyParticipating(userstate, gameState);
  
  if (!playerParticipating) {
    
    this.addToPot(channel, userstate, amount, gameState);
    this.addParticipant(userstate['user-id'], gameState);

  }

  return gameState;

}

function playerAlreadyParticipating(userstate, gameState) {

  let userID = userstate['user-id'];

  return gameState.participants.includes(userID);

}

function halfWayPreparation(channel, client, gameState) {

  client.say(channel, 'The battle for a !chickendinner will begin in ' + 
  '2 minutes and 30 seconds!');

  gameState.timer(
    this.battleReadyCheck.bind(this, channel, client, gameState),
    150000
  );

}

function battleReadyCheck(channel, client, gameState) {

  if (gameState.participants.length <= 1) {
    this.cancelGame(channel, client, gameState);
  } else {
    this.setRewards(gameState);
    client.say(channel, 'The battle for a !chickendinner has begun! '+ 
      'We should be receiving the first set of outcomes soon...');

    this.changeState(gameState, 'in-progress');

    gameState.timer(this.fightRouting.bind(this, channel, client, gameState), 
      120000
    );
  }
}

async function cancelGame(channel, client, gameState) {
  try {
    let db = await DB.getDB();
    let userID = parseInt(gameState.participants.join(''));
    let amount = gameState.pot.total;
    let pointsName = await POINTS.getPointsName(db, channel);
    
    client.say(channel, 'Unfortunately there were not enough people ' +
    `signed up for !chickendinner. ${pointsName} have been refunded.`);

    gameState.cooldown = false;
    this.changeState(gameState, 'available');

    POINTS.modifyPoints(db, channel, userID, amount);
  } catch (err) {
    console.log(err);
  }
}

function setRewards(gameState) {
  let houseCut = 10;
  let totalPool = gameState.pot.total;

  gameState.pot.total = totalPool - getPercentage(houseCut, totalPool);

  let cutPool = gameState.pot.total;

  gameState.pot.first = getPercentage(50, cutPool);
  gameState.pot.second = getPercentage(30, cutPool);
  gameState.pot.third = getPercentage(20, cutPool);

}

function getPercentage(perc, amount) {
  let result = (perc/100)*amount;
  result = Math.ceil(result);
  return result;
}

async function fightRouting(channel, client, gameState) {
  let db = await DB.getDB();
  let pointsName = await POINTS.getPointsName(db, channel);
  let participantAmount = gameState.participants.length;
  let outcome = await this.determineOutcome(channel, client, gameState);
  let winner = await USERS.toDisplayName(outcome.winner);
  let loser = await USERS.toDisplayName(outcome.loser);
  
  if (participantAmount === 3) {
    this.giveReward(channel, client, gameState, outcome.loser, 'third');

    client.say(channel, `${loser} came in third and won ` + 
    `${gameState.pot.third} ${pointsName}!`);
  } else if (participantAmount === 2) {
    this.giveReward(channel, client, gameState, outcome.loser, 'second');
    this.giveReward(channel, client, gameState, outcome.winner, 'first');

    client.say(channel,
      `${winner} came in FIRST place and won ` +
      `${gameState.pot.first} ${pointsName}! ${loser} came in SECOND ` +
      `winning ${gameState.pot.second} ${pointsName}!`);
  }

  if ( participantAmount > 2 ) {
    gameState.timer(this.fightRouting.bind(this, channel, client, gameState), 
      120000
    );
  } else {
    gameState = this.changeState(gameState, 'available');
  }
}

async function determineOutcome(channel, client, gameState) {

  let soloEncounter = this.soloEncounter();
  let loser = this.randArr(gameState.participants);
  gameState = this.removeLoser(loser, gameState);
  let winner = this.randArr(gameState.participants);
  let weapon = this.randArr(CDSTRINGS.weapons);
  let location = this.randArr(CDSTRINGS.locations);
  let scenario;

  if (soloEncounter) {
    scenario = this.randArr(CDSTRINGS.solo);
  } else {
    scenario = this.randArr(CDSTRINGS.duo);
  }

  await this.parseOutcome(channel, client, loser, winner, weapon, location, scenario);
  let outcome = { winner: winner, loser: loser };

  return outcome;

}

async function parseOutcome(
  channel, client, loser, winner, weapon, location, scenario
) {
  let loserName = await USERS.toDisplayName(loser);
  let winnerName = await USERS.toDisplayName(winner);
  let parsedScenario = scenario;

  parsedScenario = parsedScenario.replace(/@L/g, loserName);
  parsedScenario = parsedScenario.replace(/@W/g, winnerName);
  parsedScenario = parsedScenario.replace(/@G/g, weapon);  
  parsedScenario = parsedScenario.replace(/@P/g, location);

  client.say(channel, parsedScenario);
}

function soloEncounter() {

  let singleChance = 20;
  
  if (Math.round(Math.random()*100) <= singleChance) {
    return true;
  }

  return false;

}

function randArr(arr) {
  
  return arr[Math.floor(Math.random()*arr.length)];
}

function removeLoser(loser, gameState) {

  gameState.participants.splice(gameState.participants.indexOf(loser), 1);
  return gameState;

}

async function giveReward(channel, client, gameState, outcome, place) {
  let db = await DB.getDB();
  let userID = outcome;
  
  let amount = gameState.pot[place];

  POINTS.modifyPoints(db, channel, userID, amount);
}

async function addToPot(channel, userstate, amount, gameState) {
  let db = await DB.getDB();
  let userID = userstate['user-id'];
  let removeAmount = -Math.abs(amount);
  POINTS.modifyPoints(db, channel, userID, removeAmount);
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

function addParticipant(userID, gameState) {
  gameState.participants.push(userID);

  return gameState;
}

module.exports = {
  serve,
  prepare,
  lobby,
  changeState,
  resetPot,
  addToPot,
  addParticipant,
  halfWayPreparation,
  battleReadyCheck,
  cancelGame,
  setRewards,
  fightRouting,
  getPercentage,
  determineOutcome,
  giveReward,
  randArr,
  removeLoser,
  soloEncounter,
  parseOutcome
};