'use strict';

const TIMERS = require('./timers.js');
const CDSTRINGS = require('./cdStrings.js');
const USERS = require('./users.js');
const POINTS = require('./points.js');

/*
  Chicken Dinner Idea:
    Players sign up using a chosen number of points.  Lobby is created for 5
    minutes.  After lobby closes, game begins.  Every two minutes, one or two
    players are chosen at random and one randomly wins(in the event of a single
    player chosen, they die).  Game goes until one player is remaining.  Top
    3 players get points back, 50%, 30%, 20%.  Game can go long and is only 
    available once per hour.
*/

// Input: [chickendinner, 100]
async function serve(db, channel, userstate, client, message) {
  
  let amount = Math.abs(parseInt(message[1]));
  let cdStatus = TIMERS.showTimers()[channel].chickenDinner;
  let currentState = cdStatus.state;
  let participants = cdStatus.participants;
  let hasEnoughPoints = await POINTS.hasEnoughPoints(
    db, channel, userstate['user-id'], amount
  );

  // check if user has enough points or is already signed up
  if (!hasEnoughPoints || participants.includes(userstate['user-id'])) {
    return;
  }

  // if no chicken dinner is running and game is available
  if (currentState === 'available' && 
                        cdStatus.activated && 
                        !cdStatus.cooldown
  ) {
    cdStatus.cooldown = true;
    cdStatus.state = 'lobby';
    participants.push(userstate['user-id']);
    // Send start warning in 2:30 minutes.
    // Not sure if I need a timer stored in the timer object for each channel
    // but it seemed safer to do it this way.
    client.say(channel, `@${userstate['display-name']} has challenged ` + 
    'everyone to a "!chickendinner"! The battle begins in 5 minutes!');
    await spendPoints();
    cdStatus.timer(startingSoon, 150000);
  } else if (currentState === 'lobby') {
    spendPoints();
    participants.push(userstate['user-id']);
  }

  function startingSoon() {
    client.say(channel, 'The battle for a !chickendinner will begin in ' + 
    '2 minutes and 30 seconds!');
    cdStatus.timer(battleBegins, 150000);
  }

  function battleBegins() {
    cdStatus.state = 'in-progress';
    calcPrizePool();
    client.say(channel, 'The battle for a !chickendinner has begin! '+ 
    'We should be receiving the first set of outcomes soon...');
    cdStatus.timer(cdFight, 120000);
  }

  async function cdFight() {

    if (participants.length <= 3) {

      // Do something here for the top 3
      let loser = randArray(participants);
      let loserID = loser;
      let pointsName = await POINTS.getPointsName(db, channel);
      participants.splice(participants.indexOf(loser), 1);
      loser = await USERS.toDisplayName(loser);
      loser = '@' + loser;

      let winner = randArray(participants);
      let winnerID = winner;
      winner = await USERS.toDisplayName(winner);
      winner = '@' + winner;

      let outcome = randArray(CDSTRINGS.duo);
      outcome = outcome.replace('@L', loser);
      outcome = outcome.replace('@W', winner);
      client.say(channel, outcome);

      if (participants.length === 2) {
        // give third place player his points
        POINTS.modifyPoints(db, channel, loserID, cdStatus.pot.third);
        client.say(channel, `${loser} came in third and won ` + 
          `${cdStatus.pot.third} ${pointsName}!`);

        cdStatus.timer(cdFight, 120000);
      } else {
        // give second and first place players their points
        POINTS.modifyPoints(db, channel, loserID, cdStatus.pot.second);
        POINTS.modifyPoints(db, channel, winnerID, cdStatus.pot.first);
        client.say(channel,
          `${winner} came in FIRST place and won ` +
          `${cdStatus.pot.first} ${pointsName}! ${loser} came in SECOND ` +
          `winning ${cdStatus.pot.second} ${pointsName}!`
        );

        cdStatus.state = 'available';
        cdStatus.participants = [];
      }

    } else {

      // Choose one or two random people and select one winner
      let singleParticipant = false;
      // % chance to get a single participant event
      let singleChance = 20;

      if (Math.round(Math.random()*100) <= singleChance) {
        singleParticipant = true;
      }

      let loser = randArray(participants);
      participants.splice(participants.indexOf(loser), 1);
      loser = await USERS.toDisplayName(loser);
      loser = '@' + loser;
      // If singleParticipant is true we just throw out the winner
      let winner = randArray(participants);
      winner = await USERS.toDisplayName(winner);
      winner = '@' + winner;

      if (singleParticipant) {
        // Single Participant outcome here
        let outcome = randArray(CDSTRINGS.solo);
        outcome = outcome.replace('@L', loser);
        client.say(channel, outcome);
      } else {
        let outcome = randArray(CDSTRINGS.duo);
        outcome = outcome.replace('@L', loser);
        outcome = outcome.replace('@W', winner);
        client.say(channel, outcome);
      }

      cdStatus.timer(cdFight, 120000);

    }

    

  }

  async function spendPoints() {
    let subAmount = -Math.abs(amount);
    await POINTS.modifyPoints(db, channel, userstate['user-id'], subAmount);
    cdStatus.pot.total += amount;
  }

  function calcPrizePool() {
    // % of points that is removed from pool
    let houseCut = 10;
    let totalPool = cdStatus.pot.total;

    totalPool = Math.floor(totalPool - ((houseCut/100) * totalPool));

    // 1st: 50%, 2nd: 30%, 3rd: 20%
    cdStatus.pot.first = Math.ceil(((50/100) * totalPool));
    cdStatus.pot.second = Math.ceil(((30/100) * totalPool));
    cdStatus.pot.third = Math.ceil(((20/100) * totalPool));

  }

}

function randArray(arr) {
  return arr[Math.floor(Math.random()*arr.length)];
}

module.exports = {
  serve
};