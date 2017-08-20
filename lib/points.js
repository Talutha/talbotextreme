'use strict';

const TIMERS = require('./timers.js');
const timer = TIMERS.showTimers();

// ONLY SEND USER IDs TO THESE FUNCTIONS!

async function getPointsAmount(db, channel, userID) {

  let amount = await db.users.find({ channel: channel, twitch_id: userID});
  return amount[0].points;

}

async function getPointsName(db, channel) {

  let name = await db.channel_settings.find({ channel: channel });
  return name[0].points_name;

}

async function startPointsTimer(db, channel) {

  let channelSettings = await db.channel_settings.find({ channel: channel });
  channelSettings = channelSettings[0];
  if (channelSettings.points_activated === true) {
    let point_amount = channelSettings.points_per_iteration;
    let interval = channelSettings.points_offline_interval;
    timer[channel].startTimer(point_amount, interval);
  }

}

async function modifyPoints(db, channel, userID, amount) {

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
  })

}

module.exports = {
  getPointsAmount: getPointsAmount,
  getPointsName: getPointsName,
  modifyPoints: modifyPoints,
  startPointsTimer: startPointsTimer
}
