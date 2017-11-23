'use strict';

const DB = require('./database.js');

var db;

(async function() {
  db = await DB.db;
});

// ONLY SEND USER IDs TO THESE FUNCTIONS!

// deprecated, use Points.getAmount in users.js
async function getPointsAmount(db, channel, userID) {

  console.log('This is a deprecated function, please get points from users.js');

  let amount = await db.users.find({ channel: channel, twitch_id: userID });
  return amount[0].points;

}

// deprecated, use getPointsName in channels.js
async function getPointsName(db, channel) {

  console.log('This is a deprecated function, please get points name from ' +
    'channels.js');

  let name = await db.channel_settings.find({ channel: channel });
  return name[0].points_name;

}

// deprecated, use Points.modify in users.js
async function modifyPoints(db, channel, userID, amount) {

  console.log('This is a deprecated function, please modify points from users.js');

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

// deprecated, use Points.hasEnough in users.js
async function hasEnoughPoints(db, channel, userID, amountSpending) {

  console.log('This is a deprecated function, please check points from users.js');
  
  let amountInBank = await getPointsAmount(db, channel, userID);

  if (amountSpending <= amountInBank) {
    return true;
  } else {
    return false;
  }

}

module.exports = {
  getPointsAmount: getPointsAmount,
  getPointsName: getPointsName,
  modifyPoints: modifyPoints,
  hasEnoughPoints: hasEnoughPoints
};


