'use strict';

const DB = require('./database.js');

var db;

(async function() {
  db = await DB.db;
});

// ONLY SEND USER IDs TO THESE FUNCTIONS!

async function getPointsAmount(db, channel, userID) {

  let amount = await db.users.find({ channel: channel, twitch_id: userID });
  return amount[0].points;

}

async function getPointsName(db, channel) {

  let name = await db.channel_settings.find({ channel: channel });
  return name[0].points_name;

}

async function modifyPoints(db, channel, userID, amount) {
  try {

    let currentAmount = await getPointsAmount(db, channel, userID);
    let newAmount = parseInt(currentAmount) + parseInt(amount);

    // Do not allow points to go negative
    if (newAmount < 0) {
      newAmount = 0;
    }

    // Update database with new point amount
    await db.users.update({
      twitch_id: userID,
      channel: channel
    }, {
      points: newAmount
    });
  } catch (err) {
    console.log('modifyPoints error:');
    console.log(err);
  }

}

async function hasEnoughPoints(db, channel, userID, amountSpending) {
  let amountInBank = await getPointsAmount(db, channel, userID);

  if (amountSpending < amountInBank) {
    return true;
  }

}

module.exports = {
  getPointsAmount: getPointsAmount,
  getPointsName: getPointsName,
  modifyPoints: modifyPoints,
  hasEnoughPoints: hasEnoughPoints
};


